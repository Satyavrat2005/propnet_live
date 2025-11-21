"use client";

import React from "react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { AppContainer } from "./app-container";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Create a context to share collapsed state
export const SidebarContext = React.createContext<{
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}>({
  collapsed: false,
  setCollapsed: () => {},
});

export const useSidebarContext = () => React.useContext(SidebarContext);

export function AppLayout({ children }: AppLayoutProps) {
  // Default to collapsed on mobile, expanded on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);
  
  // Check screen size on mount and set initial state
  React.useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setSidebarCollapsed(window.innerWidth < 1024); // lg breakpoint
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed: sidebarCollapsed, setCollapsed: setSidebarCollapsed }}>
      <div className="relative min-h-screen">
        <AppSidebar />
        <AppHeader sidebarCollapsed={sidebarCollapsed} />
        <AppContainer sidebarCollapsed={sidebarCollapsed}>
          {children}
        </AppContainer>
      </div>
    </SidebarContext.Provider>
  );
}
