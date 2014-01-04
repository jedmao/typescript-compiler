///<reference path='../vendor/dt-node/node.d.ts'/>
import fs = require('fs');
import path = require('path');
var extend = require('util')._extend;
var version = require('../package').version;


var tsDir = path.join(__dirname, '../node_modules/typescript/');
var tsBinDir = path.join(tsDir, 'bin');
var targetFile = path.join(__dirname, '../tsc-' + version + '-wrapped.tmp');

fs.exists(targetFile, (exists: boolean) => {
	if (exists) {
		exportWrapped();
	} else {
		var srcFile = path.join(tsBinDir, 'tsc.js');
		fs.readFile(srcFile, 'utf8', (err, tscSource) => {
			if (err) {
				throw err;
			}

			// Remove all the "executable" lines at the end of the file
			// eg. var batchCompiler = new BatchCompiler(IO);
			//     batchCompiler.batchCompile();
			var lines = tscSource.split(/[\n\r]+/);
			var i = lines.length - 1;
			while (lines[i].indexOf('}') !== 0) {
				i--;
			}
			var tscSourceWithoutLastLines = lines.slice(0, i + 1).join('\n');

			// Create a new file, wrapping the original in a closure
			var content = "(function() { \n";
			content += tscSourceWithoutLastLines;
			content += "\n\n";

			// Export the base TypeScript module and 
			// IO and BatchCompiler to expose the command line
			// compiler
			content += 'module.exports = TypeScript;\n\n';
			content += 'module.exports.IO = IO;\n\n';
			content += 'module.exports.BatchCompiler = BatchCompiler;\n\n';
			content += '})();\n';

			fs.writeFile(targetFile, content, 'utf8', err2 => {
				if (err2) {
					throw err2;
				}
				exportWrapped();
			});
		});
	}
});

function exportWrapped() {
	exports = require(targetFile);
	exports.libdPath = path.join(tsBinDir, 'lib.d.ts');

	// ReSharper disable InconsistentNaming
	var IO = exports.IO;
	var BatchCompiler = exports.BatchCompiler;
	// ReSharper restore InconsistentNaming

	exports.compile = (files, tscArgs: any, onError: Function) => {
		var newArgs;

		if (typeof tscArgs === 'string') {
			newArgs = tscArgs.split(' ');
		} else {
			newArgs = tscArgs || [];
		}

		newArgs = newArgs.concat(files);

		var io = extend({}, IO, { arguments: newArgs });

		var exitCode;

		io.quit = code => {
			exitCode = code;
		};

		if (onError) {

			function wrapWithCallback(fn: Function) {
				var original = fn;
				return (str: string) => {
					if (onError(str) !== false) {
						original(str);
					}
				};
			}

			io.stderr.Write = wrapWithCallback(io.stderr.Write);
			io.stderr.WriteLine = wrapWithCallback(io.stderr.WriteLine);
		}

		new BatchCompiler(io).batchCompile();
		return exitCode;
	};
}
