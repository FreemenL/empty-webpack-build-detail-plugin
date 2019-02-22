<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>empty-webpack-build-detail-plugin</h1>
  <p>friendly display compilation details</p>
</div>

<h2 align="center">Install</h2>

```bash
  cnpm install empty-webpack-build-detail-plugin -D
```

```bash
  npm i --save-dev empty-webpack-build-detail-plugin -D
```

```bash
  yarn add --dev empty-webpack-build-detail-plugin
```

This is a [webpack](http://webpack.js.org/) plugin tailored for emptyd-desgin and can be used in your project. No difference

<h2 align="center">Zero Config</h2>

The `empty-webpack-build-detail-plugin` works without configuration.  

<h2 align="center">Usage</h2>

The plugin will friendly display compilation details

**webpack.config.prod.js**
```javascript
const emptyWebpackBuildDetailPlugin = require("empty-webpack-build-detail-plugin");

module.exports = {
    -entry: 'index.js',
    -output: {
        -path: __dirname + '/dist',
        -filename: 'index_bundle.js'
    -},
    plugins: [
        new emptyWebpackBuildDetailPlugin(options)
    ]
}

```

<h2 align="center">Options</h2>

You can pass a hash of configuration options to `empty-webpack-build-detail-plugin`.
Allowed values are as follows

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`path`**|`{String}`|`compilation.options.context`|The path to use for the compile log|
|**`filename`**|`{String}`|`'file-list.md'`|The file to write the compile log to. Defaults to `file-list.md`|


Here's an example webpack config illustrating how to use these options

**webpack.config.js**
```js
{
  entry: 'index.js',
  output: {
    path: __dirname + '/dist',
    filename: 'index_bundle.js'
  },
  plugins: [
    new emptyWebpackBuildDetailPlugin({
      path: path.join(process.cwd(),'log'),
      filename: 'compile-log.md'
    })
  ]
}
```

<h2 align="center">Maintainers</h2>

<table>
  <tbody>
    <tr>
      <td align="center">
        <img width="150" height="150"
        src="https://www.lgstatic.com/i/image/M00/70/45/CgpEMlm1eoaAT-7PAACXDPj8MC493.jpeg">
        </br>
        <a href="https://github.com/freemenL">freemenL</a>
      </td>
    </tr>
  <tbody>
</table>
