import { notFound } from "next/navigation";
import { APP_CONFIG } from "@/config";

export default function TermsPage() {
  if (!APP_CONFIG.compliance.termsOfUse) {
    notFound();
  }
  return APP_CONFIG.compliance.termsOfUse;
}
