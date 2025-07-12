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

// Mock to allow tests to include config file
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

beforeEach(() => {
  vi.resetAllMocks(); // Clear return values, call history, etc.
});
