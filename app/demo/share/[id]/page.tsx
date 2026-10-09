import DemoPortal from "@/components/DemoPortal";
export default async function DemoSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <DemoPortal id={(await params).id} />;
}
