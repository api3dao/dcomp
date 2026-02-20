module.exports = {
  extends: ['plugin:@api3/eslint-plugin-commons/universal', 'plugin:@api3/eslint-plugin-commons/jest'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    camelcase: 'off',
    'functional/no-try-statements': 'off',
    'unicorn/filename-case': 'off',
  },
  ignorePatterns: ['typechain-types/*'],
};
