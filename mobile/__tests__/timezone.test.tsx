import { fireEvent, waitFor } from "@testing-library/react-native";

import ProfileScreen from "../app/(tabs)/profile";
import { formatDateTime, formatTime } from "../src/lib/format";
import { useAuth } from "../src/store/auth";
import { apiMock, resetApiMock } from "../test-utils/apiMock";
import { renderWithProviders, userFixture } from "../test-utils/render";
import { resetRouterMock } from "../test-utils/router";

jest.mock("../src/api/endpoints", () => require("../test-utils/apiMock").apiMock);

const INSTANT = "2026-09-20T17:00:00+05:30"; // 5:00 pm IST

beforeEach(() => {
  resetApiMock();
  resetRouterMock();
  useAuth.setState({ user: userFixture, token: "t", refreshToken: "r", hydrated: true });
});

describe("timezone-aware formatting", () => {
  it("renders the same instant differently per timezone", () => {
    const ist = formatTime(INSTANT, "Asia/Kolkata");
    const newYork = formatTime(INSTANT, "America/New_York");

    expect(ist).toContain("5:00");
    expect(newYork).toContain("7:30");
    expect(ist).not.toEqual(newYork);
  });

  it("includes the weekday and date in the target timezone", () => {
    const ist = formatDateTime(INSTANT, "Asia/Kolkata");
    expect(ist).toContain("Sun");
    expect(ist).toContain("20");
  });

  it("can cross a calendar day when converting timezones", () => {
    // 11:00 pm IST on Sunday is still Sunday in New York (1:30 pm).
    const late = "2026-09-20T23:00:00+05:30";
    expect(formatDateTime(late, "Asia/Kolkata")).toContain("Sun");
    expect(formatDateTime(late, "America/New_York")).toContain("Sun");
    // ...but 01:00 IST Monday is still Sunday in Los Angeles.
    const early = "2026-09-21T01:00:00+05:30";
    expect(formatDateTime(early, "Asia/Kolkata")).toContain("Mon");
    expect(formatDateTime(early, "America/Los_Angeles")).toContain("Sun");
  });
});

describe("Profile timezone selector", () => {
  it("persists the chosen timezone to the API and the session", async () => {
    const updated = {
      ...userFixture,
      profile: { ...userFixture.profile, preferred_timezone: "America/New_York" },
    };
    apiMock.meApi.update.mockResolvedValue(updated);

    const { getByTestId } = await renderWithProviders(<ProfileScreen />);

    await fireEvent.press(getByTestId("timezone-select"));
    await fireEvent.press(getByTestId("timezone-America/New_York"));

    await waitFor(() =>
      expect(apiMock.meApi.update).toHaveBeenCalledWith({
        preferred_timezone: "America/New_York",
      })
    );
    await waitFor(() =>
      expect(useAuth.getState().user?.profile.preferred_timezone).toBe("America/New_York")
    );
  });

  it("shows the current timezone label", async () => {
    const { getByText } = await renderWithProviders(<ProfileScreen />);
    expect(getByText(/India Standard Time/)).toBeTruthy();
  });
});