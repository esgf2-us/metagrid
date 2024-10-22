module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', 'jsx-a11y', 'import', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': [
      1,
      { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    ],
    'react/jsx-props-no-spreading': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    'react/self-closing-comp': 'off',
    // https://github.com/facebook/create-react-app/issues/6560#issuecomment-524688843
    'spaced-comment': [
      'error',
      'always',
      {
        markers: ['/'],
      },
    ],
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-function-return-type': ['error'],
    // Makes no sense to allow type inferrence for expression parameters, but require typing the response (https://github.com/iamturns/create-exposed-app/blob/master/.eslintrc.js)
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    '@typescript-eslint/no-use-before-define': [
      'error',
      { functions: false, classes: true, variables: true, typedefs: true },
    ],
    'react/require-default-props': 'off',
    'react/function-component-definition': 'off',
    'react/no-unstable-nested-components': 'off',
    'react/jsx-no-useless-fragment': 'off',
    'react/jsx-no-constructed-context-values': 'off',
    'import/no-import-module-exports': 'off',
  },
};
