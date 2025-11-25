const path = require("path");
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

const config = mergeConfig(getDefaultConfig(__dirname), {
    resolver: {
        extraNodeModules: {
            "expo-constants": path.resolve(__dirname, "src/shims/expo-constants"),
        },
    },
});

module.exports = wrapWithReanimatedMetroConfig(
    withNativeWind(config, { input: "./global.css", inlineRem: 16 }),
);
