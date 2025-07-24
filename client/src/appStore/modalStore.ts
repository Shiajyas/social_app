
import { create } from 'zustand';

interface ModalState {
  isVisible: boolean;
  message: string;
  showModal: (msg: string) => void;
  hideModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isVisible: false,
  message: '',
  showModal: (msg) => set({ isVisible: true, message: msg }),
  hideModal: () => set({ isVisible: false, message: '' }),
}));
