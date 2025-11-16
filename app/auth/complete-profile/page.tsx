"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Upload, X, Plus, HelpCircle, CheckCircle2, ArrowLeft, ArrowRight, AlertCircle, ChevronDown, Check } from "lucide-react";

/**
 * Complete Profile page
 * Adapted from your original complete-profile.tsx (UI, placeholders, options preserved). :contentReference[oaicite:1]{index=1}
 *
 * Notes:
 * - This file expects a server endpoint at POST /api/auth/complete-profile that accepts FormData.
 * - It expects a GET /api/auth/me endpoint returning the logged-in user JSON (with phone, name, email).
 * - If you use a different server shape, adjust the fetch URLs accordingly.
 */

const AREA_OF_EXPERTISE_OPTIONS = {
  "Sales": [
    "Residential Sales",
    "Commercial Sales",
    "Luxury Properties",
    "Plot/Land Sales",
    "Villa/Independent Houses",
    "Apartments/Flats"
  ],
  "Rentals": [
    "Residential Rentals", 
    "Commercial Rentals",
    "Office Spaces",
    "Retail Spaces",
    "Co-working Spaces"
  ],
  "Specialized": [
    "Investment Properties",
    "Industrial Properties", 
    "Warehouse/Logistics",
    "Affordable Housing",
    "Builder Relations"
  ],
  "Services": [
    "Property Management",
    "Legal Documentation", 
    "Property Valuation",
    "Market Research"
  ]
};

const AHMEDABAD_AREAS = [
  "Bopal", "Prahlad Nagar", "Satellite", "Vastrapur", "Thaltej", "Bodakdev", 
  "Ambawadi", "Navrangpura", "C.G. Road", "Ashram Road", "Maninagar", 
  "Ghatlodia", "Shela", "South Bopal", "Sindhu Bhavan Road", "S.G. Highway",
  "Sarkhej", "Juhapura", "Vejalpur", "Chandkheda", "Motera", "Sabarmati",
  "Paldi", "Ellis Bridge", "Mithakhali", "Gurukul", "Drive-in Road",
  "Jodhpur", "Judges Bungalow", "Law Garden", "Nehru Nagar", "Sola",
  "Science City Road", "Prahladnagar", "Iscon", "Adani Shantigram"
];

const STEPS = [
  { id: 1, title: "Personal Information", description: "Basic details and photo" },
  { id: 2, title: "Agency Information", description: "RERA details and agency info" },
  { id: 3, title: "Professional Details", description: "Expertise and working areas" }
];

