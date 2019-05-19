const HtmlWebPackPlugin = require('html-webpack-plugin');

const htmlPlugin = new HtmlWebPackPlugin({
  template: './src/index.html',
  filename: './index.html'
});


module.exports = {
  output: {
    path: __dirname + '/www',
    publicPath: ''
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      { test: /\.css/, loader: 'style-loader!css-loader' },
      { test: /\.(woff|woff2|eot|ttf)$/, loader: 'url-loader?limit=100000' },
      { test: /\.(jpg|png)$/, loader: 'file-loader' }
    ]
  },
  plugins: [htmlPlugin]
};
