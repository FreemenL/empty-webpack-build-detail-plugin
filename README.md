# empty-webpack-build-detail-plugin
friendly display compilation details

##Install

```bash
    npm install empty-webpack-build-detail-plugin -D
```

##USE

```javascript
const emptyWebpackBuildDetailPlugin = requie("empty-webpack-build-detail-plugin");

module.exports = {
    -entry: 'index.js',
    -output: {
        -path: __dirname + '/dist',
        -filename: 'index_bundle.js'
    -},
    plugins: [
        new emptyWebpackBuildDetailPlugin()
    ]
}

```
