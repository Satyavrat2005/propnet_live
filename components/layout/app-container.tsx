"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AppContainerProps {
  children: React.ReactNode;
  className?: string;
  sidebarCollapsed?: boolean;
}

export function AppContainer({
  children,
  className,
  sidebarCollapsed = false,
}: AppContainerProps) {
  return (
    <main
      className={cn(
        "min-h-screen pt-16 transition-all duration-300 bg-muted/30",
        // Desktop: adjust based on sidebar
        sidebarCollapsed ? "lg:ml-20" : "lg:ml-72",
        // Mobile: no left margin
        "ml-0",
        className
      )}
    >
      <div className="p-4 sm:p-6">{children}</div>
    </main>
  );
}
