import OwnerConsentClient from "@/components/OwnerConsentClient";

export default async function Page({
  params,
}: {
  params: Promise<{ consentId: string }>;
}) {
  const { consentId } = await params;
  return <OwnerConsentClient consentId={consentId} />;
}
