import { TimelineEditor } from '@/features/timelines/components/TimelineEditor';

export default async function EditTimelinePage({ params }: { params: Promise<{ id: string }> }) {
  return <TimelineEditor timelineId={(await params).id} />;
}
