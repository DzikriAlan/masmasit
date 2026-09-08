import { create } from 'zustand';

import type {
  PayloadPostCoursesEnrollment,
  Courses,
  CoursesDetail,
} from '../types/coursesTypes';

interface CoursesStore {
  payloadPostCoursesEnrollment: PayloadPostCoursesEnrollment;
  courses: Courses;
  coursesDetail: CoursesDetail;
  setPostCoursesEnrollment: (payload: Partial<PayloadPostCoursesEnrollment>) => void;
}

export const useCoursesStates = create<CoursesStore>((set) => ({
  payloadPostCoursesEnrollment: {
    course_id: '',
    user_id: '',
  },

  courses: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  coursesDetail: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setPostCoursesEnrollment: (payload) =>
    set((state) => ({
      payloadPostCoursesEnrollment: { ...state.payloadPostCoursesEnrollment, ...payload },
    })),
}));
