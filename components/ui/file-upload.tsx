import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export default function FileUpload({ onFilesChange, maxFiles = 10 }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
    
    setFiles(newFiles);
    onFilesChange(newFiles);

    // Generate previews
    const newPreviews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === newFiles.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    onFilesChange(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {files.length === 0 ? (
        <div 
          onClick={openFileDialog}
          className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-600 transition-colors"
        >
          <Camera className="mx-auto text-3xl text-neutral-400 mb-2" size={48} />
          <p className="text-neutral-500 mb-2">Tap to add photos</p>
          <p className="text-xs text-neutral-400">Upload up to {maxFiles} images</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          
          {files.length < maxFiles && (
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              className="w-full"
            >
              <Camera className="mr-2" size={16} />
              Add More Photos ({files.length}/{maxFiles})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
