"use client";

import { Building2, Home, MapPin, TrendingUp } from "lucide-react";

export function CubeLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-32 h-32 mb-8" style={{ perspective: "1000px" }}>
        <div
          className="absolute w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            animation: "rotateCube 3s infinite linear",
          }}
        >
          {/* Front Face */}
          <div
            className="absolute w-full h-full bg-linear-to-br from-blue-500 to-blue-600 border-2 border-blue-400 flex items-center justify-center shadow-lg"
            style={{
              transform: "translateZ(64px)",
              backfaceVisibility: "hidden",
            }}
          >
            <Building2 size={48} className="text-white" />
          </div>

          {/* Back Face */}
          <div
            className="absolute w-full h-full bg-linear-to-br from-blue-600 to-blue-700 border-2 border-blue-500 flex items-center justify-center shadow-lg"
            style={{
              transform: "rotateY(180deg) translateZ(64px)",
              backfaceVisibility: "hidden",
            }}
          >
            <Home size={48} className="text-white" />
          </div>

          {/* Left Face */}
          <div
            className="absolute w-full h-full bg-linear-to-br from-blue-400 to-blue-500 border-2 border-blue-300 flex items-center justify-center shadow-lg"
            style={{
              transform: "rotateY(-90deg) translateZ(64px)",
              backfaceVisibility: "hidden",
            }}
          >
            <MapPin size={48} className="text-white" />
          </div>

          {/* Right Face */}
          <div
            className="absolute w-full h-full bg-linear-to-br from-blue-500 to-blue-600 border-2 border-blue-400 flex items-center justify-center shadow-lg"
            style={{
              transform: "rotateY(90deg) translateZ(64px)",
              backfaceVisibility: "hidden",
            }}
          >
            <TrendingUp size={48} className="text-white" />
          </div>

          {/* Top Face */}
          <div
            className="absolute w-full h-full bg-linear-to-br from-blue-300 to-blue-400 border-2 border-blue-200 flex items-center justify-center shadow-lg"
            style={{
              transform: "rotateX(90deg) translateZ(64px)",
              backfaceVisibility: "hidden",
            }}
          >
            <Building2 size={48} className="text-white" />
          </div>

          {/* Bottom Face */}
          <div
            className="absolute w-full h-full bg-linear-to-br from-blue-700 to-blue-800 border-2 border-blue-600 flex items-center justify-center shadow-lg"
            style={{
              transform: "rotateX(-90deg) translateZ(64px)",
              backfaceVisibility: "hidden",
            }}
          >
            <Home size={48} className="text-white" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-gray-700">{message}</p>
        <div className="flex items-center justify-center space-x-1">
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rotateCube {
          0% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg);
          }
        }
      `}</style>
    </div>
  );
}
