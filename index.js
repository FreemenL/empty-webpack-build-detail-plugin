/**
 * 命令行和文件形式输出编译内容
*/
const fs = require("fs");
const path = require('path');
const fse = require('fs-extra');
const chalk = require("chalk");
const json = require('format-json');
const filesize = require('filesize');
const stripAnsi = require('strip-ansi');
const { SyncHook } = require("tapable");
const recursive = require('recursive-readdir');
const gzipSize = require('gzip-size').sync;
// These sizes are pretty large. We'll warn for bundles exceeding them.
let WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
let WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

const pluginName = 'printFileSizesAfterBuildPlugin';

class emptyWebpackBuildDetailPlugin{
	constructor(options){
		this.options = options;
	}
	apply(compiler){
		// 实例化自定义hook
		compiler.hooks.printFileSizesAfterBuildHook = new SyncHook(['data']);
		compiler.hooks.environment.tap(pluginName, (compilation) => {
			const appBuild  = compiler.options.output.path;
			//广播自定义hook
			compiler.hooks.printFileSizesAfterBuildHook.call(this.measureFileSizesBeforeBuild(appBuild));
		});
		
		compiler.hooks.printFileSizesAfterBuildHook.tap('Listen4Myplugin', (FileSizesAfterBuild) => {
			const appBuild  = compiler.options.output.path;
            FileSizesAfterBuild.then((previousFileSizes)=>{
                fse.emptyDirSync(appBuild);
				console.log(chalk.blue("Production environment directory has been deleted !"));
				compiler.hooks.done.tapAsync("getStats",(stats)=>{
					let content = `##compiler log：\n\n`;
					content+=json.plain(stats.toJson());
					var buffer = new Buffer(content);
					let ws = fs.createWriteStream(`${this.options.path||compilation.options.context}/${this.options.filename||"compilation-detail.md"}`, {start: 0});
					console.log(chalk.cyan("Start outputting the compilation log..."));
					ws.write(buffer, 'utf8',(err, buffer)=>{
						console.log(chalk.cyan(`Packing logs in this -> ${this.options.path||compilation.options.context}/${this.options.filename||"compilation-detail.md"}`));
						console.log(`\n`);
						WARN_AFTER_BUNDLE_GZIP_SIZE = this.options.warnAfterBundleGzipSize || WARN_AFTER_BUNDLE_GZIP_SIZE;
						WARN_AFTER_CHUNK_GZIP_SIZE = this.options.warnAfterChunkGzipSize || WARN_AFTER_BUNDLE_GZIP_SIZE;
					  	this.printFileSizesAfterBuild(
							stats,
							previousFileSizes,
							appBuild,
							WARN_AFTER_BUNDLE_GZIP_SIZE,
							WARN_AFTER_CHUNK_GZIP_SIZE,
						);
					});
				})
			})
        });
	}
	
	measureFileSizesBeforeBuild(buildFolder) {
        return new Promise(resolve => {
            recursive(buildFolder, (err, fileNames) => {
                var sizes;
                if (!err && fileNames) {
                    sizes = fileNames.filter(this.canReadAsset).reduce((memo, fileName) => {
                    var contents = fs.readFileSync(fileName);
                    var key = this.removeFileNameHash(buildFolder, fileName);
                    memo[key] = gzipSize(contents);
                    return memo;
                    }, {});
                }
                resolve({
                    root: buildFolder,
                    sizes: sizes || {},
                });
            });
        });
	}
	
	canReadAsset(asset) {
		return (
			/\.(js|css)$/.test(asset) &&
			!/service-worker\.js/.test(asset) &&
			!/precache-manifest\.[0-9a-f]+\.js/.test(asset)
		);
	}
    
	removeFileNameHash(buildFolder, fileName) {
        return fileName
            .replace(buildFolder, '')
            .replace(/\\/g, '/')
            .replace(
            /\/?(.*)(\.[0-9a-f]+)?(\.js|\.css)/,
            (match, p1, p2, p3, p4) => p1 + p4
            );
    }
    
	getDifferenceLabel(currentSize, previousSize) {
		var FIFTY_KILOBYTES = 1024 * 50;
		var difference = currentSize - previousSize;
		var fileSize = !Number.isNaN(difference) ? filesize(difference) : 0;
		if (difference >= FIFTY_KILOBYTES) {
			return chalk.red('+' + fileSize);
		} else if (difference < FIFTY_KILOBYTES && difference > 0) {
			return chalk.yellow('+' + fileSize);
		} else if (difference < 0) {
			return chalk.green(fileSize);
		} else {
			return '';
		}
	}

	printFileSizesAfterBuild(
		webpackStats,
		previousSizeMap,
		buildFolder,
		maxBundleGzipSize,
		maxChunkGzipSize
    ) {
		var root = previousSizeMap.root;
		var sizes = previousSizeMap.sizes;
		var assets = (webpackStats.stats || [webpackStats])
			.map(stats =>
			stats
				.toJson({ all: false, assets: true })
				.assets.filter(asset => this.canReadAsset(asset.name))
				.map(asset => {
				var fileContents = fs.readFileSync(path.join(root, asset.name));
				var size = gzipSize(fileContents);
				var previousSize = sizes[this.removeFileNameHash(root, asset.name)];
				var difference = this.getDifferenceLabel(size, previousSize);
				return {
					folder: path.join(
					   path.basename(buildFolder),
					   path.dirname(asset.name)
					),
					name: path.basename(asset.name),
					size: size,
					sizeLabel:
					filesize(size) + (difference ? ' (' + difference + ')' : ''),
				};
				})
			)
			.reduce((single, all) => all.concat(single), []);
			assets.sort((a, b) => b.size - a.size);
			var longestSizeLabelLength = Math.max.apply(
				null,
				assets.map(a => stripAnsi(a.sizeLabel).length)
			);
			var suggestBundleSplitting = false;
			assets.forEach(asset => {
				var sizeLabel = asset.sizeLabel;
				var sizeLength = stripAnsi(sizeLabel).length;
				if (sizeLength < longestSizeLabelLength) {
				var rightPadding = ' '.repeat(longestSizeLabelLength - sizeLength);
				 sizeLabel += rightPadding;
				}
				var isMainBundle = asset.name.indexOf('main.') === 0;
				var maxRecommendedSize = isMainBundle
				? maxBundleGzipSize
				: maxChunkGzipSize;
				var isLarge = maxRecommendedSize && asset.size > maxRecommendedSize;
				if (isLarge && path.extname(asset.name) === '.js') {		
					suggestBundleSplitting = true;
				}
				console.log(
				'  ' +
					(isLarge ? chalk.yellow(sizeLabel) : sizeLabel) +
					'  ' +
					chalk.dim(asset.folder + path.sep) +
					chalk.cyan(asset.name)
				);
			});
			if (suggestBundleSplitting) {
				console.log();
				console.log(
				   chalk.yellow('The bundle size is significantly larger than recommended.')
				);
			}
		}
}

module.exports = emptyWebpackBuildDetailPlugin;
