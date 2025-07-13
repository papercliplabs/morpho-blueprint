import { beforeEach, vi } from "vitest";
import "./helpers/expect";

// Mock to allow tests to include config file
vi.mock("next/font/google", () => ({
  Inter: () => ({
    variable: "--font-main",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
  }),
}));
vi.mock("next/font/local", () => ({
  default: () => ({
    variable: "--font-main",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
  }),
}));
vi.mock("@/config/components/Logo", () => ({
  LogoMobile: () => null,
  LogoDesktop: () => null,
}));
vi.mock("@/config/components/TermsOfUse", () => ({
  TermsOfUse: () => null,
}));
vi.mock("@/config/components/PrivacyPolicy", () => ({
  PrivacyPolicy: () => null,
}));
vi.mock("@/config/components/Analytics", () => ({
  Analytics: () => null,
}));

beforeEach(() => {
  vi.resetAllMocks(); // Clear return values, call history, etc.
});
