import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { unwrapApiResponse } from '@/shared/lib/apiResponse';

import {
  getBookingSettings,
  getTalentsBookings,
  getTalentsMyBookings,
  updateTalentsBookingStatus,
  getTalentProfile,
  getTalents,
  getTalentsBookedSlots,
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

export const useTalentsBookingControllers = (talentId: string, isSignedIn = false) => {
  const queryClient = useQueryClient();

  const fetchTalentProfile = useQuery({
    queryKey: ['talentProfile', talentId, isSignedIn],
    queryFn: async () => unwrapApiResponse(await getTalentProfile(talentId, isSignedIn)) ?? null,
    enabled: Boolean(talentId),
  });

  // Optional: until migration 028 is applied the RPC does not exist, so an
  // error here simply means "no slots to show".
  const fetchTalentsBookedSlots = useQuery({
    queryKey: ['talentsBookedSlots', talentId],
    queryFn: async () => unwrapApiResponse(await getTalentsBookedSlots(talentId)) ?? [],
    enabled: Boolean(talentId),
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ['talentsBookedSlots', talentId] });
    },
  });

  return { fetchTalentProfile, fetchBookingSettings, fetchTalentsBookedSlots, storeTalentsBooking };
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
