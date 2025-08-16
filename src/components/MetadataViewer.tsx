/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import EXIFReader from "exifreader";
import InteractiveMap from "./InteractiveMap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Metadata {
  [key: string]: any;
}

interface GPSData {
  latitude: number;
  longitude: number;
  altitude?: number;
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
  const [gpsData, setGpsData] = useState<GPSData | null>(null);
  const [showMapDialog, setShowMapDialog] = useState<boolean>(false);

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

  const extractGPSData = (tags: any): GPSData | null => {
    // console.log(tags);
    try {
      // Check for GPS coordinates in EXIF data
      if (tags.GPSLatitude && tags.GPSLongitude) {
        let latitude = tags.GPSLatitude;
        let longitude = tags.GPSLongitude;

        // Handle different formats of GPS data
        if (typeof latitude === "object" && latitude.description) {
          latitude = parseFloat(latitude.description);
        }
        if (typeof longitude === "object" && longitude.description) {
          longitude = parseFloat(longitude.description) * -1;
        }

        // Convert to numbers if they're strings
        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        // Validate coordinates
        if (isNaN(latitude) || isNaN(longitude)) {
          return null;
        }

        // Check for GPS reference (North/South, East/West)
        if (tags.GPSLatitudeRef && tags.GPSLatitudeRef.description === "S") {
          latitude = -latitude;
        }
        if (tags.GPSLongitudeRef && tags.GPSLongitudeRef.description === "W") {
          longitude = -longitude;
        }

        const gpsData: GPSData = { latitude, longitude };

        // Add altitude if available
        if (tags.GPSAltitude) {
          let altitude = tags.GPSAltitude;
          if (typeof altitude === "object" && altitude.description) {
            altitude = parseFloat(altitude.description);
          }
          if (!isNaN(altitude)) {
            gpsData.altitude = altitude;
          }
        }

        return gpsData;
      }
      return null;
    } catch (error) {
      console.warn("Error extracting GPS data:", error);
      return null;
    }
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

          // Extract GPS data
          const gps = extractGPSData(tags);
          if (gps) {
            setGpsData(gps);
          }

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
    setGpsData(null);
    setShowMapDialog(false);
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

      {gpsData && (
        <div className="text-left bg-white dark:bg-gray-800 p-8 rounded-2xl mt-8 border border-gray-200 dark:border-gray-700 shadow-sm animate-slide-in">
          <h2 className="text-center mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            📍 Location Data
          </h2>
          <div className="mb-6 text-center text-gray-600 dark:text-gray-300">
            <p className="text-lg">
              Latitude: {gpsData.latitude.toFixed(6)}°
              {gpsData.latitude >= 0 ? "N" : "S"}
            </p>
            <p className="text-lg">
              Longitude: {gpsData.longitude.toFixed(6)}°
              {gpsData.longitude >= 0 ? "E" : "W"}
            </p>
            {gpsData.altitude && (
              <p className="text-lg">
                Altitude: {gpsData.altitude.toFixed(1)}m
              </p>
            )}
          </div>
          <div className="text-center">
            <button
              onClick={() => setShowMapDialog(true)}
              className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="mr-2">🗺️</span>
              View on Map
            </button>
          </div>
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

      <Dialog
        open={!!selectedCategory}
        onOpenChange={() => setSelectedCategory(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCategory?.items &&
              Object.entries(selectedCategory.items).map(([key, value]) => {
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
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>📍 Photo Location</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {gpsData && (
              <InteractiveMap
                latitude={gpsData.latitude}
                longitude={gpsData.longitude}
                title={`Photo Location (${gpsData.latitude.toFixed(
                  6
                )}, ${gpsData.longitude.toFixed(6)})`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MetadataViewer;
