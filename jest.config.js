module.exports = {
    preset: "react-native",
    setupFiles: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^.+\\.(css|less|scss)$": "<rootDir>/jest/mocks/styleMock.js",
        "^nativewind$": "<rootDir>/jest/mocks/nativewindMock.js",
        "^react-native-css-interop$": "<rootDir>/jest/mocks/nativewindMock.js",
        "^expo-constants$": "<rootDir>/src/shims/expo-constants",
    },
    transformIgnorePatterns: ["node_modules/(?!(react-native|@react-native|@react-native-community|expo-file-system)/)"],
};
