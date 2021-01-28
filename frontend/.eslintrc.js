module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
    node: true,
  },
  extends: [
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
  ],
  plugins: ['react', 'jsx-a11y', 'import'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': [
      1,
      { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    ],
    'react/jsx-props-no-spreading': 'off',
    'react/prop-types': 'off',
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

  },
};
