import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

beforeEach(() => {
  vi.clearAllMocks();
});

test("returns signIn, signUp, and isLoading", () => {
  const { result } = renderHook(() => useAuth());

  expect(result.current.signIn).toBeTypeOf("function");
  expect(result.current.signUp).toBeTypeOf("function");
  expect(result.current.isLoading).toBe(false);
});

test("signIn calls signInAction and returns result on failure", async () => {
  vi.mocked(signInAction).mockResolvedValue({
    success: false,
    error: "Invalid credentials",
  });

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("test@test.com", "password");
  });

  expect(signInAction).toHaveBeenCalledWith("test@test.com", "password");
  expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
  expect(mockPush).not.toHaveBeenCalled();
});

test("signUp calls signUpAction and returns result on failure", async () => {
  vi.mocked(signUpAction).mockResolvedValue({
    success: false,
    error: "Email already registered",
  });

  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signUp("test@test.com", "password");
  });

  expect(signUpAction).toHaveBeenCalledWith("test@test.com", "password");
  expect(returnValue).toEqual({
    success: false,
    error: "Email already registered",
  });
  expect(mockPush).not.toHaveBeenCalled();
});

test("signIn migrates anonymous work on success", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue({
    messages: [{ role: "user", content: "hello" }],
    fileSystemData: { "/App.jsx": "code" },
  });
  vi.mocked(createProject).mockResolvedValue({
    id: "proj-123",
    name: "Design",
    messages: "[]",
    data: "{}",
    userId: "u1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@test.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith({
    name: expect.stringContaining("Design from"),
    messages: [{ role: "user", content: "hello" }],
    data: { "/App.jsx": "code" },
  });
  expect(clearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/proj-123");
  expect(getProjects).not.toHaveBeenCalled();
});

test("signIn redirects to most recent project when no anon work", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([
    {
      id: "proj-1",
      name: "My Project",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "proj-2",
      name: "Old Project",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@test.com", "password");
  });

  expect(mockPush).toHaveBeenCalledWith("/proj-1");
  expect(createProject).not.toHaveBeenCalled();
});

test("signIn creates new project when user has no projects", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue(null);
  vi.mocked(getProjects).mockResolvedValue([]);
  vi.mocked(createProject).mockResolvedValue({
    id: "new-proj",
    name: "New Design",
    messages: "[]",
    data: "{}",
    userId: "u1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@test.com", "password");
  });

  expect(createProject).toHaveBeenCalledWith({
    name: expect.stringMatching(/^New Design #\d+$/),
    messages: [],
    data: {},
  });
  expect(mockPush).toHaveBeenCalledWith("/new-proj");
});

test("signUp migrates anonymous work on success", async () => {
  vi.mocked(signUpAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue({
    messages: [{ role: "user", content: "build a form" }],
    fileSystemData: { "/App.jsx": "form code" },
  });
  vi.mocked(createProject).mockResolvedValue({
    id: "proj-456",
    name: "Design",
    messages: "[]",
    data: "{}",
    userId: "u1",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@test.com", "password123");
  });

  expect(clearAnonWork).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/proj-456");
});

test("isLoading is true during signIn and false after", async () => {
  let resolveSignIn: (value: any) => void;
  vi.mocked(signInAction).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSignIn = resolve;
      })
  );

  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);

  let signInPromise: Promise<any>;
  act(() => {
    signInPromise = result.current.signIn("test@test.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveSignIn!({ success: false, error: "fail" });
    await signInPromise!;
  });

  expect(result.current.isLoading).toBe(false);
});

test("isLoading is true during signUp and false after", async () => {
  let resolveSignUp: (value: any) => void;
  vi.mocked(signUpAction).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSignUp = resolve;
      })
  );

  const { result } = renderHook(() => useAuth());
  expect(result.current.isLoading).toBe(false);

  let signUpPromise: Promise<any>;
  act(() => {
    signUpPromise = result.current.signUp("test@test.com", "password");
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveSignUp!({ success: false, error: "fail" });
    await signUpPromise!;
  });

  expect(result.current.isLoading).toBe(false);
});

test("isLoading resets to false when signIn throws", async () => {
  vi.mocked(signInAction).mockRejectedValue(new Error("Network error"));

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await expect(
      result.current.signIn("test@test.com", "password")
    ).rejects.toThrow("Network error");
  });

  expect(result.current.isLoading).toBe(false);
});

test("isLoading resets to false when signUp throws", async () => {
  vi.mocked(signUpAction).mockRejectedValue(new Error("Server error"));

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await expect(
      result.current.signUp("test@test.com", "password")
    ).rejects.toThrow("Server error");
  });

  expect(result.current.isLoading).toBe(false);
});

test("anon work with empty messages is ignored", async () => {
  vi.mocked(signInAction).mockResolvedValue({ success: true });
  vi.mocked(getAnonWorkData).mockReturnValue({
    messages: [],
    fileSystemData: {},
  });
  vi.mocked(getProjects).mockResolvedValue([
    {
      id: "proj-1",
      name: "Existing",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@test.com", "password");
  });

  expect(clearAnonWork).not.toHaveBeenCalled();
  expect(getProjects).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/proj-1");
});
