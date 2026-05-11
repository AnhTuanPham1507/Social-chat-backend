const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = (options, webpack) => {
  return {
    ...options,
    externals: [
      nodeExternals({
        modulesDir: path.resolve(__dirname, '../../node_modules'),
        allowlist: [/^@social-chat\//],
      }),
    ],
    module: {
      ...options.module,
      rules: [
        {
          test: /\.ts$/,
          exclude: [
            /node_modules/,
            /\.spec\.ts$/,
            /\.test\.ts$/,
            /__tests__/,
          ],
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: path.resolve(__dirname, 'tsconfig.json'),
              },
            },
          ],
        },
      ],
    },
    resolve: {
      ...options.resolve,
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, 'tsconfig.json'),
        }),
      ],
    },
  };
};
