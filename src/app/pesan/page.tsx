import { Suspense } from 'react';
import MessagesInbox from '@/features/messages/components/MessagesInbox';

// useSearchParams() needs a Suspense boundary for the page to prerender.
export default function Page() {
  return (
    <Suspense>
      <MessagesInbox />
    </Suspense>
  );
}
