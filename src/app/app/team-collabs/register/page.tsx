import { Suspense } from 'react';
import TeamCollabsRegisterForm from '@/features/team-collabs/components/TeamCollabsRegisterForm';

// useSearchParams() needs a Suspense boundary for the page to prerender.
export default function Page() {
  return (
    <Suspense>
      <TeamCollabsRegisterForm />
    </Suspense>
  );
}
