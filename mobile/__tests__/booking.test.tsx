import { Alert } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";

import ConfirmBookingScreen from "../app/booking/confirm";
import BookingsScreen from "../app/(tabs)/bookings";
import { useAuth } from "../src/store/auth";
import { apiMock, resetApiMock } from "../test-utils/apiMock";
import {
  bookingFixture,
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

describe("ConfirmBookingScreen", () => {
  beforeEach(() => {
    mockSearchParams.therapistId = "1";
    mockSearchParams.start = slotFixture.start_dt;
    apiMock.therapistApi.detail.mockResolvedValue(therapistFixture);
    apiMock.therapistApi.availability.mockResolvedValue({
      therapist_id: 1,
      week: "2026-38",
      session_duration_min: 50,
      slots: [slotFixture],
    });
  });

  it("posts the booking and navigates to My Bookings", async () => {
    apiMock.bookingApi.create.mockResolvedValue(bookingFixture);

    const { findByTestId, getByTestId } = await renderWithProviders(<ConfirmBookingScreen />);
    await findByTestId("booking-summary");

    await fireEvent.press(getByTestId("confirm-book"));

    await waitFor(() =>
      expect(apiMock.bookingApi.create).toHaveBeenCalledWith(1, slotFixture.start_dt)
    );
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)/bookings"));
  });

  it("surfaces a conflict error when the slot is taken", async () => {
    apiMock.bookingApi.create.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { detail: "This slot is already booked." } },
    });

    const { findByTestId, getByTestId, findByText } = await renderWithProviders(
      <ConfirmBookingScreen />
    );
    await findByTestId("booking-summary");

    await fireEvent.press(getByTestId("confirm-book"));

    expect(await findByText("This slot is already booked.")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});

describe("BookingsScreen", () => {
  it("lists the user's bookings", async () => {
    apiMock.bookingApi.list.mockResolvedValue([bookingFixture]);

    const { findByText, getByTestId } = await renderWithProviders(<BookingsScreen />);

    expect(await findByText("Dr. Ananya Iyer")).toBeTruthy();
    expect(getByTestId("booking-10")).toBeTruthy();
  });

  it("cancels a booking", async () => {
    apiMock.bookingApi.list.mockResolvedValue([bookingFixture]);
    apiMock.bookingApi.cancel.mockResolvedValue({ ...bookingFixture, status: "cancelled" });
    jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        buttons?.find((button) => button.style === "destructive")?.onPress?.();
      });

    const { findByTestId, getByTestId } = await renderWithProviders(<BookingsScreen />);
    await findByTestId("booking-10");

    await fireEvent.press(getByTestId("cancel-10"));

    await waitFor(() => expect(apiMock.bookingApi.cancel).toHaveBeenCalledWith(10));
  });
});