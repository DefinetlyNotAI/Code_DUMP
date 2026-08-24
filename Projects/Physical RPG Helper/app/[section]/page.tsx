import { WorkspacePage } from "@/components/workspace-page"

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  return <WorkspacePage section={section} />
}
