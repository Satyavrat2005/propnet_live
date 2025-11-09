// app/admin/page.tsx
"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

interface BetaSignup {
  id: number;
  name: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  notes?: string;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: signups, isLoading } = useQuery<BetaSignup[]>({
    queryKey: ["/api/admin/beta-signups"],
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: "approved" | "rejected"; notes?: string }) => {
      // Keep same apiRequest signature as used elsewhere in your codebase
      return apiRequest("PATCH", `/api/admin/beta-signups/${id}`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/beta-signups"] });
      toast({
        title: "Status Updated",
        description: "Beta signup status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: number, status: "approved" | "rejected") => {
    updateStatusMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading beta signups...</div>
      </div>
    );
  }

  const signupsArray = signups || [];
  const pendingSignups = signupsArray.filter((s) => s.status === "pending");
  const approvedSignups = signupsArray.filter((s) => s.status === "approved");
  const rejectedSignups = signupsArray.filter((s) => s.status === "rejected");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Beta Signup Management</h1>
        <p className="text-gray-600">Manage beta access requests and approve qualified brokers</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{pendingSignups.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{approvedSignups.length}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{rejectedSignups.length}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{signupsArray.length}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Requests ({pendingSignups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingSignups.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {pendingSignups.map((signup) => (
                <div key={signup.id} className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{signup.name}</h3>
                      <p className="text-gray-600">{signup.phone}</p>
                      <p className="text-sm text-gray-500">Applied: {new Date(signup.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(signup.id, "approved")}
                        disabled={updateStatusMutation.isPending}
                        type="button"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(signup.id, "rejected")}
                        disabled={updateStatusMutation.isPending}
                        type="button"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Users */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approved Users ({approvedSignups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedSignups.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No approved users yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedSignups.map((signup) => (
                <div key={signup.id} className="border rounded-lg p-4 bg-green-50">
                  <h3 className="font-semibold">{signup.name}</h3>
                  <p className="text-gray-600 text-sm">{signup.phone}</p>
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                    Approved
                  </Badge>
                  <p className="text-xs text-gray-500 mt-2">
                    Approved: {signup.approvedAt ? new Date(signup.approvedAt).toLocaleDateString() : "Recently"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
