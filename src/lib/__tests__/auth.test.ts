import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockCookieStore, mockSign, mockJwtVerify } = vi.hoisted(() => ({
  mockCookieStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  },
  mockSign: vi.fn().mockResolvedValue("mock.jwt.token"),
  mockJwtVerify: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("jose", () => {
  const SignJWT = vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  }));
  return { SignJWT, jwtVerify: mockJwtVerify };
});

import { createSession, getSession } from "@/lib/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

test("sets an httpOnly cookie with a JWT token", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, token, options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(token).toBe("mock.jwt.token");
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.expires).toBeInstanceOf(Date);
});

test("sets expiration ~7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const expires = mockCookieStore.set.mock.calls[0][2].expires as Date;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs);
});

test("sets secure flag based on NODE_ENV", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockCookieStore.set.mock.calls[0][2];
  expect(options.secure).toBe(process.env.NODE_ENV === "production");
});

test("getSession returns null when no cookie exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
  expect(mockJwtVerify).not.toHaveBeenCalled();
});

test("getSession returns null for an invalid token", async () => {
  mockCookieStore.get.mockReturnValue({ value: "bad-token" });
  mockJwtVerify.mockRejectedValue(new Error("invalid token"));

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns session payload for a valid token", async () => {
  const payload = { userId: "user-1", email: "test@example.com", expiresAt: new Date() };
  mockCookieStore.get.mockReturnValue({ value: "valid-token" });
  mockJwtVerify.mockResolvedValue({ payload });

  const session = await getSession();
  expect(session).toEqual(payload);
  expect(mockJwtVerify.mock.calls[0][0]).toBe("valid-token");
});
