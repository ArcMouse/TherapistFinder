import React from "react";

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  dismiss: jest.fn(),
};

export const mockSearchParams: Record<string, string> = {};

export const useRouter = () => mockRouter;
export const useSegments = () => ["(tabs)"];
export const useLocalSearchParams = () => mockSearchParams;
export const useGlobalSearchParams = () => mockSearchParams;

export const Link = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children ?? null);

export const Stack = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children ?? null);
Stack.Screen = () => null;

export const Tabs = ({ children }: { children?: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children ?? null);
Tabs.Screen = () => null;

export const Redirect = () => null;
export const router = mockRouter;

export function resetRouterMock() {
  Object.values(mockRouter).forEach((fn) => fn.mockReset());
  Object.keys(mockSearchParams).forEach((key) => delete mockSearchParams[key]);
}
