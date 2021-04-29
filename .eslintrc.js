module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
    },

    plugins: ['@typescript-eslint','file-progress'],

    extends: [
        // 'eslint:recommended',
        // 'plugin:@typescript-eslint/recommended', // typescript rules
        // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:prettier/recommended',
        //  'prettier/@typescript-eslint',
         "prettier"
    ],

    rules: {
        'file-progress/activate': 1
        // '@typescript-eslint/array-type': 'error',
        // '@typescript-eslint/ban-tslint-comment': 'error',
        // '@typescript-eslint/consistent-type-definitions': 'error',
        // '@typescript-eslint/no-extraneous-class': 'error',
        // '@typescript-eslint/no-implicit-any-catch': 'error',
        // '@typescript-eslint/prefer-function-type': 'error',
        // '@typescript-eslint/prefer-optional-chain': 'error',
        // requires type checking
        // '@typescript-eslint/no-unnecessary-condition': 'error',
        // '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
        // '@typescript-eslint/prefer-readonly': 'error',
        // '@typescript-eslint/prefer-readonly-parameter-types': 'error',
    },
};
