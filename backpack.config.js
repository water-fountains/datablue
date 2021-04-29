module.exports = {
  webpack: (config, _options) => {
    config.entry.main = ['./server/index.ts'];

    config.resolve = {
      extensions: ['.ts', '.js', '.json'],
    };

    // Typescript loader
    config.module.rules.push({
      test: /\.ts$/,
      loader: 'ts-loader',
    });

    return config;
  },
};
