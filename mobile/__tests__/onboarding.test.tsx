import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, waitFor } from "@testing-library/react-native";

import LanguageScreen from "../app/onboarding/language";
import LocationScreen from "../app/onboarding/location";
import { useAuth } from "../src/store/auth";
import { apiMock, resetApiMock } from "../test-utils/apiMock";
import { renderWithProviders, userFixture } from "../test-utils/render";
import { mockRouter, resetRouterMock } from "../test-utils/router";

jest.mock("../src/api/endpoints", () => require("../test-utils/apiMock").apiMock);

beforeEach(() => {
  resetApiMock();
  resetRouterMock();
  (AsyncStorage.setItem as jest.Mock).mockClear();
  useAuth.setState({ user: userFixture, token: "t", refreshToken: "r", hydrated: true });
});

describe("Onboarding", () => {
  it("persists the selected language and continues to location", async () => {
    apiMock.meApi.update.mockResolvedValue(userFixture);

    const { getByTestId } = await renderWithProviders(<LanguageScreen />);
    await fireEvent.press(getByTestId("language-en"));
    await fireEvent.press(getByTestId("language-continue"));

    await waitFor(() =>
      expect(apiMock.meApi.update).toHaveBeenCalledWith({ language: "en" })
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("mindease.language", "en");
    expect(mockRouter.push).toHaveBeenCalledWith("/onboarding/location");
  });

  it("persists country + onboarded flag and finishes setup", async () => {
    apiMock.meApi.update.mockResolvedValue(userFixture);

    const { getByTestId } = await renderWithProviders(<LocationScreen />);
    await fireEvent.press(getByTestId("country-IN"));
    await fireEvent.press(getByTestId("location-finish"));

    await waitFor(() =>
      expect(apiMock.meApi.update).toHaveBeenCalledWith({ country: "IN", onboarded: true })
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("mindease.country", "IN");
    expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("only exposes India as a country option", async () => {
    const { getAllByText } = await renderWithProviders(<LocationScreen />);
    expect(getAllByText("India").length).toBe(1);
  });
});