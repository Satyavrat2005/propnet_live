// app/colisting-requests/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ColistingRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["/api/colisting-requests"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/colisting-requests");
      return response.json();
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/colisting-requests/${id}`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/colisting-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({
        title: "Success",
        description: `Co-listing request ${status}!`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const requestDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center px-6 py-4">
          <button
            className="text-primary mr-4"
            onClick={() => router.push("/profile")}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Co-listing Requests</h2>
        </div>
      </div>

      <div className="flex-1 px-6 py-6">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <ArrowLeft className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Requests</h3>
            <p className="text-neutral-500">You don't have any pending co-listing requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request: any) => (
              <div key={request.id} className="bg-white border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
                    <span className="text-neutral-500 font-medium">
                      {request.requester.name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-neutral-900">{request.requester.name}</div>
                        <div className="text-sm text-neutral-500">{request.requester.agencyName}</div>
                      </div>
                      <span className="text-xs text-neutral-400">{formatTimeAgo(request.createdAt)}</span>
                    </div>

                    <p className="text-sm text-neutral-600 mb-3">
                      Wants to co-list: <span className="font-medium">{request.property.title}</span>
                    </p>

                    <div className="flex space-x-3">
                      <Button
                        size="sm"
                        onClick={() => updateRequestMutation.mutate({ id: request.id, status: "approved" })}
                        disabled={updateRequestMutation.isPending}
                        className="bg-accent text-white hover:bg-accent/90"
                      >
                        {updateRequestMutation.isPending ? <div className="loading-spinner" /> : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRequestMutation.mutate({ id: request.id, status: "declined" })}
                        disabled={updateRequestMutation.isPending}
                        className="bg-neutral-100 text-neutral-600 border-none"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
