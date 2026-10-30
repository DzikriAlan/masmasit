import type { Metadata } from 'next';

import FeedList from '@/features/feed/components/FeedList';

export const metadata: Metadata = {
  title: 'Activity — MasmasIT',
  description: 'New jobs, client projects, member builds and events on MasmasIT, as they happen.',
};

export default function FeedPage() {
  return <FeedList />;
}
