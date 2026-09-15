import { render } from "@testing-library/react-native";
import { Text, View } from "react-native";

import { PrimaryButton } from "../src/components/PrimaryButton";
import { resolveRedirect } from "../src/lib/routing";

describe("resolveRedirect", () => {
  it("waits until the session is hydrated", () => {
    expect(
      resolveRedirect({ hydrated: false, authenticated: false, onboarded: false, segment: "auth" })
    ).toBeNull();
  });

  it("sends unauthenticated users to the auth screen", () => {
    expect(
      resolveRedirect({ hydrated: true, authenticated: false, onboarded: false, segment: undefined })
    ).toBe("/auth");
  });

  it("keeps unauthenticated users on the auth screen", () => {
    expect(
      resolveRedirect({ hydrated: true, authenticated: false, onboarded: false, segment: "auth" })
    ).toBeNull();
  });

  it("sends authenticated but un-onboarded users to onboarding", () => {
    expect(
      resolveRedirect({ hydrated: true, authenticated: true, onboarded: false, segment: "(tabs)" })
    ).toBe("/onboarding/language");
  });

  it("sends onboarded users to the tabs", () => {
    expect(
      resolveRedirect({ hydrated: true, authenticated: true, onboarded: true, segment: "auth" })
    ).toBe("/(tabs)");
  });

  it("does not redirect onboarded users already in the tabs", () => {
    expect(
      resolveRedirect({ hydrated: true, authenticated: true, onboarded: true, segment: "(tabs)" })
    ).toBeNull();
  });

  it("hands off from the root gate to the tabs once onboarded", () => {
    expect(
      resolveRedirect({ hydrated: true, authenticated: true, onboarded: true, segment: undefined })
    ).toBe("/(tabs)");
  });
});

describe("PrimaryButton", () => {
  it("renders its label", async () => {
    const { getByText } = await render(<PrimaryButton label="Continue" onPress={() => undefined} />);
    expect(getByText("Continue")).toBeTruthy();
  });
});

describe("jsx smoke", () => {
  it("renders a view with nativewind className", async () => {
    const { getByText } = await render(
      <View className="rounded-xl2 bg-primary-500">
        <Text className="text-white">MindEase</Text>
      </View>
    );
    expect(getByText("MindEase")).toBeTruthy();
  });
});
