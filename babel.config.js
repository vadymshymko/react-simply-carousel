module.exports = {
  presets: [
    '@babel/preset-react',
    '@babel/preset-env',
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-export-default-from',
    ['@babel/plugin-proposal-class-properties', { loose: true }],

    'transform-inline-consecutive-adds',
    'minify-constant-folding',
    'minify-dead-code-elimination',
    'minify-guarded-expressions',
    'minify-numeric-literals',
    'minify-type-constructors',

    [
      'transform-react-remove-prop-types',
      {
        removeImport: true,
        classNameMatchers: ['Component', 'PureComponent'],
        additionalLibraries: ['prop-types'],
      },
    ],

    ['@babel/plugin-transform-react-constant-elements'],
    ['@babel/plugin-transform-react-inline-elements'],
    ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ['babel-plugin-loop-optimizer'],
  ],
};
