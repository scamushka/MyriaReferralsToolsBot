module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: 'airbnb-base',
  rules: {
    'no-console': 'off',
    'linebreak-style': ['error', (process.platform === 'win32' ? 'windows' : 'unix')],
    'arrow-parens': ['error', 'as-needed'],
    'max-len': 'off',
    'import/extensions': 'off',
    'consistent-return': 'off',
  },
};
