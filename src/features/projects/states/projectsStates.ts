import { create } from 'zustand';

import type {
  PayloadGetProjects,
  PayloadPostProjects,
  Projects,
  ProjectsDetail,
} from '../types/projectsTypes';

interface ProjectsStore {
  payloadGetProjects: PayloadGetProjects;
  payloadPostProjects: PayloadPostProjects;
  projects: Projects;
  projectsDetail: ProjectsDetail;
  setGetProjects: (payload: Partial<PayloadGetProjects>) => void;
  setPostProjects: (payload: Partial<PayloadPostProjects>) => void;
}

export const useProjectsStates = create<ProjectsStore>((set) => ({
  payloadGetProjects: {
    search: '',
    statusFilter: 'open',
  },

  payloadPostProjects: {
    user_id: '',
    title: '',
    description: '',
    budget_min: null,
    budget_max: null,
    deadline: null,
  },

  projects: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  projectsDetail: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null,
  },

  setGetProjects: (payload) =>
    set((state) => ({ payloadGetProjects: { ...state.payloadGetProjects, ...payload } })),

  setPostProjects: (payload) =>
    set((state) => ({ payloadPostProjects: { ...state.payloadPostProjects, ...payload } })),
}));
