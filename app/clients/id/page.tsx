// app/clients/[id]/page.tsx
"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MobileNavigation from "@/components/layout/mobile-navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Clock,
  User,
  FileText,
  Handshake,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientProfilePage() {
  const params = useParams();
  const clientKey = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: clientData, isLoading: loadingClient } = useQuery({
    queryKey: ["/api/clients", clientKey],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${clientKey}`);
      if (!res.ok) throw new Error("Failed to fetch client");
      return res.json();
    },
    enabled: !!clientKey,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals", "client", clientKey],
    queryFn: async () => {
      const res = await fetch(`/api/deals?owner_phone=${encodeURIComponent(clientData?.owner_phone || "")}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientKey && !!clientData,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks", "client", clientKey],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?owner_phone=${encodeURIComponent(clientData?.owner_phone || "")}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!clientKey && !!clientData,
  });

  // toggle task completion
  const toggleTask = useMutation({
    mutationFn: async (task: any) => {
      const res = await fetch(`/api/tasks/${task.task_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.status }),
      });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", "client", clientKey] });
    },
  });

  if (loadingClient || !clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* header */}
      <div className="px-4 py-4 bg-white/80 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/clients")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{clientData.owner_name}</h1>
              <div className="flex items-center gap-2">
                <Badge>Owner</Badge>
                <Badge>{clientData.count} properties</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* left column */}
          <div className="space-y-4 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /><span>{clientData.owner_phone}</span></div>
                  {clientData.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" /><span>{clientData.email}</span></div>}
                  {clientData.city && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{clientData.city}</span></div>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requirements & Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{clientData.notes || "No notes"}</p>
              </CardContent>
            </Card>
          </div>

          {/* center: deals */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deals (Properties)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deals.map((d: any) => (
                    <div key={d.property_id} className="p-4 bg-white rounded-lg shadow-sm flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{d.property_title}</p>
                        <p className="text-sm text-gray-600">{d.location}</p>
                      </div>
                      <Badge>{d.approval_status}</Badge>
                    </div>
                  ))}
                  {deals.length === 0 && <p className="text-gray-500">No deals for this client</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((t: any) => (
                    <div key={t.task_id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className={`font-medium ${t.status ? "line-through text-gray-400" : ""}`}>{t.task_text}</p>
                        <p className="text-xs text-gray-500">Created: {new Date(t.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="ghost" onClick={() => toggleTask.mutate(t)}>
                          {t.status ? "Mark Incomplete" : "Mark Complete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="text-gray-500">No tasks for this client</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="h-20" />
      <MobileNavigation />
    </div>
  );
}
