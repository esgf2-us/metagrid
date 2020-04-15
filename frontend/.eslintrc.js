module.exports = {
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:prettier/recommended',
    'prettier/react',
  ],
  plugins: ['react', 'jsx-a11y', 'import'],
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/self-closing-comp': 'off',
    'prettier/prettier': 'error',
  },
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
};
