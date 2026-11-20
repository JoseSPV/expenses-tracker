import { ProfileView } from "@/features/profile/profile-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("profile");

export default function Page() {
  return <ProfileView />;
}
