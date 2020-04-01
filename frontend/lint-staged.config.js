module.exports = {
  'src/**/*.+(js|jsx|ts|tsx|css|sass|less|json)': [
    'eslint --fix',
    'prettier --write',
    'jest --findRelatedTests',
  ],
};
