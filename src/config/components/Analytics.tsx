import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

export default function Analytics() {
  // Can use any analytics you prefer
  // Note that if you choose a non-privacy preserving method cookies management and policy are recommended for GDPR compliance
  return <VercelAnalytics />;
}
