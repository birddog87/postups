import { redirect } from "next/navigation";

interface PublicLeagueHomeProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicLeagueHome({
  params,
}: PublicLeagueHomeProps) {
  const { slug } = await params;
  redirect(`/l/${slug}/standings`);
}
