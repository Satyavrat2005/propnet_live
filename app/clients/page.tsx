'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, TrendingUp, Clock, DollarSign, IndianRupee, Calendar, Search, Filter, MoreVertical, User, Building, FileText, CheckCircle, XCircle, AlertCircle, Target, Star, ChevronRight, Activity, Zap, ArrowUpRight, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { AgentNotificationModal } from "@/components/ui/agent-notification-modal";
import { useAuth } from "@/hooks/use-auth";

// Client form schema
const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  type: z.enum(["owner", "buyer", "tenant", "lead"]),
  budget: z.string().optional(),
  preferredLocation: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

// Deal form schema
const dealSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  clientId: z.number(),
  propertyId: z.number().optional(),
  dealType: z.enum(["sale", "rent", "lease"]),
  value: z.string().optional(),
  commissionType: z.enum(["percentage", "fixed"]).optional(),
  commissionValue: z.string().optional(),
  expectedClosure: z.string().optional(),
  notes: z.string().optional(),
});

// Task form schema
const taskSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  dealId: z.number(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
});

export default function ClientsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState<any>(null);
  const [selectedClientType, setSelectedClientType] = useState("lead");
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  // User data for agent notifications
  const { user } = useAuth();

  // Queries
  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: deals, isLoading: isLoadingDeals } = useQuery({
    queryKey: ["/api/deals"],
  });

  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks"],
  });

  // Agent notification handler
  const handleSendNotification = async (message: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/clients/${newClientData.id}/send-notification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Notification error:", error);
      return false;
    }
  };

  // Mutations
  const createClientMutation = useMutation({
    mutationFn: async (data: z.infer<typeof clientSchema>) => {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create client");
      return response.json();
    },
    onSuccess: (createdClient, formData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsCreateClientOpen(false);
      clientForm.reset();
      
      // Set up notification modal data
      setNewClientData({
        ...createdClient,
        requirementType: formData.type,
        propertyType: formData.requirements
      });
      setIsNotificationModalOpen(true);
      
      toast({ title: "Client created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create client", variant: "destructive" });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<z.infer<typeof clientSchema>> }) => {
      const response = await fetch(`/api/clients/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update client");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsEditClientOpen(false);
      setEditingClient(null);
      editClientForm.reset();
      toast({ title: "Client updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update client", variant: "destructive" });
    },
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dealSchema>) => {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      setIsCreateDealOpen(false);
      dealForm.reset();
      toast({ title: "Deal created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create deal", variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof taskSchema>) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsCreateTaskOpen(false);
      taskForm.reset();
      toast({ title: "Task created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  // Forms
  const clientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      type: "lead",
      budget: "",
      preferredLocation: "",
      requirements: "",
      notes: "",
    },
  });

  const editClientForm = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      type: "lead",
      budget: "",
      preferredLocation: "",
      requirements: "",
      notes: "",
    },
  });

  const dealForm = useForm<z.infer<typeof dealSchema>>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: "",
      dealType: "sale",
      value: "",
      commissionType: "percentage",
      commissionValue: "",
      expectedClosure: "",
      notes: "",
    },
  });

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
    },
  });

  // Form handlers
  const onCreateClient = (data: z.infer<typeof clientSchema>) => {
    createClientMutation.mutate(data);
  };

  const onEditClient = (data: z.infer<typeof clientSchema>) => {
    if (!editingClient) return;
    updateClientMutation.mutate({ id: editingClient.id, updates: data });
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    editClientForm.reset({
      name: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
      type: client.type || "lead",
      budget: client.budget || "",
      preferredLocation: client.preferredLocation || "",
      requirements: client.requirements || "",
      notes: client.notes || "",
    });
    setSelectedClientType(client.type || "lead");
    setIsEditClientOpen(true);
  };

  const onCreateDeal = (data: z.infer<typeof dealSchema>) => {
    createDealMutation.mutate(data);
  };

  const onCreateTask = (data: z.infer<typeof taskSchema>) => {
    createTaskMutation.mutate(data);
  };

  // Loading state
  if (isLoadingClients || isLoadingDeals || isLoadingTasks) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-purple-200 opacity-20"></div>
        </div>
      </div>
    );
  }

  // Calculate metrics safely
  const clientsArray = Array.isArray(clients) ? clients : [];
  const dealsArray = Array.isArray(deals) ? deals : [];
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  const totalClients = clientsArray.length;
  const activeDeals = dealsArray.filter((deal: any) => deal.status === 'active').length;
  const pendingTasks = tasksArray.filter((task: any) => task.status === 'pending').length;
  const monthlyClosures = dealsArray.filter((deal: any) => {
    if (!deal.actualClosure) return false;
    const closureDate = new Date(deal.actualClosure);
    const now = new Date();
    return closureDate.getMonth() === now.getMonth() && closureDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Mobile-Optimized Header */}
      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-indigo-600/10"></div>
        <div className="relative px-4 py-4">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Client Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Relationship & deals
                </p>
              </div>
            </div>
            <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>

          {/* Mobile-Optimized Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium">Clients</p>
                    <p className="text-2xl font-bold">{totalClients}</p>
                  </div>
                  <Users className="h-6 w-6 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium">Deals</p>
                    <p className="text-2xl font-bold">{activeDeals}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-xs font-medium">Tasks</p>
                    <p className="text-2xl font-bold">{pendingTasks}</p>
                  </div>
                  <Clock className="h-6 w-6 text-amber-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-medium">Month</p>
                    <p className="text-2xl font-bold">{monthlyClosures}</p>
                  </div>
                  <Target className="h-6 w-6 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Tabs */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 mb-6 shadow-lg">
            <TabsTrigger 
              value="dashboard" 
              className="rounded-lg font-medium text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white py-2"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="clients"
              className="rounded-lg font-medium text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white py-2"
            >
              <Users className="h-3 w-3 mr-1" />
              Clients
            </TabsTrigger>
            <TabsTrigger 
              value="deals"
              className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Deals
            </TabsTrigger>
            <TabsTrigger 
              value="tasks"
              className="rounded-xl font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-xl rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Recent Activity</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clientsArray.slice(0, 3).map((client: any, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">{client.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">New {client.type} added</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                    {clientsArray.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No clients yet. Add your first client to get started!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pipeline Status */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-xl rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Pipeline Status</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Deals</span>
                        <span className="text-sm font-bold text-emerald-600">{activeDeals}/{dealsArray.length}</span>
                      </div>
                      <Progress 
                        value={dealsArray.length > 0 ? (activeDeals / dealsArray.length) * 100 : 0} 
                        className="h-3 bg-gray-200 dark:bg-gray-700"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Completion</span>
                        <span className="text-sm font-bold text-blue-600">
                          {tasksArray.length - pendingTasks}/{tasksArray.length}
                        </span>
                      </div>
                      <Progress 
                        value={tasksArray.length > 0 ? ((tasksArray.length - pendingTasks) / tasksArray.length) * 100 : 0}
                        className="h-3 bg-gray-200 dark:bg-gray-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                        <p className="text-2xl font-bold text-blue-600">{totalClients}</p>
                        <p className="text-sm text-blue-600/80">Total Clients</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
                        <p className="text-2xl font-bold text-emerald-600">{monthlyClosures}</p>
                        <p className="text-sm text-emerald-600/80">This Month</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 rounded-xl"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="owner">Owners</SelectItem>
                    <SelectItem value="buyer">Buyers</SelectItem>
                    <SelectItem value="tenant">Tenants</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientsArray
                .filter((client: any) => {
                  const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      client.phone.includes(searchTerm);
                  const matchesFilter = filterType === "all" || client.type === filterType;
                  return matchesSearch && matchesFilter;
                })
                .map((client: any) => (
                  <Card key={client.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{client.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{client.phone}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={client.type === 'owner' ? 'default' : 'secondary'}
                          className="capitalize font-semibold"
                        >
                          {client.type}
                        </Badge>
                      </div>
                      
                      {client.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{client.email}</p>
                      )}
                      
                      {client.budget && (
                        <div className="flex items-center space-x-2 mb-3">
                          <IndianRupee className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-600">₹{client.budget}</span>
                        </div>
                      )}
                      
                      {client.preferredLocation && (
                        <div className="flex items-center space-x-2 mb-3">
                          <Building className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{client.preferredLocation}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-xs text-gray-500">
                          Added {new Date(client.createdAt).toLocaleDateString()}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/clients/${client.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Create Deal</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                              Edit Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {clientsArray.length === 0 && (
              <div className="text-center py-16">
                <div className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl inline-block mb-6">
                  <Users className="h-16 w-16 text-blue-500 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No clients yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Start building your client base by adding your first client</p>
                <Button 
                  onClick={() => setIsCreateClientOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Client
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Active Deals</h2>
              <Dialog open={isCreateDealOpen} onOpenChange={setIsCreateDealOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold px-6 py-3 rounded-xl">
                    <Plus className="h-5 w-5 mr-2" />
                    New Deal
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {dealsArray.map((deal: any) => (
                <Card key={deal.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-xl rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{deal.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {deal.client ? deal.client.name : 'Client not found'}
                        </p>
                      </div>
                      <Badge variant={deal.status === 'active' ? 'default' : 'secondary'}>
                        {deal.status}
                      </Badge>
                    </div>
                    
                    {deal.value && (
                      <div className="flex items-center space-x-2 mb-3">
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-emerald-600">₹{deal.value}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-xs text-gray-500">{deal.dealType}</span>
                      <span className="text-xs text-gray-500">{deal.stage}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {dealsArray.length === 0 && (
              <div className="text-center py-16">
                <TrendingUp className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">No deals yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first deal to start tracking progress</p>
                <Button 
                  onClick={() => setIsCreateDealOpen(true)}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Deal
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Task Management</h2>
              <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl">
                    <Plus className="h-5 w-5 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            <div className="space-y-4">
              {tasksArray.map((task: any) => (
                <Card key={task.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                        {task.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                          >
                            {task.priority} priority
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Deal: {task.deal ? task.deal.title : 'Not specified'}
                          </span>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {tasksArray.length === 0 && (
              <div className="text-center py-16">
                <CheckCircle className="h-16 w-16 text-amber-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-2">No tasks yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Stay organized by creating tasks for your deals</p>
                <Button 
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 py-3 rounded-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Task
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile-Optimized Create Client Dialog */}
      <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
        <DialogContent className="w-[95vw] max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-800/50 rounded-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Add New Client
            </DialogTitle>
          </DialogHeader>
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(onCreateClient)} className="space-y-4">
              <FormField
                control={clientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter client name" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={clientForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 9876543210" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Email (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="client@example.com" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={clientForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Client Type</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedClientType(value);
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-700 h-11">
                          <SelectValue placeholder="Select client type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lead">Lead - Prospective Client</SelectItem>
                        <SelectItem value="buyer">Buyer - Looking to Purchase</SelectItem>
                        <SelectItem value="owner">Owner - Property Owner</SelectItem>
                        <SelectItem value="tenant">Tenant - Looking to Rent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Type-specific fields */}
              {(selectedClientType === "buyer" || selectedClientType === "tenant") && (
                <>
                  <FormField
                    control={clientForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          {selectedClientType === "buyer" ? "Purchase Budget" : "Monthly Rent Budget"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={selectedClientType === "buyer" ? "e.g., ₹50,00,000" : "e.g., ₹25,000/month"} 
                            className="rounded-lg border-gray-200 dark:border-gray-700 h-11" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="preferredLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Preferred Areas</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Bandra, Andheri, Juhu" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          {selectedClientType === "buyer" ? "Property Requirements" : "Rental Requirements"}
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder={selectedClientType === "buyer" 
                              ? "e.g., 2-3 BHK, parking, gym, near metro..." 
                              : "e.g., 1-2 BHK, furnished, pet-friendly..."
                            } 
                            className="rounded-lg border-gray-200 dark:border-gray-700" 
                            rows={2} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedClientType === "owner" && (
                <>
                  <FormField
                    control={clientForm.control}
                    name="preferredLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Property Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Bandra West, Andheri East" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Property Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="e.g., 3 BHK apartment, 1200 sq ft, ready to sell/rent..."
                            className="rounded-lg border-gray-200 dark:border-gray-700" 
                            rows={2} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={clientForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Expected Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., ₹1.2 Cr (sale) or ₹30,000/month (rent)" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedClientType === "lead" && (
                <FormField
                  control={clientForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Interest & Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="What are they looking for? Buying, selling, renting..."
                          className="rounded-lg border-gray-200 dark:border-gray-700" 
                          rows={2} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateClientOpen(false)}
                  className="flex-1 rounded-lg border-gray-200 dark:border-gray-700 h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createClientMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg h-11"
                >
                  {createClientMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="w-[95vw] max-w-sm bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-800/50 rounded-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Edit Client
            </DialogTitle>
          </DialogHeader>
          <Form {...editClientForm}>
            <form onSubmit={editClientForm.handleSubmit(onEditClient)} className="space-y-4">
              <FormField
                control={editClientForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter client name" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editClientForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+91 9876543210" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editClientForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Email (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="client@example.com" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editClientForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Client Type</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedClientType(value);
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-lg border-gray-200 dark:border-gray-700 h-11">
                          <SelectValue placeholder="Select client type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="lead">Lead - Prospective Client</SelectItem>
                        <SelectItem value="buyer">Buyer - Looking to Purchase</SelectItem>
                        <SelectItem value="owner">Owner - Property Owner</SelectItem>
                        <SelectItem value="tenant">Tenant - Looking to Rent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Type-specific fields for edit form */}
              {(selectedClientType === "buyer" || selectedClientType === "tenant") && (
                <>
                  <FormField
                    control={editClientForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          {selectedClientType === "buyer" ? "Purchase Budget" : "Monthly Rent Budget"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={selectedClientType === "buyer" ? "e.g., ₹50,00,000" : "e.g., ₹25,000/month"} 
                            className="rounded-lg border-gray-200 dark:border-gray-700 h-11" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editClientForm.control}
                    name="preferredLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Preferred Areas</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Bandra, Andheri, Juhu" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editClientForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">
                          {selectedClientType === "buyer" ? "Property Requirements" : "Rental Requirements"}
                        </FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder={selectedClientType === "buyer" 
                              ? "e.g., 2-3 BHK, parking, gym, near metro..." 
                              : "e.g., 1-2 BHK, furnished, pet-friendly..."
                            } 
                            className="rounded-lg border-gray-200 dark:border-gray-700" 
                            rows={2} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedClientType === "owner" && (
                <>
                  <FormField
                    control={editClientForm.control}
                    name="preferredLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Property Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Bandra West, Andheri East" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editClientForm.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Property Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="e.g., 3 BHK apartment, 1200 sq ft, ready to sell/rent..."
                            className="rounded-lg border-gray-200 dark:border-gray-700" 
                            rows={2} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editClientForm.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Expected Price</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., ₹1.2 Cr (sale) or ₹30,000/month (rent)" className="rounded-lg border-gray-200 dark:border-gray-700 h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {selectedClientType === "lead" && (
                <FormField
                  control={editClientForm.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Interest & Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="What are they looking for? Buying, selling, renting..."
                          className="rounded-lg border-gray-200 dark:border-gray-700" 
                          rows={2} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={editClientForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Additional notes about this client..."
                        className="rounded-lg border-gray-200 dark:border-gray-700" 
                        rows={2} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditClientOpen(false)}
                  className="flex-1 rounded-lg border-gray-200 dark:border-gray-700 h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateClientMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg h-11"
                >
                  {updateClientMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Agent Notification Modal */}
      {newClientData && user && (
        <AgentNotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => {
            setIsNotificationModalOpen(false);
            setNewClientData(null);
          }}
          clientData={{
            name: newClientData.name,
            phone: newClientData.phone,
            requirementType: newClientData.requirementType,
            propertyType: newClientData.propertyType
          }}
          agentData={{
            name: user.name || "Agent",
            phone: user.phone || "",
            agency: user.agencyName || undefined
          }}
          onSendNotification={handleSendNotification}
        />
      )}

      {/* Bottom spacing for navigation */}
      <div className="h-20"></div>
      
      <MobileNavigation />
    </div>
  );
}