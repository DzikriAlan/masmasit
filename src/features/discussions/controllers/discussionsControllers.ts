import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getDiscussions,
  getDiscussionsComments,
  getDiscussionsDetail,
  getDiscussionsFeatured,
  postDiscussions,
  postDiscussionsComments,
} from '../services/discussionsServices';
import type { PayloadPostDiscussions, PayloadPostDiscussionsComments } from '../types/discussionsTypes';

export const useDiscussionsControllers = () => {
  const queryClient = useQueryClient();

  const fetchDiscussions = useQuery({
    queryKey: ['discussions'],
    queryFn: async () => unwrapApiResponse(await getDiscussions()) ?? [],
  });

  const storeDiscussions = useMutation({
    mutationFn: async (payload: PayloadPostDiscussions) => unwrapApiResponse(await postDiscussions(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discussions'] }),
  });

  return { fetchDiscussions, storeDiscussions };
};

// Discover's "Tulisan Member" strand (REST.md Bagian 3/9).
export const useDiscussionsFeaturedControllers = () => {
  const fetchDiscussionsFeatured = useQuery({
    queryKey: ['discussionsFeatured'],
    queryFn: async () => unwrapApiResponse(await getDiscussionsFeatured()) ?? [],
  });

  return { fetchDiscussionsFeatured };
};

export const useDiscussionsDetailControllers = (id: string) => {
  const queryClient = useQueryClient();

  const fetchDiscussionsDetail = useQuery({
    queryKey: ['discussionsDetail', id],
    queryFn: async () => unwrapApiResponse(await getDiscussionsDetail(id)) ?? null,
    enabled: Boolean(id),
  });

  const fetchDiscussionsComments = useQuery({
    queryKey: ['discussionsComments', id],
    queryFn: async () => unwrapApiResponse(await getDiscussionsComments(id)) ?? [],
    enabled: Boolean(id),
  });

  const storeDiscussionsComments = useMutation({
    mutationFn: async (payload: PayloadPostDiscussionsComments) => unwrapApiResponse(await postDiscussionsComments(payload)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discussionsComments', id] }),
  });

  return { fetchDiscussionsDetail, fetchDiscussionsComments, storeDiscussionsComments };
};
