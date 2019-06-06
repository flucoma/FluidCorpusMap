var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: {
    main: './src/client/js/index.js'
  },
  output: {
    path: path.resolve('./dist/client/js'),
    //filename: 'scatterplot.js'
    filename: 'app.js'
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader'
      }
    ]
  },
  devtool: 'source-map',
  plugins: [new webpack.optimize.UglifyJsPlugin()]
};
