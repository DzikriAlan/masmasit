import { useQuery } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { useFeedStates } from '../states/feedStates';
import { getFeed, getFeedCourses, getFeedEvents } from '../services/feedServices';

export const useFeedControllers = () => {
  const { payloadGetFeed, setGetFeed } = useFeedStates();

  const fetchFeed = useQuery({
    queryKey: ['feed', payloadGetFeed],
    queryFn: async () => unwrapApiResponse(await getFeed(payloadGetFeed)) ?? [],
  });

  return { fetchFeed, payloadGetFeed, setGetFeed };
};

/** Homepage strips: its own small, fixed-size activity query plus carousels. */
export const useFeedHomeControllers = () => {
  const fetchFeedHome = useQuery({
    queryKey: ['feedHome'],
    queryFn: async () => unwrapApiResponse(await getFeed({ limit: 12 })) ?? [],
  });

  const fetchFeedCourses = useQuery({
    queryKey: ['feedCourses'],
    queryFn: async () => unwrapApiResponse(await getFeedCourses()) ?? [],
  });

  const fetchFeedEvents = useQuery({
    queryKey: ['feedEvents'],
    queryFn: async () => unwrapApiResponse(await getFeedEvents()) ?? [],
  });

  return { fetchFeedHome, fetchFeedCourses, fetchFeedEvents };
};
