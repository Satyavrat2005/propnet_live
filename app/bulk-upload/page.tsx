// app/bulk-upload/page.tsx
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
    <div className="flex flex-col min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-100 z-10">
        <div className="flex items-center px-6 py-4">
          <button
            className="text-primary mr-4"
            onClick={() => router.push("/add-property")}
            aria-label="Back to add property"
            type="button"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900">Bulk Upload Properties</h2>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 space-y-6">
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet size={20} />
              <span>Upload Instructions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <div>
                  <p className="font-medium">Download Template</p>
                  <p className="text-sm text-neutral-600">Download the CSV template with the required format</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <div>
                  <p className="font-medium">Fill Property Details</p>
                  <p className="text-sm text-neutral-600">Add your property information following the template format</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <div>
                  <p className="font-medium">Upload CSV File</p>
                  <p className="text-sm text-neutral-600">Upload your completed CSV file to create multiple listings</p>
                </div>
              </div>
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full flex items-center space-x-2"
              type="button"
            >
              <Download size={16} />
              <span>Download CSV Template</span>
            </Button>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <FileSpreadsheet className="mx-auto text-3xl text-neutral-400 mb-2" size={48} />
              <p className="text-neutral-700 font-medium">{uploadFiles[0]?.name || "Click to choose your CSV"}</p>
              <p className="text-xs text-neutral-500 mt-1">Accepted format: .csv • Max 5 MB</p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploadFiles.length === 0 || uploadMutation.isPending}
              className="w-full flex items-center justify-center space-x-2 border-2 border-emerald-500 bg-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 text-white transition-all duration-200"
              type="button"
            >
              {uploadMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload Properties</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle size={20} className="text-green-600" />
                <span>Upload Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">Total Properties Processed:</span>
                  <span className="font-medium">{uploadResults.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600">Successfully Created:</span>
                  <span className="font-medium text-green-600">{uploadResults.successful ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-600">Failed:</span>
                  <span className="font-medium text-red-600">{uploadResults.failed ?? 0}</span>
                </div>

                {uploadResults.duplicates && uploadResults.duplicates.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-neutral-700 mb-2">Non-unique rows</p>
                    <div className="space-y-1 text-sm text-amber-700">
                      {uploadResults.duplicates.map((item, index) => (
                        <div key={`${item.row}-${index}`} className="flex items-start space-x-2">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          <span>
                            Row {item.row}: {item.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResults.smsWarnings && uploadResults.smsWarnings.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-neutral-700 mb-2">SMS warnings</p>
                    <div className="space-y-1 text-sm text-amber-700">
                      {uploadResults.smsWarnings.map((item, index) => (
                        <div key={`${item.row}-${item.status}-${index}`} className="flex items-start space-x-2">
                          <AlertCircle size={14} className="mt-0.5 shrink-0" />
                          <span>
                            Row {item.row}: status {item.status}
                            {item.error ? ` - ${item.error}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-neutral-700 mb-2">Errors:</p>
                    <div className="space-y-1">
                      {uploadResults.errors.map((error: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2 text-sm">
                          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
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
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Required Columns:</p>
                <ul className="list-disc list-inside space-y-1 text-neutral-600 ml-4">
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
                <p className="font-medium">Optional Columns:</p>
                <ul className="list-disc list-inside space-y-1 text-neutral-600 ml-4">
                  <li>rentFrequency - monthly or yearly (only for rentals)</li>
                  <li>size & sizeUnit - Numeric area and unit (sq.ft, sq.m, sq.yd, acre)</li>
                  <li>flatNumber, floorNumber, buildingSociety - Helps detect duplicates</li>
                  <li>description, bhk, commissionTerms</li>
                  <li>isPubliclyVisible - TRUE/FALSE (defaults to true unless exclusive)</li>
                  <li>scopeOfWork - Use | to separate items (e.g., Marketing & Promotion|Documentation)</li>
                </ul>
              </div>
              <div className="text-sm text-neutral-600">
                <p className="font-medium">Duplicate Handling:</p>
                <p>
                  If a row matches an existing property (same owner, flat, floor, and society), it will be skipped and
                  listed under &ldquo;Non-unique rows&rdquo; while the rest continue uploading.
                </p>
                <p className="mt-2">
                  SMS warnings highlight owners who did not receive verification texts (for example, invalid phone
                  formats). Fix the phone number and resend consent from the property detail page if needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}