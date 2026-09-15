export const apiMock = {
  authApi: {
    register: jest.fn(),
    login: jest.fn(),
    google: jest.fn(),
    logout: jest.fn(),
    passwordReset: jest.fn(),
  },
  meApi: { get: jest.fn(), update: jest.fn() },
  therapistApi: {
    list: jest.fn(),
    search: jest.fn(),
    detail: jest.fn(),
    availability: jest.fn(),
  },
  bookingApi: { list: jest.fn(), create: jest.fn(), cancel: jest.fn() },
};

export function resetApiMock() {
  Object.values(apiMock).forEach((group) => {
    Object.values(group).forEach((fn) => (fn as jest.Mock).mockReset());
  });
}
