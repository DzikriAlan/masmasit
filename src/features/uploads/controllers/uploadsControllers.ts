import { useMutation } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import { postUploads } from '../services/uploadsServices';
import type { PayloadPostUploads } from '../types/uploadsTypes';

export const useUploadsControllers = () => {
  const storeUploads = useMutation({
    mutationFn: async (payload: PayloadPostUploads) => unwrapApiResponse(await postUploads(payload)),
  });

  return { storeUploads };
};
