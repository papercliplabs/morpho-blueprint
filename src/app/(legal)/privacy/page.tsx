import { notFound } from "next/navigation";
import { APP_CONFIG } from "@/config";

export default function PrivacyPage() {
  if (!APP_CONFIG.legal.privacyPolicy) {
    notFound();
  }
  return APP_CONFIG.legal.privacyPolicy;
}
