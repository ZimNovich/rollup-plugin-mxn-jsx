// Rollup-Plugin-MXN-JSX - Rollup JSX plugin that transpiles JSX into JavaScript
// Copyright (c) 2020 Ilya Zimnovich
//
// On Rollup plugin documentation see:
// - https://github.com/rollup/rollup/blob/master/docs/05-plugin-development.md

const { resolve, sep } = require("path");
const glob = require("@jsxtools/glob"); // Glob to RegExp
const MagicString = require("magic-string");

// Acorn & Astring
const acornJsx = require("acorn-jsx");
const { generate } = require("astring");

// JSX AST Transformer
const transformAST = require("mxn-jsx-ast-transformer");

// Helper functions inspired by rollup-pluginutils
const ensureArray = function(thing) {
    if ( Array.isArray(thing) ) return thing;
    if ( thing == null || thing == undefined ) return [];
    return [ thing ];
}

const createFilter = function(include, exclude, prepend)
{
    // Convert wildcards to arrays of glob RegExps
    include = ensureArray(include).map(wildcard => prepend + wildcard ).map(wildcard => glob(wildcard) );
    exclude = ensureArray(exclude).map(wildcard => prepend + wildcard ).map(wildcard => glob(wildcard) );

	return function(id) {
		if ( typeof id !== "string" ) return false;
		if ( /\0/.test(id) ) return false;

		let included = !include.length;
		id = id.split(sep).join("/");

		include.forEach( function(matcher) {
			if ( matcher.test(id) ) included = true;
		});

		exclude.forEach( function(matcher) {
			if ( matcher.test(id) ) included = false;
		});

		return included;
	};
}

// A Rollup plugin is an object with one or more of the properties, build hooks,
// and output generation hooks described below, and which follows our conventions.
// A plugin should be distributed as a package which exports a function that can
// be called with plugin specific options and returns such an object.
//
// Plugins allow you to customise Rollup's behaviour by, for example, transpiling
// code before bundling, or finding third-party modules in your node_modules folder. 

module.exports = function(options) {
    options = options || {};

    // Setting default options
    const defaults = {
        factory: "h", // preact.h
        indent: "    ",
        lineEnd: "\n",
        comments: false,
        prepend: "**/"
    };

    // Mixing mandatory and user provided arguments
    options = Object.assign(defaults, options);
    
    // Creating input files filter
    const filter = createFilter(options.include, options.exclude, options.prepend);

    return {
        name: "mxn-jsx", // this name will show up in warnings and errors
        // To interact with the build process, your plugin object includes 'hooks'.
        // Hooks are functions which are called at various stages of the build. 
        options: function(rollupOptions) {
            // Setting default options
            const overrideOptions = {
                acorn: {
                    plugins: { jsx: true }
                },
                acornInjectPlugins: [
                    acornJsx({ allowNamespaces: false })
                ]
            };

            // Mixing mandatory and user provided arguments
            return Object.assign(rollupOptions, overrideOptions);
        },
      
        // Can be used to transform individual modules.
        // If a plugin transforms source code, it should generate a sourcemap
        // automatically, unless there's a specific sourceMap: false option.
        // If the transformation does not move code, you can preserve existing
        // sourcemaps by returning null
        //
        // Transformer plugins (i.e. those that return a transform function for
        // e.g. transpiling non-JS files) should support options.include and
        // options.exclude, both of which can be a minimatch pattern or an array
        // of minimatch patterns. If options.include is omitted or of zero length,
        // files should be included by default; otherwise they should only be
        // included if the ID matches one of the patterns.
        //
        transform: function(code, id) {
            // Check if file with "id" path should be included or excluded
            if ( !filter(id) ) return null;

            // Use Rollup's internal acorn instance to parse code to an AST.
            // - this.parse(code: string, acornOptions?: AcornOptions) => ESTree.Program
            let ast = this.parse(code, {
                ecmaVersion: 2020,
                sourceType: "module",
                locations: false,
                plugins: { jsx: true }
            });

            // Create empty source map generator
            // let map = new sourceMap.SourceMapGenerator({
            //     // Source file name must be set and will be used for mappings
            //     file: "script.js"
            // });

            // let s = new MagicString( code )
            // let out = jsx.fromString(code, options)
            // s.overwrite(0, code.length, out.toString() );

            const str = new MagicString(code);

            // Convert AST
            let ast_new = transformAST(ast, options);

            // options.sourceMap = map;
            let formattedCode = generate(ast_new, options);

            // Display generated source map
            // console.log(map.toString() );
            str.overwrite(0, code.length, formattedCode.toString() );

            return  {
                code: str.toString(), // formattedCode
                //ast:  ast,
                map:  str.generateMap({hires: true})
            }
        }
    }
}
