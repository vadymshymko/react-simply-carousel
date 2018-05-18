const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const glob = require('glob');

const componentsPaths = glob.sync('./src/components/**?/');
const entryPoints = componentsPaths.reduce((items, item) => ({
  ...items,
  [path.basename(item)]: [
    'babel-polyfill',
    `${item}index.jsx`,
  ],
}), {});

module.exports = {
  entry: {
    index: [
      'babel-polyfill',
      './src/components/index.js',
    ],
    ...entryPoints,
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
    library: 'reactjs-simple-carousel',
    libraryTarget: 'umd',
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react',
      umd: 'react',
    },
    'prop-types': {
      root: 'PropTypes',
      commonjs2: 'prop-types',
      commonjs: 'prop-types',
      amd: 'prop-types',
      umd: 'prop-types',
    },
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [
      path.resolve(__dirname, '../src'),
      'node_modules',
    ],
  },
  plugins: [
    new CleanWebpackPlugin(
      ['dist'],
      {
        root: path.resolve(__dirname, '../'),
      },
    ),
  ],
  module: {
    rules: [
      {
        test: /\.(ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        use: 'file-loader',
        exclude: /node_modules/,
      },
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        use: 'eslint-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.scss/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          'sass-loader',
          'postcss-loader',
        ],
        exclude: /node_modules/,
      },
    ],
  },
};
