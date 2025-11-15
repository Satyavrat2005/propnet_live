// app/clients/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Users, TrendingUp, Clock, Target, Plus, ChevronRight } from "lucide-react";

/**
 * Clients page — images-only photo rendering (no URL text).
 */

export default function ClientsPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "deals" | "tasks">("overview");

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientModalData, setClientModalData] = useState<any | null>(null);
  const [clientModalLoading, setClientModalLoading] = useState(false);

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [dealDetail, setDealDetail] = useState<any | null>(null);
  const [dealLoading, setDealLoading] = useState(false);

  const [showAddTask, setShowAddTask] = useState(false);
  const [taskText, setTaskText] = useState("");

  // === DATA FETCHERS ===
  const { data: rawClients = [] } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const r = await fetch("/api/clients", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 30_000,
  });

  const { data: rawProperties = [] } = useQuery({
    queryKey: ["/api/properties"],
    queryFn: async () => {
      const r = await fetch("/api/properties", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 30_000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const r = await fetch("/api/tasks", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 15_000,
  });

  // Derived metrics
  const totalClients = Array.isArray(rawClients) ? rawClients.length : 0;
  const totalDeals = Array.isArray(rawProperties) ? rawProperties.length : 0;
  const pendingTasks = Array.isArray(tasks) ? tasks.filter((t: any) => !t.status).length : 0;

  const monthlyDeals = useMemo(() => {
    if (!Array.isArray(rawProperties)) return 0;
    const now = new Date();
    return rawProperties.filter((d: any) => {
      const created = d.created_at ?? d.createdAt ?? d.created;
      if (!created) return false;
      const dt = new Date(created);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;
  }, [rawProperties]);

  const activeDealsCount = Array.isArray(rawProperties)
    ? rawProperties.filter((d: any) => (d.approval_status ?? d.ownerApprovalStatus ?? "pending") !== "pending").length
    : 0;
  const activeDealPct = totalDeals ? Math.round((activeDealsCount / totalDeals) * 100) : 0;
  const taskCompletionPct = tasks && tasks.length ? Math.round(((tasks.length - pendingTasks) / tasks.length) * 100) : 0;

  // ==== utilities (robust parsePhotos) ====
  const isLikelyUrl = (s: any) => {
    if (!s || typeof s !== "string") return false;
    const trimmed = s.trim();
    if (!trimmed) return false;
    if (/^https?:\/\//i.test(trimmed)) return true;
    if (/^\/\//.test(trimmed)) return true;
    if (/\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(trimmed)) return true;
    return false;
  };

  const normalizeUrl = (s: string) => {
    if (!s) return s;
    const t = s.trim();
    if (t.startsWith("//")) return `https:${t}`;
    return t;
  };

  const tryParseJson = (v: string) => {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };

  function parsePhotos(raw: any): string[] {
    if (raw == null) return [];

    if (Array.isArray(raw)) {
      return Array.from(new Set(raw.map(String).map((r) => normalizeUrl(r)).filter(isLikelyUrl)));
    }

    if (typeof raw === "object") {
      if (Array.isArray((raw as any).data)) return parsePhotos((raw as any).data);
      if ((raw as any).data && typeof (raw as any).data === "object") {
        const d = (raw as any).data;
        if (typeof d.url === "string" && isLikelyUrl(d.url)) return [normalizeUrl(d.url)];
        const keys = ["display_url", "displayUrl", "image", "url", "full_url", "fullUrl", "src"];
        for (const k of keys) {
          if (typeof (d as any)[k] === "string" && isLikelyUrl((d as any)[k])) return [normalizeUrl((d as any)[k])];
        }
      }

      if (Array.isArray((raw as any).property_photos)) return parsePhotos((raw as any).property_photos);
      if (Array.isArray((raw as any).photos)) return parsePhotos((raw as any).photos);
      if (Array.isArray((raw as any).images)) return parsePhotos((raw as any).images);

      const singleCandidates = ["url", "href", "image", "src", "photo"];
      for (const k of singleCandidates) {
        if (typeof (raw as any)[k] === "string" && isLikelyUrl((raw as any)[k])) return [normalizeUrl((raw as any)[k])];
      }

      return [];
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return [];

      const parsed = tryParseJson(trimmed);
      if (parsed) return parsePhotos(parsed);

      if (trimmed.includes(",")) {
        const arr = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
        const urls = arr.map(normalizeUrl).filter(isLikelyUrl);
        if (urls.length) return Array.from(new Set(urls));
      }

      if (isLikelyUrl(trimmed)) return [normalizeUrl(trimmed)];

      const swapped = trimmed.replace(/'/g, '"');
      const p2 = tryParseJson(swapped);
      if (p2) return parsePhotos(p2);

      return [trimmed];
    }

    return [];
  }

  // Normalizes property record fields (handles camelCase, snake_case, nested owner)
  function normalizePropertyFields(obj: any) {
    if (!obj) return obj;
    const normalized: any = { ...obj };

    normalized.property_id = obj.property_id ?? obj.id ?? obj.propertyId ?? obj._id ?? null;

    normalized.flat_number =
      obj.flat_number ??
      obj.flatNo ??
      obj.flat_no ??
      obj.flat ??
      obj.flatNumber ??
      obj.flatnumber ??
      null;

    normalized.floor =
      obj.floor ??
      obj.floor_no ??
      obj.floorNo ??
      obj.floor_number ??
      obj.floorNumber ??
      null;

    normalized.building_society =
      obj.building_society ??
      obj.building ??
      obj.society ??
      obj.buildingSociety ??
      obj.society_name ??
      null;

    normalized.created_at =
      obj.created_at ??
      obj.createdAt ??
      obj.created ??
      obj.timestamp ??
      obj.created_at_iso ??
      null;

    const photosRaw = obj.photos ?? obj.property_photos ?? obj.propertyPhotos ?? obj.images ?? obj.photos_list ?? null;
    normalized.photos = parsePhotos(photosRaw);

    if (obj.owner && typeof obj.owner === "object") {
      normalized.owner_name = obj.owner.name ?? obj.owner.fullname ?? obj.owner.displayName ?? obj.owner_name ?? null;
      normalized.owner_phone = obj.owner.phone ?? obj.owner.mobile ?? obj.owner_phone ?? null;
    } else {
      normalized.owner_name = obj.owner_name ?? obj.owner ?? obj.ownerName ?? obj.ownerId ?? obj.name ?? null;
      normalized.owner_phone = obj.owner_phone ?? obj.ownerPhone ?? obj.owner_phone_number ?? obj.phone ?? null;
    }

    normalized.sale_price = obj.sale_price ?? obj.price ?? obj.salePrice ?? null;
    normalized.property_title = obj.property_title ?? obj.title ?? obj.name ?? null;
    normalized.location = obj.location ?? obj.full_address ?? obj.fullAddress ?? obj.address ?? null;
    normalized.property_type = obj.property_type ?? obj.propertyType ?? obj.type ?? null;
    normalized.transaction_type = obj.transaction_type ?? obj.transactionType ?? null;
    normalized.bhk = obj.bhk ?? obj.bedrooms ?? null;
    normalized.area = obj.area ?? obj.size ?? null;
    normalized.area_unit = obj.area_unit ?? obj.sizeUnit ?? obj.areaUnit ?? null;
    normalized.approval_status = obj.approval_status ?? obj.ownerApprovalStatus ?? obj.approvalStatus ?? null;

    return normalized;
  }

  function normalizeClientFields(c: any) {
    if (!c) return c;
    const norm: any = { ...(c ?? {}) };

    if (c.owner && typeof c.owner === "object") {
      norm.owner_name = c.owner.name ?? c.owner.fullname ?? c.owner_name ?? c.name ?? null;
      norm.owner_phone = c.owner.phone ?? c.owner.mobile ?? c.owner_phone ?? null;
    } else {
      norm.owner_name = c.owner_name ?? c.owner ?? c.name ?? null;
      norm.owner_phone = c.owner_phone ?? c.phone ?? c.mobile ?? null;
    }

    if (Array.isArray(c.properties)) {
      norm.properties = c.properties.map((p: any) => normalizePropertyFields(p));
    } else if (Array.isArray(c.property)) {
      norm.properties = c.property.map((p: any) => normalizePropertyFields(p));
    } else if (c.property && typeof c.property === "object") {
      norm.properties = [normalizePropertyFields(c.property)];
    } else {
      norm.properties = c.properties ?? [];
    }

    norm.count = c.count ?? (Array.isArray(norm.properties) ? norm.properties.length : 0);
    return norm;
  }

  // normalized lists for UI
  const clients = Array.isArray(rawClients) ? rawClients.map(normalizeClientFields) : [];
  const properties = Array.isArray(rawProperties) ? rawProperties.map(normalizePropertyFields) : [];

  // fetch single property endpoint (canonical detail)
  async function fetchPropertyById(propertyId: string | number) {
    try {
      const r = await fetch(`/api/properties/${encodeURIComponent(String(propertyId))}`, { credentials: "include" });
      if (!r.ok) return null;
      const json = await r.json();
      return normalizePropertyFields(json);
    } catch {
      return null;
    }
  }

  // open client modal (compositeId format kept the same)
  const openClientModal = async (compositeId: string) => {
    setClientModalOpen(true);
    setClientModalData(null);
    setClientModalLoading(true);

    try {
      const r = await fetch(`/api/clients/${encodeURIComponent(compositeId)}`, { credentials: "include" });
      if (!r.ok) {
        setClientModalLoading(false);
        setClientModalData(null);
        return;
      }
      const data = await r.json();
      const normalizedClient = normalizeClientFields(data ?? {});
      setClientModalData(normalizedClient);
    } catch {
      setClientModalData(null);
    } finally {
      setClientModalLoading(false);
    }
  };

  // open deal/property modal
  const openDealModal = async (propertyId: string | number) => {
    setDealModalOpen(true);
    setDealDetail(null);
    setDealLoading(true);

    try {
      const canonical = await fetchPropertyById(String(propertyId));
      const fallback = !canonical
        ? properties.find((p: any) => {
            const ids = [p.property_id, p.id, p.propertyId].filter(Boolean);
            return ids.some((x: any) => String(x) === String(propertyId));
          })
        : null;

      setDealDetail(canonical ?? fallback ?? null);
    } catch {
      setDealDetail(null);
    } finally {
      setDealLoading(false);
    }
  };

  // tasks mutations (unchanged)
  const createTaskMutation = useMutation({
    mutationFn: async (payload: { task_text: string }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || body?.message || "Failed to create task");
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setShowAddTask(false);
      setTaskText("");
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: boolean }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error || body?.message || "Failed to toggle task");
      return body;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }),
  });

  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!taskText || taskText.trim().length === 0) return alert("Enter a task");
    await createTaskMutation.mutateAsync({ task_text: taskText.trim() });
  };

  // image onError helper: hide broken image
  const handleImgError = (ev: React.SyntheticEvent<HTMLImageElement>) => {
    const img = ev.currentTarget;
    img.style.display = "none";
    img.setAttribute("data-load-failed", "true");
  };

  // === UI ===
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f7fb_0%,#eef6ff_100%)]">
      <div className="px-8 pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl p-3 bg-gradient-to-br from-[#6b5cff] to-[#a84dff] shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Client Management</h1>
              <p className="mt-1 text-sm text-slate-500">Relationship & deals</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-xl p-6 bg-gradient-to-br from-[#2b74ff] to-[#2a5bff] shadow-md text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Clients</p>
                <p className="text-3xl font-extrabold mt-2">{totalClients}</p>
              </div>
              <Users className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="rounded-xl p-6 bg-gradient-to-br from-[#02b875] to-[#00a56a] shadow-md text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Deals</p>
                <p className="text-3xl font-extrabold mt-2">{totalDeals}</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="rounded-xl p-6 bg-gradient-to-br from-[#ff9100] to-[#ff6d00] shadow-md text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Tasks</p>
                <p className="text-3xl font-extrabold mt-2">{pendingTasks}</p>
              </div>
              <Clock className="w-8 h-8 opacity-80" />
            </div>
          </div>

          <div className="rounded-xl p-6 bg-gradient-to-br from-[#9b5cff] to-[#7b38ff] shadow-md text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Month</p>
                <p className="text-3xl font-extrabold mt-2">{monthlyDeals}</p>
              </div>
              <Target className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-6">
        <div className="bg-white rounded-2xl p-2 shadow-sm">
          <div className="flex items-center gap-4 px-4">
            <button onClick={() => setActiveTab("overview")} className={`rounded-lg px-5 py-3 ${activeTab === "overview" ? "bg-gradient-to-r from-[#6b5cff] to-[#a84dff] text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}>Overview</button>
            <button onClick={() => setActiveTab("clients")} className={`rounded-lg px-5 py-3 ${activeTab === "clients" ? "bg-gradient-to-r from-[#6b5cff] to-[#a84dff] text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}>Clients</button>
            <button onClick={() => setActiveTab("deals")} className={`rounded-lg px-5 py-3 ${activeTab === "deals" ? "bg-gradient-to-r from-[#6b5cff] to-[#a84dff] text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}>Deals</button>
            <button onClick={() => setActiveTab("tasks")} className={`rounded-lg px-5 py-3 ${activeTab === "tasks" ? "bg-gradient-to-r from-[#6b5cff] to-[#a84dff] text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}>Tasks</button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <div className="flex items-center justify-center mb-6">
                      <svg className="w-14 h-14 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5zm0 2c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" /></svg>
                    </div>
                    <p className="text-lg font-medium">No clients yet. Add your first client to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {clients.slice(0, 6).map((c: any, idx: number) => (
                      <div
                        key={`${c.owner_phone ?? ""}-${c.owner_name ?? ""}-${c.id ?? idx}`}
                        onClick={() => openClientModal(`${c.owner_phone ?? ""}||${c.owner_name ?? ""}`)}
                        className="flex items-center justify-between rounded-xl p-6 bg-gradient-to-r from-[#fff7ff] to-[#f6fbff] hover:shadow-md transition cursor-pointer"
                        style={{ paddingLeft: 18 }}
                      >
                        <div>
                          <p className="font-semibold text-lg text-slate-900">{c.owner_name ?? "—"}</p>
                          <p className="text-sm text-slate-500 mt-1">{c.owner_phone ?? "—"}</p>
                        </div>
                        <div className="text-sm text-slate-400">Clients</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Pipeline Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-slate-600">Active Deals</div>
                    <div className="font-semibold text-slate-700">{activeDealsCount}/{totalDeals}</div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full" style={{ width: `${activeDealPct}%`, background: "linear-gradient(90deg,#22c55e,#06b6d4)", transition: "width .4s ease" }} />
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-slate-600">Task Completion</div>
                    <div className="font-semibold text-slate-700">{tasks.length - pendingTasks}/{tasks.length || 0}</div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full" style={{ width: `${taskCompletionPct}%`, background: "linear-gradient(90deg,#60a5fa,#a78bfa)", transition: "width .4s ease" }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="rounded-xl p-6 bg-gradient-to-br from-[#e6f2ff] to-[#f3fbff] text-center">
                    <p className="text-3xl font-bold text-blue-600">{totalClients}</p>
                    <p className="text-sm mt-2 text-slate-500">Total Clients</p>
                  </div>
                  <div className="rounded-xl p-6 bg-gradient-to-br from-[#eefde7] to-[#f0fff7] text-center">
                    <p className="text-3xl font-bold text-emerald-600">{monthlyDeals}</p>
                    <p className="text-sm mt-2 text-slate-500">This Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "clients" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((c: any, idx: number) => (
              <Card key={`${c.owner_phone ?? ""}-${c.owner_name ?? ""}-${c.id ?? idx}`} className="rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div style={{ paddingLeft: 6 }}>
                      <p className="font-bold text-lg">{c.owner_name}</p>
                      <p className="text-sm text-slate-500 mt-1">{c.owner_phone}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className="capitalize">{c.count || 1} Properties</Badge>
                      <Button size="sm" variant="ghost" onClick={() => openClientModal(`${c.owner_phone ?? ""}||${c.owner_name ?? ""}`)}>View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "deals" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {properties.length === 0 && <p className="text-center text-slate-500 p-6">No deals (properties) yet</p>}
            {properties.map((d: any, idx: number) => {
              const badgeText = d.transaction_type ?? d.transactionType ?? d.property_type ?? d.propertyType ?? "Unknown";
              return (
                <Card key={d.property_id ?? d.id ?? idx} className="rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div style={{ paddingLeft: 6 }}>
                        <p className="font-semibold">{d.property_title}</p>
                        <p className="text-sm text-slate-500">{d.location}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="capitalize">{badgeText}</Badge>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openDealModal(d.property_id ?? d.id)}>View</Button>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-6">
            <div className="flex items-center justify-end">
              <Button onClick={() => setShowAddTask(true)} className="flex items-center gap-2 bg-gradient-to-br from-[#6b5cff] to-[#a84dff] text-white shadow-md">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {tasks.length === 0 && <p className="text-center text-slate-500 p-6">No tasks yet</p>}
              {tasks.map((t: any) => (
                <Card key={t.task_id} className="rounded-xl">
                  <CardContent className="flex items-center justify-between p-6">
                    <div style={{ paddingRight: 12 }}>
                      <p className={`font-medium ${t.status ? "line-through text-slate-400" : ""}`}>{t.task_text}</p>
                      <p className="text-xs text-slate-400 mt-1">Created: {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={Boolean(t.status)}
                          onChange={() => toggleTaskMutation.mutate({ id: t.task_id, status: !t.status })}
                        />
                        <span className={`w-11 h-6 inline-block rounded-full transition-colors ${t.status ? "bg-green-500" : "bg-gray-300"}`} />
                        <span className="ml-3 text-sm text-slate-600">{t.status ? "Complete" : "Mark Complete"}</span>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-24" />
      <MobileNavigation />

      {/* Client modal */}
      {clientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
          <div className="absolute inset-0 bg-black/30" onClick={() => setClientModalOpen(false)} />
          <div className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl overflow-auto max-h-[80vh]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{clientModalData?.owner_name || "Owner details"}</h3>
                <p className="text-sm text-slate-500">{clientModalData?.owner_phone || "—"}</p>
              </div>
              <div>
                <Button variant="ghost" onClick={() => setClientModalOpen(false)}>Close</Button>
              </div>
            </div>

            {clientModalLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
              </div>
            ) : clientModalData ? (
              <>
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Name</p>
                    <p className="font-medium">{clientModalData.owner_name}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium">{clientModalData.owner_phone}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Properties</p>
                    <p className="font-medium">{(clientModalData.properties || []).length}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-2">Properties</h4>
                  <div className="space-y-4">
                    {(clientModalData.properties || []).map((p: any, idx2: number) => {
                      // prefer normalized `.photos` (we normalized earlier)
                      const photos = p.photos && p.photos.length ? p.photos : parsePhotos(p.property_photos ?? p.photos ?? p.images ?? p.photos_list);
                      return (
                        <div key={p.property_id ?? p.id ?? `${clientModalData.owner_phone ?? ""}-${idx2}`} className="rounded-lg bg-white border border-slate-50 hover:shadow-sm transition p-6">
                          <div className="flex items-start justify-between">
                            <div style={{ paddingRight: 12 }}>
                              <p className="font-semibold text-lg">{p.property_title}</p>
                              <p className="text-sm text-slate-500 mt-1">{p.location || p.full_address}</p>

                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded">
                                  <p className="text-xs text-slate-400">Price</p>
                                  <p className="font-medium">{p.sale_price ?? p.price ?? "—"}</p>
                                </div>

                                <div className="p-3 bg-slate-50 rounded">
                                  <p className="text-xs text-slate-400">Type</p>
                                  <p className="font-medium">{p.property_type ?? p.transaction_type ?? "—"}</p>
                                </div>

                                <div className="p-3 bg-slate-50 rounded">
                                  <p className="text-xs text-slate-400">BHK / Area</p>
                                  <p className="font-medium">{p.bhk ? `${p.bhk} BHK` : "—"} {p.area ? `• ${p.area}${p.area_unit ?? ""}` : ""}</p>
                                </div>

                                <div className="p-3 bg-slate-50 rounded">
                                  <p className="text-xs text-slate-400">Owner</p>
                                  <p className="font-medium">{p.owner_name || "—"} <span className="text-sm text-slate-400 block">{p.owner_phone}</span></p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                              <Badge className="capitalize">{p.approval_status ?? "pending"}</Badge>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => openDealModal(p.property_id ?? p.id)}>Open</Button>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3">
                            <div className="p-4 bg-slate-50 rounded">
                              <p className="text-xs text-slate-400">Flat / Floor / Building</p>
                              <p className="font-medium">{[p.flat_number ?? p.flatNumber ?? "—", p.floor ?? "—", p.building_society ?? p.buildingSociety ?? "—"].filter(Boolean).join(" • ")}</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded">
                              <p className="text-xs text-slate-400">Agreement Document</p>
                              <p className="font-medium">{p.agreement_document || "—"}</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded">
                              <p className="text-xs text-slate-400">Property Photos</p>
                              <div className="mt-2 flex gap-2 flex-wrap">
                                {photos && photos.length > 0 ? photos.slice(0, 6).map((url: string, i: number) => {
                                  const safe = normalizeUrl(String(url));
                                  return (
                                    <div key={`${safe}-${i}`} className="mr-3 mb-3">
                                      <img
                                        src={safe}
                                        alt={`photo-${i}`}
                                        className="w-20 h-14 object-cover rounded"
                                        onError={handleImgError}
                                      />
                                    </div>
                                  );
                                }) : <p className="text-sm text-slate-500">No photos</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {(!clientModalData.properties || clientModalData.properties.length === 0) && (
                      <p className="text-sm text-slate-500">No properties for this client</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-500">Could not load client details</div>
            )}
          </div>
        </div>
      )}

      {/* Deal modal (images-only) */}
      {dealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDealModalOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl overflow-auto max-h-[80vh]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{dealDetail?.property_title || "Property details"}</h3>
                <p className="text-sm text-slate-500">{dealDetail?.location}</p>
              </div>
              <div>
                <Button variant="ghost" onClick={() => setDealModalOpen(false)}>Close</Button>
              </div>
            </div>

            {dealLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
              </div>
            ) : dealDetail ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Price</p>
                    <p className="font-medium">{dealDetail.sale_price ?? dealDetail.price ?? "N/A"}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="font-medium">{dealDetail.property_type ?? dealDetail.transaction_type ?? "N/A"}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">BHK / Area</p>
                    <p className="font-medium">{dealDetail.bhk ? `${dealDetail.bhk} BHK` : "—"} {dealDetail.area ? `• ${dealDetail.area}${dealDetail.area_unit ?? ""}` : ""}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">Owner</p>
                    <p className="font-medium">{dealDetail.owner?.name ?? dealDetail.owner_name ?? "N/A"} <span className="text-sm text-slate-400 block">{dealDetail.owner?.phone ?? dealDetail.owner_phone}</span></p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-2">Description</h4>
                  <p className="text-sm text-slate-600">{dealDetail.description || "No description provided."}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl p-4 bg-gradient-to-br from-[#fff7ff] to-[#f6fbff]">
                    <p className="text-xs text-slate-500">Listing Status</p>
                    <p className="font-semibold">{dealDetail.approval_status ?? dealDetail.ownerApprovalStatus ?? "pending"}</p>
                  </div>
                  <div className="rounded-xl p-4 bg-gradient-to-br from-[#eefde7] to-[#f0fff7]">
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="font-semibold">{dealDetail.created_at ? new Date(dealDetail.created_at).toLocaleString() : (dealDetail.createdAt ? new Date(dealDetail.createdAt).toLocaleString() : "N/A")}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <div className="p-4 bg-slate-50 rounded">
                    <p className="text-xs text-slate-400">Flat / Floor / Building</p>
                    <p className="font-medium">{[dealDetail.flat_number ?? dealDetail.flatNumber ?? "—", dealDetail.floor ?? "—", dealDetail.building_society ?? dealDetail.buildingSociety ?? "—"].filter(Boolean).join(" • ")}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded">
                    <p className="text-xs text-slate-400">Agreement Document</p>
                    <p className="font-medium">{dealDetail.agreement_document || "—"}</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded">
                    <p className="text-xs text-slate-400">Property Photos</p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {(() => {
                        const photos = dealDetail.photos && dealDetail.photos.length ? dealDetail.photos : parsePhotos(dealDetail.property_photos ?? dealDetail.photos ?? dealDetail.images ?? dealDetail.photos_list);
                        if (photos && photos.length > 0) {
                          return photos.slice(0, 8).map((url: string, i: number) => {
                            const safe = normalizeUrl(String(url));
                            return (
                              <div key={`${safe}-${i}`} className="mr-3 mb-3">
                                <img src={safe} alt={`photo-${i}`} className="w-28 h-20 object-cover rounded" onError={handleImgError} />
                              </div>
                            );
                          });
                        }
                        return <p className="text-sm text-slate-500">No photos</p>;
                      })()}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-500">Could not load property details</div>
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAddTask(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-3">Add Task</h3>
            <form onSubmit={handleAddTask}>
              <label className="block text-sm text-slate-600 mb-2">Task</label>
              <textarea value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="E.g., Call client to confirm documents" className="w-full h-28 p-3 border rounded-md mb-4" />
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowAddTask(false)}>Cancel</Button>
                <Button type="submit" className="bg-gradient-to-br from-[#6b5cff] to-[#a84dff] text-white">Add Task</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
