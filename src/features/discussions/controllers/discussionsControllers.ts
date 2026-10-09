import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  deleteDiscussions,
  deleteDiscussionsComments,
  getDiscussions,
  getDiscussionsComments,
  getDiscussionsDetail,
  getDiscussionsFeatured,
  patchDiscussions,
  patchDiscussionsComments,
  postDiscussions,
  postDiscussionsComments,
} from '../services/discussionsServices';
import type {
  PayloadPatchDiscussions,
  PayloadPatchDiscussionsComments,
  PayloadPostDiscussions,
  PayloadPostDiscussionsComments,
} from '../types/discussionsTypes';

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

  // RLS drops rows a member may not write instead of raising, so an empty
  // result means "not yours" and is surfaced as an error.
  const getAffectedRows = <T,>(rows: T[] | null) => {
    if (!rows || rows.length === 0) throw new Error('You do not have permission to change this.');
    return rows;
  };

  const modifyDiscussions = useMutation({
    mutationFn: async (payload: PayloadPatchDiscussions) => getAffectedRows(unwrapApiResponse(await patchDiscussions(id, payload))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussionsDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussionsFeatured'] });
    },
  });

  const removeDiscussions = useMutation({
    mutationFn: async () => getAffectedRows(unwrapApiResponse(await deleteDiscussions(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      queryClient.invalidateQueries({ queryKey: ['discussionsFeatured'] });
    },
  });

  const modifyDiscussionsComments = useMutation({
    mutationFn: async ({ commentId, ...payload }: PayloadPatchDiscussionsComments & { commentId: string }) =>
      getAffectedRows(unwrapApiResponse(await patchDiscussionsComments(commentId, payload))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discussionsComments', id] }),
  });

  const removeDiscussionsComments = useMutation({
    mutationFn: async (commentId: string) => getAffectedRows(unwrapApiResponse(await deleteDiscussionsComments(commentId))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discussionsComments', id] }),
  });

  return {
    fetchDiscussionsDetail,
    fetchDiscussionsComments,
    storeDiscussionsComments,
    modifyDiscussions,
    removeDiscussions,
    modifyDiscussionsComments,
    removeDiscussionsComments,
  };
};
