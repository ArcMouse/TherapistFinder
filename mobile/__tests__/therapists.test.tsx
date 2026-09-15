import { fireEvent, waitFor } from "@testing-library/react-native";

import TherapistListScreen from "../app/(tabs)/index";
import TherapistDetailScreen from "../app/therapist/[id]";
import { useAuth } from "../src/store/auth";
import { apiMock, resetApiMock } from "../test-utils/apiMock";
import {
  renderWithProviders,
  slotFixture,
  therapistFixture,
  userFixture,
} from "../test-utils/render";
import { mockRouter, mockSearchParams, resetRouterMock } from "../test-utils/router";

jest.mock("../src/api/endpoints", () => require("../test-utils/apiMock").apiMock);

beforeEach(() => {
  resetApiMock();
  resetRouterMock();
  useAuth.setState({ user: userFixture, token: "t", refreshToken: "r", hydrated: true });
});

describe("TherapistListScreen", () => {
  it("renders therapist cards from the mocked API", async () => {
    apiMock.therapistApi.list.mockResolvedValue([therapistFixture]);

    const { findByText, getByTestId } = await renderWithProviders(<TherapistListScreen />);

    expect(await findByText("Dr. Ananya Iyer")).toBeTruthy();
    expect(getByTestId("therapist-card-1")).toBeTruthy();
    expect(apiMock.therapistApi.list).toHaveBeenCalled();
  });

  it("navigates to the therapist detail screen when a card is pressed", async () => {
    apiMock.therapistApi.list.mockResolvedValue([therapistFixture]);

    const { findByText, getByTestId } = await renderWithProviders(<TherapistListScreen />);
    await findByText("Dr. Ananya Iyer");
    await fireEvent.press(getByTestId("therapist-card-1"));

    expect(mockRouter.push).toHaveBeenCalledWith("/therapist/1");
  });

  it("triggers /api/search/ from the natural-language search bar", async () => {
    apiMock.therapistApi.list.mockResolvedValue([therapistFixture]);
    apiMock.therapistApi.search.mockResolvedValue({
      query: "anxiety therapist available Sunday evening",
      count: 1,
      results: [therapistFixture],
    });

    const { getByTestId, findByText } = await renderWithProviders(<TherapistListScreen />);

    await fireEvent.changeText(
      getByTestId("search-bar"),
      "anxiety therapist available Sunday evening"
    );
    await fireEvent(getByTestId("search-bar"), "submitEditing");

    await waitFor(() =>
      expect(apiMock.therapistApi.search).toHaveBeenCalledWith(
        "anxiety therapist available Sunday evening"
      )
    );
    expect(await findByText(/Results for/)).toBeTruthy();
  });
});

describe("TherapistDetailScreen", () => {
  beforeEach(() => {
    mockSearchParams.id = "1";
    apiMock.therapistApi.detail.mockResolvedValue(therapistFixture);
    apiMock.therapistApi.availability.mockResolvedValue({
      therapist_id: 1,
      week: "2026-38",
      session_duration_min: 50,
      slots: [slotFixture, { ...slotFixture, start_dt: "2026-09-20T18:00:00+00:00", booked: true }],
    });
  });

  it("renders name, degree, bio, tags, price and availability grid", async () => {
    const { findByTestId, getByText, getByTestId } = await renderWithProviders(
      <TherapistDetailScreen />
    );

    expect(await findByTestId("detail-name")).toBeTruthy();
    expect(getByText("M.Phil Clinical Psychology")).toBeTruthy();
    expect(getByText(/Anxiety and adolescent specialist/)).toBeTruthy();
    expect(getByText("anxiety")).toBeTruthy();
    expect(getByText("teens")).toBeTruthy();
    expect(getByTestId("detail-pricing")).toBeTruthy();
    expect(getByText(/1,500/)).toBeTruthy();

    await waitFor(() => expect(getByTestId("availability-grid")).toBeTruthy());
  });

  it("navigates to booking confirmation from the CTA", async () => {
    const { findByTestId, getByTestId } = await renderWithProviders(<TherapistDetailScreen />);
    await findByTestId("detail-name");

    await fireEvent.press(getByTestId("book-cta"));

    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/booking/confirm" })
    );
  });
});