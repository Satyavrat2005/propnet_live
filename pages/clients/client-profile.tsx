'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Calendar,
  Clock,
  User,
  FileText,
  Handshake,
  TrendingUp,
  Target,
  CheckCircle,
  AlertCircle,
  Edit,
  Plus,
  Activity,
  DollarSign,
  Building,
  Users
} from "lucide-react";

// Schema definitions
const dealSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dealType: z.enum(["sale", "rent", "lease"]),
  value: z.string().optional(),
  commissionType: z.enum(["percentage", "fixed"]).optional(),
  commissionValue: z.string().optional(),
  expectedClosure: z.string().optional(),
  notes: z.string().optional(),
});
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
});
const clientUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  type: z.enum(["owner", "buyer", "tenant", "lead"]),
  budget: z.string().optional(),
  preferredLocation: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

export default function ClientProfile() {
  const params = useParams();
  const clientId = Array.isArray(params?.clientId) ? params?.clientId[0] : params?.clientId ?? "";
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
 
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDealOpen, setIsDealOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch client data
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  }) as { data: any, isLoading: boolean };

  // Fetch client deals
  const { data: deals = [] } = useQuery({
    queryKey: ["/api/deals", "client", clientId],
    enabled: !!clientId,
  }) as { data: any[] };

  // Fetch client tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks", "client", clientId],
    enabled: !!clientId,
  }) as { data: any[] };

  // Forms
  const editForm = useForm({
    resolver: zodResolver(clientUpdateSchema),
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

  const dealForm = useForm({
    resolver: zodResolver(dealSchema),
  });

  const taskForm = useForm({
    resolver: zodResolver(taskSchema),
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update client");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Client updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsEditOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update client", variant: "destructive" });
    },
  });

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, clientId: parseInt(clientId!) }),
      });
      if (!response.ok) throw new Error("Failed to create deal");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Deal created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/deals", "client", clientId] });
      setIsDealOpen(false);
      dealForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create deal", variant: "destructive" });
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, dealId: data.dealId }),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Task created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", "client", clientId] });
      setIsTaskOpen(false);
      taskForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  // Set form defaults when client data loads
  useEffect(() => {
    if (client) {
      editForm.reset({
        name: client.name || "",
        phone: client.phone || "",
        email: client.email || "",
        type: client.type || "lead",
        budget: client.budget || "",
        preferredLocation: client.preferredLocation || "",
        requirements: client.requirements || "",
        notes: client.notes || "",
      });
    }
  }, [client, editForm]);

  const onUpdateClient = (data: any) => {
    console.log("Updating client with data:", data);
    updateClientMutation.mutate(data);
  };

  const onCreateDeal = (data: any) => {
    createDealMutation.mutate(data);
  };

  const onCreateTask = (data: any) => {
    createTaskMutation.mutate(data);
  };

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Client not found</p>
          <Button onClick={() => router.push("/clients")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
        <MobileNavigation />
      </div>
    );
  }

  // Calculate metrics
  const activeDeals = deals.filter((deal: any) => deal.status === "active").length;
  const pendingTasks = tasks.filter((task: any) => task.status === "pending").length;
  const totalCommission = deals.reduce((sum: number, deal: any) => {
    if (deal.commissionType === "fixed" && deal.commissionValue) {
      return sum + parseFloat(deal.commissionValue);
    }
    return sum;
  }, 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "owner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "buyer": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "tenant": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "lead": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "closed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-indigo-600/10"></div>
        <div className="relative px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard?tab=clients")}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {client.name}
                </h1>
                <div className="flex items-center space-x-2">
                  <Badge className={getTypeColor(client.type)}>
                    {client.type}
                  </Badge>
                  <Badge className={getStatusColor(client.status)}>
                    {client.status}
                  </Badge>
                </div>
              </div>
            </div>
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Client</DialogTitle>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onUpdateClient)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Client name" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                   
                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Phone number" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                   
                    <FormField
                      control={editForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Email address" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                   
                    <FormField
                      control={editForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="buyer">Buyer</SelectItem>
                              <SelectItem value="tenant">Tenant</SelectItem>
                              <SelectItem value="lead">Lead</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                   
                    <FormField
                      control={editForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Budget range" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                   
                    <FormField
                      control={editForm.control}
                      name="preferredLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Preferred area" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                   
                    <FormField
                      control={editForm.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requirements</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Property requirements" rows={3} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                   
                    <FormField
                      control={editForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Additional notes" rows={2} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                   
                    <div className="flex space-x-3">
                      <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateClientMutation.isPending} className="flex-1">
                        {updateClientMutation.isPending ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{activeDeals}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Active Deals</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">{pendingTasks}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending Tasks</p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <IndianRupee className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">₹{totalCommission.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Commission</p>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="px-4 py-6 pb-24">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{client.phone}</span>
                </div>
                {client.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                )}
                {client.preferredLocation && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{client.preferredLocation}</span>
                  </div>
                )}
                {client.budget && (
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{client.budget}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Requirements */}
            {client.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Requirements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {client.requirements}
                  </p>
                </CardContent>
              </Card>
            )}
            {/* Notes */}
            {client.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Notes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {client.notes}
                  </p>
                </CardContent>
              </Card>
            )}
            {/* Commission & Agreement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Handshake className="h-5 w-5" />
                  <span>Commission & Agreements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Commission</p>
                    <p className="text-lg font-bold text-green-600">₹{totalCommission.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Active Agreements</p>
                    <p className="text-lg font-bold text-blue-600">{activeDeals}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Transparency & Trust</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• All commission terms are clearly documented</li>
                    <li>• Client has access to deal progress updates</li>
                    <li>• Regular activity tracking ensures accountability</li>
                    <li>• Mutual agreement protection for all parties</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Deals</h3>
              <Dialog open={isDealOpen} onOpenChange={setIsDealOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Deal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Deal</DialogTitle>
                  </DialogHeader>
                  <Form {...dealForm}>
                    <form onSubmit={dealForm.handleSubmit(onCreateDeal)} className="space-y-4">
                      <FormField
                        control={dealForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dealForm.control}
                        name="dealType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deal Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sale">Sale</SelectItem>
                                <SelectItem value="rent">Rent</SelectItem>
                                <SelectItem value="lease">Lease</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dealForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 5000000" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dealForm.control}
                        name="commissionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dealForm.control}
                        name="commissionValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commission Value</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 2.5 or 100000" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dealForm.control}
                        name="expectedClosure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expected Closure</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dealForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDealOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createDealMutation.isPending}
                          className="flex-1"
                        >
                          {createDealMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            {deals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No deals yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {deals.map((deal: any) => (
                  <Card key={deal.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{deal.title}</h4>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Type: {deal.dealType}</p>
                        {deal.value && <p>Value: ₹{deal.value}</p>}
                        {deal.commissionType && deal.commissionValue && (
                          <p>Commission: {deal.commissionType === "percentage" ? `${deal.commissionValue}%` : `₹${deal.commissionValue}`}</p>
                        )}
                        {deal.expectedClosure && (
                          <p>Expected Closure: {new Date(deal.expectedClosure).toLocaleDateString()}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tasks</h3>
              <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Task</DialogTitle>
                  </DialogHeader>
                  <Form {...taskForm}>
                    <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
                      <FormField
                        control={taskForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={taskForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={taskForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={taskForm.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsTaskOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createTaskMutation.isPending}
                          className="flex-1"
                        >
                          {createTaskMutation.isPending ? "Creating..." : "Create"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No tasks yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task: any) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {task.description}
                        </p>
                      )}
                      {task.dueDate && (
                        <p className="text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Client profile created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {deals.map((deal: any) => (
                    <div key={`deal-${deal.id}`} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Deal "{deal.title}" created</p>
                        <p className="text-xs text-gray-500">
                          {new Date(deal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {tasks.map((task: any) => (
                    <div key={`task-${task.id}`} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Task "{task.title}" created</p>
                        <p className="text-xs text-gray-500">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <MobileNavigation />
    </div>
  );
}