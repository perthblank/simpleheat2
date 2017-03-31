'use strict';

if (typeof module !== 'undefined') module.exports = simpleheat;

function simpleheat(canvas) {
    if (!(this instanceof simpleheat)) return new simpleheat(canvas);

    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;

    this._max = 1;
    this._data = [];

    this._mixGrayScale = this._mixSuperImposed;
}

simpleheat.prototype = {

    defaultRadius: 25,

    defaultGradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },

    data: function (data) {
        this._data = data;
        return this;
    },

    max: function (max) {
        this._max = max;
        return this;
    },

    add: function (point) {
        this._data.push(point);
        return this;
    },

    clear: function () {
        this._data = [];
        return this;
    },

    radius: function (r, blur) {
        blur = blur === undefined ? 15 : blur;

        // create a grayscale blurred circle image that we'll use for drawing points
        var circle = this._circle = this._createCanvas(),
            ctx = circle.getContext('2d'),
            r2 = this._r = r + blur;

        circle.width = circle.height = r2 * 2;

        ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
        ctx.shadowBlur = blur;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        return this;
    },

    resize: function () {
        this._width = this._canvas.width;
        this._height = this._canvas.height;
    },

    gradient: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = this._createCanvas(),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(+i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
    },

    draw: function (minOpacity) {
        if (!this._circle) this.radius(this.defaultRadius);
        if (!this._grad) this.gradient(this.defaultGradient);

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = this._mixGrayScale(minOpacity);
        this._colorize(colored.data, this._grad);
        this._ctx.putImageData(colored, 0, 0);

        return this;
    },

    mixMode: function (mode) {
        if (mode="SuperImposed") this._mixGrayScale = this._mixSuperImposed;
        if (mode="Averaged") this._mixGrayScale = this._mixAveraged;
    },

    _mixSuperImposed: function (minOpacity) {
        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);

        // draw a grayscale heatmap by putting a blurred circle at each data point
        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            ctx.globalAlpha = Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity);
            ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
        }

        return ctx.getImageData(0, 0, this._width, this._height);
    },

    _mixAveraged: function (minOpacity) {
        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);

        // store the pixel data in imageDataCanvas
        var imageDataCanvas = ctx.getImageData(0, 0, this._width, this._height),
            diameter = this._r*2,
            imageDataCircle = this._circle.getContext("2d").getImageData(0,0,diameter, diameter),

            globalAlpha,
            offsetX, offsetY,
            crow, ccol,
            circlePixl, canvasPixl, canvasIndex,
            currentAlpha,

            overlayCounter = new Array(this._width*this._height);

        for(var r = 0; r<overlayCounter.length; ++r)
            overlayCounter[r] = 0;

        for (var i = 0, len = this._data.length, p; i < len; i++) 
        {
            p = this._data[i];

            globalAlpha = Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity);
            offsetX = Math.floor(p[0] - this._r);
            offsetY = Math.floor(p[1] - this._r);


            for (var ii = 0, llen = imageDataCircle.data.length; ii < llen; ii += 4) 
            {
                circlePixl = ii/4;
                crow = Math.floor((circlePixl)/diameter);
                ccol = Math.floor((circlePixl)%diameter);
                canvasIndex = ((crow+offsetY)*this._width*4+(ccol+offsetX)*4);
                canvasPixl = canvasIndex/4;
                currentAlpha = imageDataCircle.data[ii+3]*globalAlpha;
                if(currentAlpha>0)
                {
                    imageDataCanvas.data[canvasIndex+3] = 
                        (overlayCounter[canvasPixl]*imageDataCanvas.data[canvasIndex+3]+currentAlpha)/
                            (overlayCounter[canvasPixl]+1);
                    overlayCounter[canvasPixl] += 1;
                }

            }
        }

        return imageDataCanvas;
    },

    _colorize: function (pixels, gradient) {
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i + 3] * 4; // get gradient color from opacity value

            if (j) {
                pixels[i] = gradient[j];
                pixels[i + 1] = gradient[j + 1];
                pixels[i + 2] = gradient[j + 2];
            }
        }
    },

    _createCanvas: function () {
        if (typeof document !== 'undefined') {
            return document.createElement('canvas');
        } else {
            // create a new canvas instance in node.js
            // the canvas class needs to have a default constructor without any parameter
            return new this._canvas.constructor();
        }
    }
};
