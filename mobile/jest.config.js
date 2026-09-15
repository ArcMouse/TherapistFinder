module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-router|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|react-native-css-interop|@react-native-async-storage/async-storage|@tanstack/react-query|zustand))",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  forceExit: true,
};
