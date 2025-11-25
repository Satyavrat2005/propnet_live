// app/bulk-upload/page.tsx
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, FileText, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/app-layout";

type BulkUploadResult = {
  total: number;
  successful: number;
  failed: number;
  errors: string[];
  duplicates?: Array<{ row: number; message: string }>;
  smsWarnings?: Array<{ row: number; status: string; error?: string | null }>;
};

export default function BulkUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // apiRequest may be a wrapper around fetch — keep behaviour similar to original
      const formData = new FormData();
      formData.append("file", file);

      const resp = await apiRequest("POST", "/api/properties/bulk-upload", formData);
      // apiRequest might return a Response or already-parsed object — handle both
      if (resp && typeof (resp as Response).json === "function") {
        return (resp as Response).json();
      }
      return resp;
    },
    onSuccess: (data: BulkUploadResult) => {
      setUploadResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-properties"] });
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${data?.successful ?? 0} properties. ${data?.failed ?? 0} failed.`,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to upload properties.";
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (uploadFiles.length === 0) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(uploadFiles[0]);
  };

  const downloadTemplate = () => {
    const csvContent = `title,propertyType,transactionType,price,rentFrequency,size,sizeUnit,location,fullAddress,flatNumber,floorNumber,buildingSociety,description,bhk,listingType,isPubliclyVisible,ownerName,ownerPhone,commissionTerms,scopeOfWork
"3BHK Luxury Apartment","Apartment","sale","₹85,00,000",,"1200","sq.ft","Bandra West, Mumbai","Bandra West, Mumbai, Maharashtra","A-1201","12","Skyline Heights","Spacious apartment with modern amenities",3,"exclusive",false,"Arjun Shah","+919999888777","2% on closing","Property Viewing Coordination|Documentation Support"
"Premium Rental Loft","Apartment","rent","₹75,000","monthly","950","sq.ft","Khar West, Mumbai","Khar West, Mumbai, Maharashtra","501","5","Palm Residency","Fully furnished loft with balconies",2,"colisting",true,"Neha Patel","9999988877","1 month's rent","Marketing & Promotion|Negotiation Assistance"`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "property_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded to your device.",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadFiles(file ? [file] : []);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto w-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Bulk Upload Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload multiple properties at once using a CSV file
          </p>
        </div>

        <div className="space-y-6">
        {/* Instructions */}
        <Card className="card-modern group hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b bg-linear-to-r from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">
                Upload Instructions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div>
                  <p className="font-semibold text-foreground">Download Template</p>
                  <p className="text-sm text-muted-foreground">Download the CSV template with the required format</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div>
                  <p className="font-semibold text-foreground">Fill Property Details</p>
                  <p className="text-sm text-muted-foreground">Add your property information following the template format</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div>
                  <p className="font-semibold text-foreground">Upload CSV File</p>
                  <p className="text-sm text-muted-foreground">Upload your completed CSV file to create multiple listings</p>
                </div>
              </div>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full flex items-center gap-2 border-gray-300 hover:border-blue-500/40 hover:bg-blue-50 hover:text-blue-700 transition-all group"
              type="button"
            >
              <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
              <span>Download CSV Template</span>
            </Button>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card className="card-modern group hover:shadow-lg transition-all duration-300 hover:border-blue-500/40">
          <CardHeader className="border-b bg-linear-to-r from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">Upload CSV File</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={openFilePicker}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openFilePicker();
                }
              }}
              className="bento-card border-2 border-dashed p-8 text-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-50/50 transition-all duration-300 group"
            >
              <FileSpreadsheet className="mx-auto text-muted-foreground group-hover:text-blue-600 transition-colors mb-3" size={48} />
              <p className="text-foreground font-semibold">{uploadFiles[0]?.name || "Click to choose your CSV"}</p>
              <p className="text-xs text-muted-foreground mt-2">Accepted format: .csv • Max 5 MB</p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploadFiles.length === 0 || uploadMutation.isPending}
              className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white group"
              type="button"
            >
              {uploadMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <>
                  <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span>Upload Properties</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResults && (
          <Card className="card-modern border-l-4 border-l-green-500">
            <CardHeader className="border-b bg-linear-to-r from-green-500/5 to-green-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">Upload Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bento-card">
                  <span className="text-muted-foreground">Total Properties Processed:</span>
                  <span className="font-bold text-foreground text-lg">{uploadResults.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bento-card border-l-4 border-l-green-500">
                  <span className="text-green-600 font-medium">Successfully Created:</span>
                  <span className="badge-success text-base px-3 py-1">{uploadResults.successful ?? 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bento-card border-l-4 border-l-red-500">
                  <span className="text-red-600 font-medium">Failed:</span>
                  <span className="badge-error text-base px-3 py-1">{uploadResults.failed ?? 0}</span>
                </div>

                {uploadResults.duplicates && uploadResults.duplicates.length > 0 && (
                  <div className="p-4 bento-card border-l-4 border-l-yellow-500 bg-yellow-50/50">
                    <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle size={16} className="text-yellow-600" />
                      Non-unique rows
                    </p>
                    <div className="space-y-2">
                      {uploadResults.duplicates.map((item, index) => (
                        <div key={`${item.row}-${index}`} className="flex items-start gap-2 text-sm">
                          <span className="badge-warning px-2 py-0.5 shrink-0">Row {item.row}</span>
                          <span className="text-muted-foreground">{item.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResults.smsWarnings && uploadResults.smsWarnings.length > 0 && (
                  <div className="p-4 bento-card border-l-4 border-l-orange-500 bg-orange-50/50">
                    <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle size={16} className="text-orange-600" />
                      SMS warnings
                    </p>
                    <div className="space-y-2">
                      {uploadResults.smsWarnings.map((item, index) => (
                        <div key={`${item.row}-${item.status}-${index}`} className="flex items-start gap-2 text-sm">
                          <span className="badge-warning px-2 py-0.5 shrink-0">Row {item.row}</span>
                          <span className="text-muted-foreground">
                            status {item.status}
                            {item.error ? ` - ${item.error}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="p-4 bento-card border-l-4 border-l-red-500 bg-red-50/50">
                    <p className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-600" />
                      Errors
                    </p>
                    <div className="space-y-2">
                      {uploadResults.errors.map((error: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                          <span className="text-red-600">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Format Guidelines */}
        <Card className="card-modern group hover:shadow-lg transition-all duration-300 hover:border-blue-500/40">
          <CardHeader className="border-b bg-linear-to-r from-blue-500/5 to-blue-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-semibold text-foreground">CSV Format Guidelines</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-2">Required Columns:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>title - Property title</li>
                  <li>propertyType - Apartment, Villa, Commercial, etc.</li>
                  <li>transactionType - sale or rent</li>
                  <li>price - Property price (e.g., ₹85,00,000 or 75000)</li>
                  <li>location & fullAddress - Area + detailed postal address</li>
                  <li>listingType - exclusive, colisting, or shared</li>
                  <li>ownerName & ownerPhone - Owner contact for consent</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">Optional Columns:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li>rentFrequency - monthly or yearly (only for rentals)</li>
                  <li>size & sizeUnit - Numeric area and unit (sq.ft, sq.m, sq.yd, acre)</li>
                  <li>flatNumber, floorNumber, buildingSociety - Helps detect duplicates</li>
                  <li>description, bhk, commissionTerms</li>
                  <li>isPubliclyVisible - TRUE/FALSE (defaults to true unless exclusive)</li>
                  <li>scopeOfWork - Use | to separate items (e.g., Marketing & Promotion|Documentation)</li>
                </ul>
              </div>
              <div className="p-4 bento-card bg-blue-50/50 border-l-4 border-l-blue-500">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Info size={16} className="text-blue-600" />
                  Duplicate Handling:
                </p>
                <p className="text-muted-foreground">
                  If a row matches an existing property (same owner, flat, floor, and society), it will be skipped and
                  listed under &ldquo;Non-unique rows&rdquo; while the rest continue uploading.
                </p>
                <p className="text-muted-foreground mt-2">
                  SMS warnings highlight owners who did not receive verification texts (for example, invalid phone
                  formats). Fix the phone number and resend consent from the property detail page if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </AppLayout>
  );
}