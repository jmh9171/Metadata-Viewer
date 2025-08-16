/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import EXIFReader from "exifreader";

interface Metadata {
  [key: string]: any;
}

interface Category {
  name: string;
  items: { [key: string]: any };
  count: number;
  preview: string;
}

const MetadataViewer: React.FC = () => {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const fileBaseInfo = (file: File) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const categorizeMetadata = (data: Metadata): Category[] => {
    const categories: { [key: string]: { [key: string]: any } } = {
      "File Information": {},
      "Image/Video Properties": {},
      "EXIF Data": {},
      "Technical Details": {},
      Other: {},
    };

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (["name", "size", "type", "lastModified"].includes(key)) {
        categories["File Information"][key] = value;
      } else if (["width", "height", "duration"].includes(key)) {
        categories["Image/Video Properties"][key] = value;
      } else if (
        key.toLowerCase().includes("exif") ||
        key.toLowerCase().includes("gps") ||
        key.toLowerCase().includes("camera") ||
        key.toLowerCase().includes("make") ||
        key.toLowerCase().includes("model") ||
        key.toLowerCase().includes("iso") ||
        key.toLowerCase().includes("aperture") ||
        key.toLowerCase().includes("shutter") ||
        key.toLowerCase().includes("focal")
      ) {
        categories["EXIF Data"][key] = value;
      } else if (
        key.toLowerCase().includes("format") ||
        key.toLowerCase().includes("codec") ||
        key.toLowerCase().includes("bitrate") ||
        key.toLowerCase().includes("fps") ||
        key.toLowerCase().includes("compression")
      ) {
        categories["Technical Details"][key] = value;
      } else {
        categories["Other"][key] = value;
      }
    });

    return Object.entries(categories)
      .filter(([, items]) => Object.keys(items).length > 0)
      .map(([name, items]) => {
        const firstItem = Object.entries(items)[0];
        const preview = firstItem
          ? formatMetadataValue(firstItem[0], firstItem[1])
          : "No data";

        return {
          name,
          items,
          count: Object.keys(items).length,
          preview:
            preview.length > 50 ? preview.substring(0, 50) + "..." : preview,
        };
      });
  };

  const extractImageMetadata = (file: File): Promise<Metadata> => {
    return new Promise<Metadata>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          // Extract EXIF data using EXIFReader
          const arrayBuffer = await file.arrayBuffer();
          const tags = EXIFReader.load(arrayBuffer);

          console.log("EXIF data extracted:", tags);

          // Convert EXIFReader tags to a more readable format
          const exifData: Metadata = {};
          Object.entries(tags).forEach(([key, value]) => {
            if (value && typeof value === "object" && "description" in value) {
              exifData[key] = (value as any).description;
            } else if (value && typeof value === "object" && "value" in value) {
              exifData[key] = (value as any).value;
            } else {
              exifData[key] = value;
            }
          });

          const meta = {
            ...fileBaseInfo(file),
            width: img.naturalWidth,
            height: img.naturalHeight,
            ...exifData,
          };
          resolve(meta);
        } catch (exifError) {
          // If EXIF parsing fails, still return basic info + dimensions
          console.warn("EXIF parsing failed:", exifError);
          resolve({
            ...fileBaseInfo(file),
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for EXIF extraction"));
      };

      img.src = url;
    });
  };

  const extractVideoMetadata = async (file: File): Promise<Metadata> => {
    return new Promise<Metadata>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      const url = URL.createObjectURL(file);

      const cleanup = () => {
        if (video.src) {
          URL.revokeObjectURL(video.src);
        } else {
          URL.revokeObjectURL(url);
        }
      };

      video.onloadedmetadata = () => {
        const metadata = {
          ...fileBaseInfo(file),
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        };
        cleanup();
        resolve(metadata);
      };

      video.onerror = () => {
        cleanup();
        reject(new Error("Failed to load video metadata"));
      };

      video.src = url;
    });
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.type, file.size);
    setError(null);
    setMetadata(null);
    setSelectedCategory(null);
    setIsLoading(true);

    try {
      if (file.type.startsWith("image/")) {
        console.log("Processing image file...");
        const data = await extractImageMetadata(file);
        console.log("Image metadata extracted:", data);
        setMetadata(data);
      } else if (file.type.startsWith("video/")) {
        console.log("Processing video file...");
        const data = await extractVideoMetadata(file);
        console.log("Video metadata extracted:", data);
        setMetadata(data);
      } else {
        setError(
          "Unsupported file type. Please select an image or video file."
        );
      }
    } catch (err) {
      console.error("Error processing file:", err);
      setError(
        "Error reading metadata: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatMetadataValue = (key: string, value: any): string => {
    if (key === "size") {
      return formatFileSize(value);
    }
    if (key === "lastModified") {
      return formatDate(value);
    }
    if (key === "duration" && typeof value === "number") {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    if (key === "width" || key === "height") {
      return `${value}px`;
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const formatMetadataKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const closeDialog = () => {
    setSelectedCategory(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDialog();
    }
  };

  const categories = metadata ? categorizeMetadata(metadata) : [];

  return (
    <div className="w-full max-w-4xl">
      <div className="my-8 flex justify-center">
        <div className="relative inline-block cursor-pointer p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl w-full max-w-lg bg-gray-50 dark:bg-gray-800 transition-all duration-300 hover:border-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:-translate-y-1 hover:shadow-lg text-center">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Select an image or video file to view metadata"
          />
          <div className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
            📁 Choose a file or drag it here
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Supports: JPG, PNG, GIF, MP4, MOV, AVI
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8 text-gray-600 dark:text-gray-300">
          Processing file...
          <div className="ml-2 w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg my-4 p-4 font-medium flex items-center gap-2">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {metadata && categories.length > 0 && (
        <div className="text-left bg-white dark:bg-gray-800 p-8 rounded-2xl mt-8 border border-gray-200 dark:border-gray-700 shadow-sm animate-slide-in">
          <h2 className="text-center mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            File Metadata
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.name}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary-500 text-center"
                onClick={() => handleCategoryClick(category)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCategoryClick(category);
                  }
                }}
                aria-label={`View ${category.name} metadata (${category.count} items)`}
              >
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {category.name}
                </h3>
                <div className="text-primary-500 font-semibold text-xl mb-2">
                  {category.count} items
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 opacity-80">
                  {category.preview}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCategory && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-dialog-slide-in">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedCategory.name}
              </h3>
              <button
                className="text-2xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 w-10 h-10 flex items-center justify-center"
                onClick={closeDialog}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(selectedCategory.items).map(([key, value]) => {
                const displayValue = formatMetadataValue(key, value);
                const displayKey = formatMetadataKey(key);

                return (
                  <div
                    key={key}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 opacity-80">
                      {displayKey}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 text-base leading-relaxed break-words">
                      {displayValue}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataViewer;