export default function CompleteProfile() {
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // user info fetched from /api/auth/me (expected to include phone, name, email)
  const [me, setMe] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Personal Information
    name: "",
    email: "",
    bio: "",
    
    // Agency Information  
    agencyName: "",
    reraId: "",
    
    // Professional Information
    city: "Ahmedabad",
    experience: "",
    website: "",
    
    // Arrays for multi-select
    areaOfExpertise: [] as string[],
    workingRegions: [] as string[],
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // For adding custom areas/regions
  const [customExpertise, setCustomExpertise] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [filteredRegions, setFilteredRegions] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  
  // Dropdown states
  const [expertiseDropdownOpen, setExpertiseDropdownOpen] = useState(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [fieldValidation, setFieldValidation] = useState<Record<string, boolean>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // fetch current user (phone, existing name/email) from server session
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setMe(json?.user ?? null);
        // populate initial fields if available
        setFormData(prev => ({
          ...prev,
          name: json?.user?.name ?? prev.name,
          email: json?.user?.email ?? prev.email,
          // keep others as defaults
        }));
      } catch (err) {
        // silently fail — user may fetch later or not have session
        console.warn("failed to fetch /api/auth/me", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Real-time validation
  useEffect(() => {
    const errors: Record<string, string> = {};
    const validation: Record<string, boolean> = {};

    // Step 1 validation
    if (currentStep >= 1) {
      validation.name = formData.name.trim().length >= 2;
      if (!validation.name) errors.name = "Name must be at least 2 characters";
      
      validation.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      if (!validation.email) errors.email = "Enter a valid email address";
    }

    // Step 2 validation
    if (currentStep >= 2) {
      validation.agencyName = formData.agencyName.trim().length >= 3;
      if (!validation.agencyName) errors.agencyName = "Agency name must be at least 3 characters";
      
      const gujaratReraPattern = /^AG\/GJ\/[A-Z\s]+\/[A-Z\s]+\/[A-Z\s]*\/[A-Z]{2}\d{5}\/[\dx]{1,6}R\d+$/i;
      validation.reraId = gujaratReraPattern.test(formData.reraId.toUpperCase());
      if (!validation.reraId && formData.reraId) {
        errors.reraId = "Invalid Gujarat RERA ID format. Use: AG/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/AA01234/150123R1";
      }
    }

    // Step 3 validation
    if (currentStep >= 3) {
      validation.areaOfExpertise = formData.areaOfExpertise.length > 0;
      if (!validation.areaOfExpertise) errors.areaOfExpertise = "Select at least one area of expertise";
      
      validation.workingRegions = formData.workingRegions.length > 0;
      if (!validation.workingRegions) errors.workingRegions = "Add at least one working region";
    }

    setValidationErrors(errors);
    setFieldValidation(validation);
  }, [formData, currentStep]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addExpertise = (expertise: string) => {
    if (expertise && !formData.areaOfExpertise.includes(expertise)) {
      setFormData(prev => ({
        ...prev,
        areaOfExpertise: [...prev.areaOfExpertise, expertise]
      }));
    }
  };

  const removeExpertise = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      areaOfExpertise: prev.areaOfExpertise.filter(item => item !== expertise)
    }));
  };

  const addCustomExpertise = () => {
    if (customExpertise.trim()) {
      addExpertise(customExpertise.trim());
      setCustomExpertise("");
    }
  };

  const getAvailableExpertiseOptions = () => {
    const available: Record<string, string[]> = {};
    Object.entries(AREA_OF_EXPERTISE_OPTIONS).forEach(([category, options]) => {
      const filteredOptions = options.filter(option => !formData.areaOfExpertise.includes(option));
      if (filteredOptions.length > 0) {
        available[category] = filteredOptions;
      }
    });
    return available;
  };

  const addWorkingRegion = (region: string) => {
    if (region && !formData.workingRegions.includes(region)) {
      setFormData(prev => ({
        ...prev,
        workingRegions: [...prev.workingRegions, region]
      }));
    }
  };

  const removeWorkingRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      workingRegions: prev.workingRegions.filter(item => item !== region)
    }));
  };

  const addCustomRegion = () => {
    if (customRegion.trim()) {
      addWorkingRegion(customRegion.trim());
      setCustomRegion("");
      setFilteredRegions([]);
    }
  };

  const handleRegionInputChange = (value: string) => {
    setCustomRegion(value);
    if (value.length > 0) {
      const filtered = AHMEDABAD_AREAS.filter(area => 
        area.toLowerCase().includes(value.toLowerCase()) &&
        !formData.workingRegions.includes(area)
      );
      setFilteredRegions(filtered);
    } else {
      setFilteredRegions([]);
    }
  };

  const canProceedToNext = () => {
    if (currentStep === 1) {
      return fieldValidation.name && fieldValidation.email;
    }
    if (currentStep === 2) {
      return fieldValidation.agencyName && fieldValidation.reraId;
    }
    if (currentStep === 3) {
      return fieldValidation.areaOfExpertise && fieldValidation.workingRegions;
    }
    return false;
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowSummary(true);
      }
    }
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();

      // append phone from authenticated user if available
      if (me?.phone) {
        fd.append("phone", me.phone);
      }

      // append all form fields
      Object.entries(formData).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, String(v ?? ""));
        }
      });

      if (profilePhoto) {
        fd.append("profilePhoto", profilePhoto);
      }

      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) {
        window.alert(json?.error || "Failed to complete profile. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // success - check user status and redirect accordingly
      const profile = json?.profile;
      if (profile) {
        const status = profile.status || "pending";
        
        if (status === "approved") {
          window.alert("Profile Completed! Welcome to PropNet.");
          router.push("/dashboard");
        } else {
          window.alert("Profile Completed! Your profile is pending approval.");
          router.push("/auth/approval-pending");
        }
      } else {
        // Fallback: redirect to approval pending (default for new profiles)
        window.alert("Profile Completed! Your profile is pending approval.");
        router.push("/auth/approval-pending");
      }
    } catch (err: any) {
      console.error("complete-profile submit error", err);
      window.alert("Unexpected error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const renderValidationIcon = (fieldName: string) => {
    if (fieldValidation[fieldName]) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (validationErrors[fieldName]) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return null;
  };

  // step renderers (kept identical to original UI and placeholders)
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Label className="text-lg font-semibold text-gray-700 mb-4 block">
          Profile Photo (Recommended)
        </Label>
        <div className="flex flex-col items-center space-y-4">
          {photoPreview ? (
            <div className="relative">
              <img 
                src={photoPreview} 
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoPreview("");
                  setProfilePhoto(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            id="profilePhoto"
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={() => document.getElementById('profilePhoto')?.click()}
          >
            Choose Photo
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="flex items-center gap-2">
            Full Name *
            {renderValidationIcon('name')}
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
            className={`mt-1 ${validationErrors.name ? 'border-red-500' : fieldValidation.name ? 'border-green-500' : ''}`}
            placeholder="Enter your full name"
          />
          {validationErrors.name && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            Email Address *
            {renderValidationIcon('email')}
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
            className={`mt-1 ${validationErrors.email ? 'border-red-500' : fieldValidation.email ? 'border-green-500' : ''}`}
            placeholder="your.email@domain.com"
          />
          {validationErrors.email && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bio">Bio (Optional)</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
            placeholder="Brief description about yourself..."
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="agencyName" className="flex items-center gap-2">
          RERA Registered Agency Name *
          {renderValidationIcon('agencyName')}
        </Label>
        <Input
          id="agencyName"
          value={formData.agencyName}
          onChange={(e) => setFormData(prev => ({...prev, agencyName: e.target.value}))}
          className={`mt-1 ${validationErrors.agencyName ? 'border-red-500' : fieldValidation.agencyName ? 'border-green-500' : ''}`}
          placeholder="Your agency's registered name"
        />
        {validationErrors.agencyName && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.agencyName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="reraId" className="flex items-center gap-2">
          RERA ID *
          {renderValidationIcon('reraId')}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2">
                  <p className="font-semibold">Gujarat RERA ID Format:</p>
                  <p>AG/GJ/DISTRICT/CITY/AUTHORITY/AGENTID/VERSION</p>
                  <p className="text-sm">Examples:</p>
                  <p className="text-sm">• AG/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/AA01234/150123R1</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Input
          id="reraId"
          value={formData.reraId}
          onChange={(e) => setFormData(prev => ({...prev, reraId: e.target.value.toUpperCase()}))}
          className={`mt-1 ${validationErrors.reraId ? 'border-red-500' : fieldValidation.reraId ? 'border-green-500' : ''}`}
          placeholder="AG/GJ/AHMEDABAD/AHMEDABAD CITY/AUDA/AA01234/150123R1"
        />
        {validationErrors.reraId && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.reraId}</p>
        )}
        {!validationErrors.reraId && formData.reraId && !fieldValidation.reraId && (
          <p className="text-sm text-amber-600 mt-1">Please ensure this matches your official RERA registration</p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="experience">Experience (Optional)</Label>
          <Input
            id="experience"
            value={formData.experience}
            onChange={(e) => setFormData(prev => ({...prev, experience: e.target.value}))}
            placeholder="e.g., 5 years"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="website">Website (Optional)</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData(prev => ({...prev, website: e.target.value}))}
          placeholder="https://your-website.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label className="text-base font-medium flex items-center gap-2">
          Area of Expertise *
          {renderValidationIcon('areaOfExpertise')}
        </Label>
        <p className="text-sm text-gray-600 mb-3">Select your areas of expertise from the dropdown</p>
        
        {formData.areaOfExpertise.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.areaOfExpertise.map((expertise) => (
              <Badge key={expertise} variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                {expertise}
                <button
                  type="button"
                  onClick={() => removeExpertise(expertise)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={expertiseDropdownOpen} onOpenChange={setExpertiseDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={expertiseDropdownOpen}
              className="w-full justify-between text-left font-normal"
            >
              <span className="text-gray-500">
                {formData.areaOfExpertise.length === 0 
                  ? "Select areas of expertise..." 
                  : `${formData.areaOfExpertise.length} selected`
                }
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-white border-gray-200" align="start">
            <Command className="w-full bg-white">
              <CommandList className="max-h-64 overflow-y-auto bg-white">
                {Object.entries(getAvailableExpertiseOptions()).map(([category, options]) => (
                  <CommandGroup key={category} heading={category}>
                    {options.map((option) => (
                      <CommandItem
                        key={option}
                        value={option}
                        onSelect={() => {
                          addExpertise(option);
                        }}
                        className="cursor-pointer bg-white text-gray-900 hover:bg-green-100 hover:text-gray-900 data-[selected=true]:bg-green-100 data-[selected=true]:text-gray-900"
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            formData.areaOfExpertise.includes(option) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        {option}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
                
                <CommandGroup heading="Custom">
                  <div className="px-3 py-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom expertise..."
                        value={customExpertise}
                        onChange={(e) => setCustomExpertise(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomExpertise();
                            setExpertiseDropdownOpen(false);
                          }
                        }}
                        className="flex-1 h-8 text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={() => {
                          addCustomExpertise();
                          setExpertiseDropdownOpen(false);
                        }} 
                        size="sm"
                        className="h-8 px-2"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CommandGroup>
                
                {Object.keys(getAvailableExpertiseOptions()).length === 0 && !customExpertise && (
                  <CommandEmpty>All options selected. Add custom expertise above.</CommandEmpty>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {validationErrors.areaOfExpertise && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.areaOfExpertise}</p>
        )}
      </div>

      <div>
        <Label className="text-base font-medium flex items-center gap-2">
          Working Regions *
          {renderValidationIcon('workingRegions')}
        </Label>
        <p className="text-sm text-gray-600 mb-3">Add areas where you actively work</p>
        
        {formData.workingRegions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.workingRegions.map((region) => (
              <Badge key={region} variant="secondary" className="bg-green-100 text-green-800 px-3 py-1">
                {region}
                <button
                  type="button"
                  onClick={() => removeWorkingRegion(region)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="relative">
          <div className="flex gap-2">
            <Input
              placeholder="Type to search Ahmedabad areas..."
              value={customRegion}
              onChange={(e) => handleRegionInputChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomRegion())}
              className="flex-1"
            />
            <Button type="button" onClick={addCustomRegion} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {filteredRegions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredRegions.map((region) => (
                <button
                  key={region}
                  type="button"
                  onClick={() => {
                    addWorkingRegion(region);
                    setCustomRegion("");
                    setFilteredRegions([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>

        {validationErrors.workingRegions && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.workingRegions}</p>
        )}
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Review Your Information</h3>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Personal Information</h4>
          <p><strong>Name:</strong> {formData.name}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          {formData.bio && <p><strong>Bio:</strong> {formData.bio}</p>}
          {profilePhoto && <p><strong>Profile Photo:</strong> Uploaded</p>}
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Agency Information</h4>
          <p><strong>Agency:</strong> {formData.agencyName}</p>
          <p><strong>RERA ID:</strong> {formData.reraId}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Professional Details</h4>
          <p><strong>City:</strong> {formData.city}</p>
          {formData.experience && <p><strong>Experience:</strong> {formData.experience}</p>}
          {formData.website && <p><strong>Website:</strong> {formData.website}</p>}
          
          <div className="mt-2">
            <strong>Expertise:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.areaOfExpertise.map(expertise => (
                <Badge key={expertise} variant="secondary" className="text-xs">
                  {expertise}
                </Badge>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <strong>Working Regions:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.workingRegions.map(region => (
                <Badge key={region} variant="secondary" className="text-xs">
                  {region}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
              {!showSummary ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-blue-100 text-sm mb-2">
                    <span>Step {currentStep} of {totalSteps}</span>
                    <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                  </div>
                  <Progress value={(currentStep / totalSteps) * 100} className="bg-blue-500" />
                  <p className="text-blue-100 mt-2">
                    {STEPS[currentStep - 1]?.title}: {STEPS[currentStep - 1]?.description}
                  </p>
                </div>
              ) : (
                <p className="text-blue-100 mt-2">Review and confirm your profile information</p>
              )}
            </CardHeader>
            
            <CardContent className="p-8">
              {!showSummary && currentStep === 1 && renderStep1()}
              {!showSummary && currentStep === 2 && renderStep2()}
              {!showSummary && currentStep === 3 && renderStep3()}
              {showSummary && renderSummary()}

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1 && !showSummary}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {!showSummary ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedToNext()}
                    className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    {currentStep === totalSteps ? "Review" : "Next"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-8"
                  >
                    {isSubmitting ? "Completing..." : "Complete Profile"}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
