const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      coga: './extension/src/index.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'coga.min.js' : 'coga.js',
      clean: true,
      library: {
        name: 'COGA',
        type: 'umd',
        export: 'default',
      },
      globalObject: 'this',
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-typescript',
              ],
            },
          },
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@core': path.resolve(__dirname, 'src/core'),
        '@interventions': path.resolve(__dirname, 'src/interventions'),
        '@ui': path.resolve(__dirname, 'src/ui'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@rules': path.resolve(__dirname, 'src/rules'),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        inject: 'body',
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    performance: {
      maxAssetSize: 102400, // 100KB limit for Phase 1 (will optimize in Phase 2)
      maxEntrypointSize: 102400,
      hints: 'warning',
    },
  };
};

