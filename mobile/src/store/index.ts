import { create } from 'zustand';
import type { Profile, ClinicianLocation } from '@/types';

interface AppState {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  clinicianLocations: ClinicianLocation[];
  setClinicianLocations: (locs: ClinicianLocation[]) => void;
  isOnShift: boolean;
  setOnShift: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clinicianLocations: [],
  setClinicianLocations: (clinicianLocations) => set({ clinicianLocations }),
  isOnShift: false,
  setOnShift: (isOnShift) => set({ isOnShift }),
}));
