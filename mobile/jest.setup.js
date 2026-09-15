/* eslint-env jest */

jest.mock("expo-router", () => require("./test-utils/router"));

jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openBrowserAsync: jest.fn(async () => ({ type: "dismiss" })),
}));

jest.mock("expo-auth-session", () => ({
  ResponseType: { IdToken: "id_token", Code: "code" },
  useAuthRequest: () => [null, null, jest.fn()],
  makeRedirectUri: () => "mindease://oauth",
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { apiUrl: "http://localhost:8000/api", googleClientId: "" } },
  },
}));

global.alert = jest.fn();
global.confirm = jest.fn(() => true);

jest.setTimeout(20000);
