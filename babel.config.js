module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'entry',
        corejs: '3.8.1',
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
