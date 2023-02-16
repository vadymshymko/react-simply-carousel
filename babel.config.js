module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: 3,
        loose: true,
      },
    ],
    '@babel/preset-react',
    [
      '@babel/preset-typescript',
      {
        isTSX: true,
        allExtensions: true,
      },
    ],
  ],
  plugins: [['transform-remove-console', { exclude: ['error', 'warn'] }]],
};
