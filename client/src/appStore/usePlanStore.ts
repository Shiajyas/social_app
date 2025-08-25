import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Plan {
  _id: string;
  name: string;
  amount: number;
  duration: number;
  description: string;
}

interface PlanState {
  selectedPlan: Plan | null;
  setSelectedPlan: (plan: Plan | null) => void;
  clearPlan: () => void;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      selectedPlan: null,
      setSelectedPlan: (plan) => set({ selectedPlan: plan }),
      clearPlan: () => set({ selectedPlan: null }),
    }),
    {
      name: "plan-storage", // key in localStorage
    }
  )
);
