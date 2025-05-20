module.exports = {
    presets: [
      "@babel/preset-env", // Transpiles modern JavaScript to older versions
      "@babel/preset-react", // Transpiles JSX and React code
    ],
    plugins: [
      // Add any Babel plugins you might need
      "@babel/plugin-syntax-jsx", // Supports JSX syntax (optional if `@babel/preset-react` is present)
    ],
  };