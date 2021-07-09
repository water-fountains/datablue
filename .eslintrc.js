module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    es2020: true,
  },

  plugins: ['@typescript-eslint', 'file-progress'],

  // global rules for all file types
  rules: {
    'file-progress/activate': 1,
  },

  overrides: [
    {
      files: ['*.js'],
      extends: [
        'eslint:recommended',
        // has to be last entry to be able to override other rules
        'prettier',
      ],
    },
    {
      files: ['*.ts'],
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.json',
      },

      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended', // typescript rules
        // TODO activate in addition
        //'plugin:@typescript-eslint/recommended-requiring-type-checking',
        // has to be last entry to be able to override other rules
        'prettier',
      ],

      rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-module-boundary-types': 'error',

        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-tslint-comment': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/no-extraneous-class': 'error',
        '@typescript-eslint/no-implicit-any-catch': ['error', { allowExplicitAny: true }],
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',

        //TODO activate again (remove line is included in recommended) once we use unknown instead of any (or even better proper types)
        '@typescript-eslint/no-explicit-any': 0,

        //requires type checking
        // TODO activate in addition
        // '@typescript-eslint/no-unnecessary-condition': 'error',
        // '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
        // '@typescript-eslint/prefer-readonly': 'error',
        // '@typescript-eslint/prefer-readonly-parameter-types': 'error',
      },
    },
  ],
};
