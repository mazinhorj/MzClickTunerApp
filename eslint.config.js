import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default ts.config(
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs['flat/recommended'],
    {
        files: ['**/*.svelte'],
        languageOptions: {
            parser: svelteParser,
            parserOptions: {
                parser: ts.parser,
                extraFileExtensions: ['.svelte']
            }
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', '.svelte-kit/**']
    }
);