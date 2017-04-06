simpleheat2
==========

An improved version of [simpleheat](https://github.com/mourner/simpleheat), which supports different blending mode for overlapped heat circles.

simpleheat2 demo at http://perthblank.github.io/simpleheat2/demo/.

#### Basic Usage
Check [simpleheat](https://github.com/mourner/simpleheat) for basic usage.

#### Set Blending Mode

```js
heat.blendMode(modeOption);
```
where modeOption is one of the following:
* `"overlay"` (default)
* `"mean"`
* `"min"`
* `"max"`

