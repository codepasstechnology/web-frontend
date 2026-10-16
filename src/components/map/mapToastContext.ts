import { createContext, useContext } from "react";

export interface ToastState {
  show: (text: string) => void;
  current: { text: string; key: number } | null;
}

export const ToastContext = createContext<ToastState>({ show: () => {}, current: null });

/** Raises the toast MapToastOutlet draws over the map. */
export function useMapToast(): (text: string) => void {
  return useContext(ToastContext).show;
}
