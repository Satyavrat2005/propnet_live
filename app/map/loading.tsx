"use client";

import React from "react";
import { MapPin, Loader2 } from "lucide-react";

export default function MapLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Animated Map Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
            <MapPin className="w-10 h-10 text-blue-600" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Loading Map</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Fetching properties and initializing the map view...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" 
               style={{ 
                 width: '30%',
                 animation: 'loading 1.5s ease-in-out infinite'
               }} 
          />
        </div>

        <style jsx>{`
          @keyframes loading {
            0% {
              width: 0%;
              margin-left: 0%;
            }
            50% {
              width: 60%;
              margin-left: 20%;
            }
            100% {
              width: 0%;
              margin-left: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
