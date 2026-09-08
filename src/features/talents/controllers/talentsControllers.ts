import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getBookingSettings,
  getTalentsBookings,
  getTalentsMyBookings,
  updateTalentsBookingStatus,
  getTalentProfile,
  getTalents,
  postTalentsBooking,
} from '../services/talentsServices';
import type { PayloadPostTalentsBooking } from '../types/talentsTypes';

export const useTalentsControllers = () => {
  const fetchTalents = useQuery({
    queryKey: ['talents'],
    queryFn: async () => unwrapApiResponse(await getTalents()) ?? [],
  });

  return { fetchTalents };
};

export const useTalentsBookingControllers = (talentId: string) => {
  const queryClient = useQueryClient();

  const fetchTalentProfile = useQuery({
    queryKey: ['talentProfile', talentId],
    queryFn: async () => unwrapApiResponse(await getTalentProfile(talentId)) ?? null,
    enabled: Boolean(talentId),
  });

  const fetchBookingSettings = useQuery({
    queryKey: ['bookingSettings'],
    queryFn: async () => unwrapApiResponse(await getBookingSettings()) ?? null,
  });

  const storeTalentsBooking = useMutation({
    mutationFn: async (payload: PayloadPostTalentsBooking) =>
      unwrapApiResponse(await postTalentsBooking(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talents'] });
    },
  });

  return { fetchTalentProfile, fetchBookingSettings, storeTalentsBooking };
};

/** Talent inbox: incoming bookings plus the ones this member made. */
export const useTalentsBookingsControllers = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const fetchTalentsBookings = useQuery({
    queryKey: ['talentsBookings', userId],
    queryFn: async () => unwrapApiResponse(await getTalentsBookings(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const fetchTalentsMyBookings = useQuery({
    queryKey: ['talentsMyBookings', userId],
    queryFn: async () => unwrapApiResponse(await getTalentsMyBookings(userId as string)) ?? [],
    enabled: Boolean(userId),
  });

  const changeTalentsBookingStatus = useMutation({
    mutationFn: async (payload: { bookingId: string; status: string }) =>
      unwrapApiResponse(await updateTalentsBookingStatus(payload.bookingId, payload.status)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['talentsBookings'] });
      queryClient.invalidateQueries({ queryKey: ['talentsMyBookings'] });
    },
  });

  return { fetchTalentsBookings, fetchTalentsMyBookings, changeTalentsBookingStatus };
};
