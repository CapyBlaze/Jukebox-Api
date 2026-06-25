import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
    eslintConfigPrettier,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],

            "sort-imports": [
                "error",
                {
                    ignoreDeclarationSort: true,
                    ignoreMemberSort: false,
                },
            ],
        },
    },
];
