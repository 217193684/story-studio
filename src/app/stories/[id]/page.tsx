import StoryView from "@/components/StoryView";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <StoryView id={(await params).id} />; }
