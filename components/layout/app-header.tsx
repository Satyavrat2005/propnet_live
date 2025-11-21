"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search as SearchIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "./app-layout";

interface AppHeaderProps {
  className?: string;
  sidebarCollapsed?: boolean;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/feed": "Property Feed",
  "/my-listings": "My Listings",
  "/requirements": "Requirements",
  "/messages": "Messages",
  "/clients": "Clients",
  "/map": "Map View",
  "/quickpost": "Quick Post",
  "/profile": "Profile",
  "/edit-profile": "Edit Profile",
};

export function AppHeader({ className, sidebarCollapsed }: AppHeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState("");
  const safePathname = pathname ?? "";

  const pageTitle = pageTitles[safePathname] || "PropNet";
  const { setCollapsed } = useSidebarContext();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border transition-all duration-300",
        // Mobile: full width
        "left-0",
        // Desktop: adjust based on sidebar
        sidebarCollapsed ? "lg:left-20" : "lg:left-72",
        className
      )}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6 gap-2 lg:gap-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10"
          onClick={() => setCollapsed(false)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        <div className="flex-1 lg:flex-none">
          <h1 className="text-lg lg:text-xl font-bold text-foreground truncate">{pageTitle}</h1>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search properties, clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 lg:gap-2">
          <Button variant="ghost" size="icon" className="relative h-9 w-9 lg:h-10 lg:w-10">
            <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
          </Button>
        </div>
      </div>
    </header>
  );
}
