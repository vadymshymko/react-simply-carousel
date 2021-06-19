module.exports = {
  presets: ["@babel/preset-env", "@babel/preset-react"],
  plugins: [
    [
      "transform-react-remove-prop-types",
      {
        removeImport: true,
        additionalLibraries: ["prop-types"],
      },
    ],

    ["transform-remove-console", { exclude: ["error", "warn"] }],
  ],
};
