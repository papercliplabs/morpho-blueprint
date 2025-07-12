import { notFound } from "next/navigation";
import { APP_CONFIG } from "@/config";

export default function TermsPage() {
  if (!APP_CONFIG.legal.termsOfUse) {
    notFound();
  }
  return APP_CONFIG.legal.termsOfUse;
}
