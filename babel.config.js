/**
 * @type {import('@babel/core').TransformOptions}
 */
module.exports = {
    presets: ["module:@react-native/babel-preset", "nativewind/babel"],
    plugins: [
        "babel-plugin-react-compiler", // must run first!
        [
            "module-resolver",
            {
                root: ["./src"],
                alias: {
                    "@legend-kit": "./src/legend-kit",
                    "@": "./src",
                },
            },
        ],
        ["module:react-native-dotenv"],
        "react-native-reanimated/plugin",
    ],
    env: {
        production: {
            plugins: ["transform-remove-console"],
        },
    },
};
