import { beforeEach } from "vitest";
import { vi } from "vitest";
import "./helpers/expect";

// Mock to allow tests to include config file
vi.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "--font-main",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
  }),
}));

// Mock to allow tests to include config file
vi.mock("@/config/components/Logo", () => ({
  Logo: () => null,
}));

beforeEach(() => {
  vi.resetAllMocks(); // Clear return values, call history, etc.
});
