# rollup-plugin-mxn-jsx

Rollup JSX plugin that transpiles JSX into JavaScript

- ~6.1kb size
- ~2.5kb minified + gzipped

This is a wrapper around [mxn-jsx-ast-transformer](https://github.com/ZimNovich/mxn-jsx-ast-transformer). Make sure to go check that out for options.

Install it with `npm install rollup-plugin-mxn-jsx`

## Usage

Use it like this in your rollup.config:

```js
import rollupMxnJsx from "rollup-plugin-mxn-jsx";

export default {
	input: "src/index.js",
	external: [
		"preact",
		"prop-types"
	],
	output: {
		file: "bundle/bundle.js",
		format: "iife",
		name: "App",
		sourcemap: false,
		globals: {
			"preact": "preact",
			"prop-types": "PropTypes"
		}
	},
	plugins: [
		rollupMxnJsx({
			factory: "h",
			include: ["*.js", "*.jsx"]
		})
	]
};

```

## License

This module is released under the MIT license.
