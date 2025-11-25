import { Suspense } from "react";

import MessagesClient from "./messages-client";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
