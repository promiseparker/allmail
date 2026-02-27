import { PrivacySettings } from "@/components/settings/privacy-settings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Settings" };

export default function PrivacySettingsPage() {
  return <PrivacySettings />;
}
