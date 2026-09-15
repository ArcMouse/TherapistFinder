export type RedirectTarget = "/auth" | "/onboarding/language" | "/(tabs)" | null;

/**
 * Decides where the router should send the user based on the current segment
 * and session state. Pure function so it can be unit tested in isolation.
 */
export function resolveRedirect({
  hydrated,
  authenticated,
  onboarded,
  segment,
}: {
  hydrated: boolean;
  authenticated: boolean;
  onboarded: boolean;
  segment: string | undefined;
}): RedirectTarget {
  if (!hydrated) return null;

  const inAuth = segment === "auth";
  const inOnboarding = segment === "onboarding";

  if (!authenticated) {
    return inAuth ? null : "/auth";
  }
  if (!onboarded) {
    return inOnboarding ? null : "/onboarding/language";
  }
  if (inAuth || inOnboarding) {
    return "/(tabs)";
  }
  // The root gate (`app/index.tsx`) must hand off to the tabs once onboarded.
  if (segment === undefined) {
    return "/(tabs)";
  }
  return null;
}