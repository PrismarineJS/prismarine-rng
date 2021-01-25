const webpack = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')
const path = require('path')

const config = {
  mode: 'production',
  entry: path.resolve(__dirname, './index.js'),
  output: {
    path: path.resolve(__dirname, './public'),
    filename: './index.js'
  },
  resolve: {
    fallback: {
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      buffer: require.resolve('buffer/'),
      fs: false
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new CopyPlugin({
      patterns: [
        { from: '../../lib/wasm/WorldGen.wasm', to: './' }
      ]
    })
  ],
  devServer: {
    contentBase: path.resolve(__dirname, './public'),
    compress: true,
    inline: true,
    // open: true,
    hot: true,
    watchOptions: {
      ignored: /node_modules/
    }
  }
}

module.exports = config
