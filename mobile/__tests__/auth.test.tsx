import { fireEvent, waitFor } from "@testing-library/react-native";

import AuthChoiceScreen from "../app/auth/index";
import EmailAuthScreen from "../app/auth/email";
import { useAuth } from "../src/store/auth";
import { apiMock, resetApiMock } from "../test-utils/apiMock";
import { renderWithProviders, sessionFixture, userFixture } from "../test-utils/render";
import { mockRouter, resetRouterMock } from "../test-utils/router";

jest.mock("../src/api/endpoints", () => require("../test-utils/apiMock").apiMock);
jest.mock("../src/lib/google", () => ({
  GOOGLE_DISCOVERY: {},
  buildGoogleRequestConfig: () => ({}),
  getGoogleClientId: () => "",
  getDevGoogleToken: () => "mock-google-id-token",
  promptGoogleIdToken: jest.fn(),
}));

beforeEach(() => {
  resetApiMock();
  resetRouterMock();
  useAuth.setState({ user: null, token: null, refreshToken: null, hydrated: true });
});

describe("AuthChoiceScreen", () => {
  it("renders both Google and Email buttons", async () => {
    const { getByText, getByTestId } = await renderWithProviders(<AuthChoiceScreen />);
    expect(getByText("Continue with Google")).toBeTruthy();
    expect(getByText("Continue with Email")).toBeTruthy();
    expect(getByTestId("google-button")).toBeTruthy();
    expect(getByTestId("email-button")).toBeTruthy();
  });

  it("navigates to the email screen", async () => {
    const { getByTestId } = await renderWithProviders(<AuthChoiceScreen />);
    await fireEvent.press(getByTestId("email-button"));
    expect(mockRouter.push).toHaveBeenCalledWith("/auth/email");
  });

  it("calls /api/auth/google/ with the mocked ID token and stores the session", async () => {
    apiMock.authApi.google.mockResolvedValue({
      ...sessionFixture,
      user: { ...userFixture, profile: { ...userFixture.profile, onboarded: false } },
    });

    const { getByTestId } = await renderWithProviders(<AuthChoiceScreen />);
    await fireEvent.press(getByTestId("google-button"));

    await waitFor(() =>
      expect(apiMock.authApi.google).toHaveBeenCalledWith("mock-google-id-token")
    );
    await waitFor(() => expect(useAuth.getState().token).toBe("access-token"));
    expect(useAuth.getState().user?.email).toBe("demo@mindease.test");
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/onboarding/language"));
  });
});

describe("EmailAuthScreen", () => {
  it("signs in via /api/auth/login/ and stores the token", async () => {
    apiMock.authApi.login.mockResolvedValue(sessionFixture);

    const { getByTestId } = await renderWithProviders(<EmailAuthScreen />);
    await fireEvent.changeText(getByTestId("input-email"), "demo@mindease.test");
    await fireEvent.changeText(getByTestId("input-password"), "DemoPass123");
    await fireEvent.press(getByTestId("submit-button"));

    await waitFor(() =>
      expect(apiMock.authApi.login).toHaveBeenCalledWith({
        email: "demo@mindease.test",
        password: "DemoPass123",
      })
    );
    await waitFor(() => expect(useAuth.getState().token).toBe("access-token"));
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("registers new accounts and routes to onboarding", async () => {
    apiMock.authApi.register.mockResolvedValue({
      ...sessionFixture,
      user: { ...userFixture, profile: { ...userFixture.profile, onboarded: false } },
    });

    const { getByTestId } = await renderWithProviders(<EmailAuthScreen />);
    await fireEvent.press(getByTestId("mode-signup"));
    expect(getByTestId("input-name")).toBeTruthy();

    await fireEvent.changeText(getByTestId("input-name"), "New Person");
    await fireEvent.changeText(getByTestId("input-email"), "new@mindease.test");
    await fireEvent.changeText(getByTestId("input-password"), "DemoPass123");
    await fireEvent.changeText(getByTestId("input-confirm-password"), "DemoPass123");
    await fireEvent.press(getByTestId("submit-button"));

    await waitFor(() =>
      expect(apiMock.authApi.register).toHaveBeenCalledWith({
        email: "new@mindease.test",
        password: "DemoPass123",
        password_confirm: "DemoPass123",
        name: "New Person",
      })
    );
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/onboarding/language"));
  });

  it("shows the Google-account error returned by the API", async () => {
    apiMock.authApi.login.mockRejectedValue({
      isAxiosError: true,
      response: { data: { non_field_errors: ["Account uses Google sign-in."] } },
    });

    const { getByTestId, findByText } = await renderWithProviders(<EmailAuthScreen />);
    await fireEvent.changeText(getByTestId("input-email"), "google@mindease.test");
    await fireEvent.changeText(getByTestId("input-password"), "DemoPass123");
    await fireEvent.press(getByTestId("submit-button"));

    expect(await findByText("Account uses Google sign-in.")).toBeTruthy();
  });
});
