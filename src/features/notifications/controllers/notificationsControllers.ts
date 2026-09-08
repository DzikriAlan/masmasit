import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getNotifications,
  updateNotificationsAllRead,
  updateNotificationsRead,
} from '../services/notificationsServices';

export const useNotificationsControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
  };

  const fetchNotifications = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => unwrapApiResponse(await getNotifications(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const changeNotificationsAllRead = useMutation({
    mutationFn: async () => unwrapApiResponse(await updateNotificationsAllRead(userId as string)),
    onSuccess: invalidateNotifications,
  });

  const changeNotificationsRead = useMutation({
    mutationFn: async (id: string) => unwrapApiResponse(await updateNotificationsRead(id)),
    onSuccess: invalidateNotifications,
  });

  return { fetchNotifications, changeNotificationsAllRead, changeNotificationsRead };
};
