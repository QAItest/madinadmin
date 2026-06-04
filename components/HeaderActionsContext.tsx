"use client";

import { createContext, ReactNode, useContext } from "react";

const HeaderActionsContext = createContext<ReactNode>(null);

type HeaderActionsProviderProps = {
  actions: ReactNode;
  children: ReactNode;
};

export function HeaderActionsProvider({ actions, children }: HeaderActionsProviderProps) {
  return <HeaderActionsContext.Provider value={actions}>{children}</HeaderActionsContext.Provider>;
}

export function useHeaderActions() {
  return useContext(HeaderActionsContext);
}
