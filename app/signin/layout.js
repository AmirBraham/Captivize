import config from "@/config";
import { getSEOTags } from "@/libs/seo";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const metadata = getSEOTags({
  title: `Sign-in to ${config.appName}`,
  canonicalUrlRelative: "/auth/signin",
});

export default async function Layout({ children }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    // User is already logged in, redirect to home page or dashboard
    redirect(config.auth.callbackUrl)
  }
  return <>{children}</>;
}
