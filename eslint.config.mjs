import tsParser from "@typescript-eslint/parser";
import reactCompiler from "eslint-plugin-react-compiler";

export default [
    {
        name: "react-compiler",
        files: ["src/**/*.{ts,tsx,js,jsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        plugins: {
            "react-compiler": reactCompiler,
        },
        rules: {
            "react-compiler/react-compiler": "error",
        },
    },
];
