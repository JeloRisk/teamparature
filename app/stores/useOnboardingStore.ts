import { create } from "zustand";

interface OnboardingState {
    step: number;
    mode: "none" | "create" | "join";
    orgName: string;
    inviteCode: string;
    setStep: (step: number) => void;
    setMode: (mode: "none" | "create" | "join") => void;
    setOrgName: (name: string) => void;
    setInviteCode: (code: string) => void;
    reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
    step: 1,
    mode: "none",
    orgName: "",
    inviteCode: "",
    setStep: (step) => set({ step }),
    setMode: (mode) => set({ mode }),
    setOrgName: (orgName) => set({ orgName }),
    setInviteCode: (inviteCode) => set({ inviteCode }),
    reset: () =>
        set({
            step: 1,
            mode: "none",
            orgName: "",
            inviteCode: "",
        }),
}));
