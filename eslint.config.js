import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/*.js',
            '**/*.mjs',
            '!eslint.config.js',
        ],
    },
    {
        files: ['apps/**/*.ts', 'packages/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['./tsconfig.json', './apps/*/tsconfig.json', './packages/*/tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
            },
            ecmaVersion: 2022,
            globals: {
                node: true,
                jest: true,
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'unused-imports': unusedImports,
            import: importPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            // Console warnings
            'no-console': 'warn',

            // TypeScript rules
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/ban-types': 'off',
            '@typescript-eslint/no-unused-vars': 'off',

            // Unused imports
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            // Import ordering
            'import/order': [
                'warn',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        ['parent', 'sibling'],
                        'index',
                    ],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
            'import/no-duplicates': 'error',

            // Prettier integration
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],

            // Code style
            curly: 'error',

            // Async rules
            'require-await': 'off',
            '@typescript-eslint/require-await': 'warn',
            '@typescript-eslint/return-await': ['error', 'in-try-catch'],

            // Naming conventions
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'interface',
                    format: ['PascalCase'],
                    prefix: ['I'],
                },
                {
                    selector: 'typeAlias',
                    format: ['PascalCase'],
                },
                {
                    selector: 'enum',
                    format: ['PascalCase'],
                },
            ],
        },
    },
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    accessibility: 'explicit',
                    overrides: {
                        accessors: 'explicit',
                        constructors: 'no-public',
                        methods: 'explicit',
                        properties: 'off',
                        parameterProperties: 'explicit',
                    },
                },
            ],
        },
    },
    {
        files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': 'off',
        },
    },
];
