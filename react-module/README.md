## [Reusable React Module](https://github.com/insin/templates/tree/master/react-lib)

A template for creating a reusable [React](http://facebook.github.io/react)
module which will be published to npm and also provide a browser bundle which
exports a single global variable.

[Download](https://github.com/insin/templates/archive/master.zip) and extract,
then install dependencies:

```
npm install
```

### package.json settings

The build script requires the following to be set up in package.json:

* `name` - used as the browser bundle filename and in its header comment
* `standalone` - global variable name exported from the browser bundle
* `mail` - entry point for the module; default is `'./lib/index.js'`
* `version` - default is `'1.0.0'`
* `homepage` - used in the browser bundle header comment
* `license` - used in the browser bundle header comment; default is `'MIT'` (a
  template MIT `LICENSE.md` file is also included)

The build script expects to find [JSHint config](http://jshint.com/docs/options/)
in `./.jshintrc`, so a default is provided - drop your own in, though! It's
worth taking a few minutes to set one up as per your preferences if you don't
already have one, promise!

React is configured as a [peer dependency](http://blog.nodejs.org/2013/02/07/peer-dependencies/)
to avoid silently pulling in multiple versions of React if there's a mismatch
with the version expected by your module and any project it's being used in.

Default `browserify-shim` config is set up to shim both `require('react') and
`require('react/addons')` to a global `React` variable in the browser bundle. If
you have other dependencies which ship browser global versions, add them in here
in the same manner.

### Directory structure

Source code (which may use JSX and [ES6 transforms supported by react-tools](https://github.com/facebook/jstransform/tree/master/visitors))
lives in `src/`.

JavaScript is transpiled from `src/` into `lib/` - this is what will get
published to npm if you run `npm publish`.

The entry point for the module is expected to be './lib/index.js' - this is set
up as the default in package.json.

`.gitignore` is preconfigured to ignore 'lib/' and `node_modules/`

`.npmignore` is preconfigured to ignore almost everything except `lib/`.

### npm scripts

`npm run watch` - watch `src/', transpiling source code into `lib/`, linting and
creating a browser bundle in `dist/` on every change.

`npm run debug` - does the same as `npm run watch` but also includes a sourcemap
in the browser bundle.

`npm run dist` - creates a release version of the browser bundle, writing both
uncompressed `.js` and compressed `.min.js` versions to `dist/`.
