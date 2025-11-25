import {
  useState,
  useEffect,
  useRef,
  type KeyboardEventHandler,
  type FocusEventHandler,
} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Building2 } from "lucide-react";

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, details?: any) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  types?: string[];
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

export default function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Enter building or society name...",
  label,
  className = "",
  types = ["establishment", "geocode"],
  onKeyDown,
  onFocus,
  onBlur,
}: GooglePlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}&types=${types.join(',')}`);
      const data = await response.json();
      // Accept both Google API (status === 'OK') and custom (success === true)
      if ((data.status === "OK" || data.success) && Array.isArray(data.predictions)) {
        const normalized: PlaceSuggestion[] = data.predictions.map((prediction: any) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: {
            main_text:
              prediction.structured_formatting?.main_text ||
              prediction.description?.split(",")[0]?.trim() ||
              prediction.description ||
              "",
            secondary_text:
              prediction.structured_formatting?.secondary_text ||
              prediction.description
                ?.split(",")
                .slice(1)
                .join(",")
                .trim() ||
              "",
          },
        }));
        setSuggestions(normalized);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce API calls
    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);

    setShowSuggestions(true);
  };

  const handleSuggestionClick = async (suggestion: PlaceSuggestion) => {
    onChange(suggestion.structured_formatting.main_text, suggestion);
    setSuggestions([]);
    setShowSuggestions(false);

    // Fetch detailed place information
    try {
      const response = await fetch(`/api/places/details?place_id=${suggestion.place_id}`);
      const data = await response.json();
      
      if (data.success && data.result) {
        // You can use detailed place information here if needed
        console.log('Place details:', data.result);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleInputFocus: FocusEventHandler<HTMLInputElement> = (event) => {
    if (value.length >= 2) {
      setShowSuggestions(true);
    }
    onFocus?.(event);
  };

  const handleInputBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
    onBlur?.(event);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor="google-places-input" className="text-sm font-medium text-neutral-700 mb-2 block">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
        <Input
          ref={inputRef}
          id="google-places-input"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="pl-10"
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-3 hover:bg-neutral-50 cursor-pointer border-b border-neutral-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <Building2 size={16} className="text-neutral-400 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {suggestion.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-neutral-600 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && value.length >= 2 && !loading && (
  <div className="absolute z-50 w-full mt-1 border border-amber-200 rounded-lg shadow-lg p-4 bg-amber-50">
          <div className="text-center text-amber-700">
            <Building2 size={24} className="mx-auto mb-2" />
            <p className="text-sm font-medium">Google Places API Setup Required</p>
            <p className="text-xs mt-1">
              Enable Places API service in Google Cloud Console
            </p>
            <p className="text-xs text-amber-600 mt-1">
              You can type building names manually for now
            </p>
          </div>
        </div>
      )}
    </div>
  );
}