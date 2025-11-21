// app/colisting-requests/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {AppLayout} from "@/components/layout/app-layout";

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
    <AppLayout>
      <div className="max-w-4xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Co-listing Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage incoming co-listing requests from your network
          </p>
        </div>

        {requests.length === 0 ? (
          <Card className="card-modern">
            <CardContent className="py-16 text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-muted rounded-full">
                  <Users className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Requests</h3>
              <p className="text-muted-foreground">You don't have any pending co-listing requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request: any) => (
              <Card key={request.id} className="bento-card group hover:border-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-foreground">{request.requester.name}</div>
                          <div className="text-sm text-muted-foreground">{request.requester.agencyName}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTimeAgo(request.createdAt)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-foreground mb-4">
                        Wants to co-list: <span className="font-semibold text-primary">{request.property.title}</span>
                      </p>

                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() => updateRequestMutation.mutate({ id: request.id, status: "approved" })}
                          disabled={updateRequestMutation.isPending}
                          className="btn-primary flex items-center gap-2"
                        >
                          {updateRequestMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateRequestMutation.mutate({ id: request.id, status: "declined" })}
                          disabled={updateRequestMutation.isPending}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
