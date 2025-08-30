/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { saveAs } from "file-saver";
import React, { useState } from "react";
import EXIFReader from "exifreader";
import InteractiveMap from "./InteractiveMap";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Metadata {
  [key: string]: any;
}

interface GPSData {
  latitude: number;
  longitude: number;
  altitude?: number;
}

interface FileMetadata {
  file: File;
  metadata: Metadata;
  gpsData?: GPSData;
  error?: string;
  previewUrl?: string;
}

interface Category {
  name: string;
  items: { [key: string]: any };
  count: number;
  preview: string;
}

const MetadataViewer: React.FC = () => {
  const [fileMetadataList, setFileMetadataList] = useState<FileMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
    null
  );
  const [showMapDialog, setShowMapDialog] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

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
    try {
      if (tags.GPSLatitude && tags.GPSLongitude) {
        let latitude = tags.GPSLatitude;
        let longitude = tags.GPSLongitude;

        if (typeof latitude === "object" && latitude.description) {
          latitude = parseFloat(latitude.description);
        }
        if (typeof longitude === "object" && longitude.description) {
          longitude = parseFloat(longitude.description) * -1;
        }

        latitude = parseFloat(latitude);
        longitude = parseFloat(longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
          return null;
        }

        if (tags.GPSLatitudeRef && tags.GPSLatitudeRef.description === "S") {
          latitude = -latitude;
        }
        if (tags.GPSLongitudeRef && tags.GPSLongitudeRef.description === "W") {
          longitude = -longitude;
        }

        const gpsData: GPSData = { latitude, longitude };

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

  const extractImageMetadata = (
    file: File
  ): Promise<{ metadata: Metadata; gpsData?: GPSData }> => {
    return new Promise<{ metadata: Metadata; gpsData?: GPSData }>(
      (resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = async () => {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const tags = EXIFReader.load(arrayBuffer);

            console.log("EXIF data extracted:", tags);

            const gps = extractGPSData(tags);

            const exifData: Metadata = {};
            Object.entries(tags).forEach(([key, value]) => {
              if (
                value &&
                typeof value === "object" &&
                "description" in value
              ) {
                exifData[key] = (value as any).description;
              } else if (
                value &&
                typeof value === "object" &&
                "value" in value
              ) {
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
            resolve({ metadata: meta, gpsData: gps || undefined });
          } catch (exifError) {
            console.warn("EXIF parsing failed:", exifError);
            resolve({
              metadata: {
                ...fileBaseInfo(file),
                width: img.naturalWidth,
                height: img.naturalHeight,
              },
              gpsData: undefined,
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
      }
    );
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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log(`${files.length} files selected`);
    setError(null);
    setFileMetadataList([]);
    setSelectedCategory(null);
    setSelectedFileIndex(null);
    setShowMapDialog(false);
    setIsLoading(true);

    const newFileMetadataList: FileMetadata[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `Processing file ${i + 1}/${files.length}:`,
        file.name,
        file.type,
        file.size
      );

      try {
        let metadata: Metadata;
        let gpsData: GPSData | undefined;

        if (file.type.startsWith("image/")) {
          console.log("Processing image file...");
          const result = await extractImageMetadata(file);
          metadata = result.metadata;
          gpsData = result.gpsData;
        } else if (file.type.startsWith("video/")) {
          console.log("Processing video file...");
          metadata = await extractVideoMetadata(file);
        } else {
          newFileMetadataList.push({
            file,
            metadata: {},
            error: "Unsupported file type",
            previewUrl: URL.createObjectURL(file),
          });
          continue;
        }

        newFileMetadataList.push({
          file,
          metadata,
          gpsData,
          previewUrl: URL.createObjectURL(file),
        });

        // Update the list as we process to show progress
        setFileMetadataList([...newFileMetadataList]);
      } catch (err) {
        console.error("Error processing file:", err);
        newFileMetadataList.push({
          file,
          metadata: {},
          error: err instanceof Error ? err.message : String(err),
          previewUrl: URL.createObjectURL(file),
        });
      }
    }

    setFileMetadataList(newFileMetadataList);
    setIsLoading(false);
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

  const exportAllMetadataAsJson = () => {
    if (fileMetadataList.length === 0) return;

    const allMetadata = fileMetadataList.map((fm) => ({
      fileName: fm.file.name,
      metadata: fm.metadata,
      gpsData: fm.gpsData,
      error: fm.error,
    }));

    const dataStr = JSON.stringify(allMetadata, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    saveAs(blob, `all-metadata-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const exportIndividualMetadataAsJson = (fileMetadata: FileMetadata) => {
    const dataStr = JSON.stringify(
      {
        fileName: fileMetadata.file.name,
        metadata: fileMetadata.metadata,
        gpsData: fileMetadata.gpsData,
        error: fileMetadata.error,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: "application/json" });
    saveAs(
      blob,
      `metadata-${fileMetadata.file.name}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`
    );
  };

  const removeMetadata = async (file: File): Promise<void> => {
    try {
      if (file.type.startsWith("image/")) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        const img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], `clean_${file.name}`, {
              type: file.type,
            });
            saveAs(newFile, `clean_${file.name}`);
          }
        }, file.type);
      } else if (file.type.startsWith("video/")) {
        saveAs(file, `clean_${file.name}`);
      }
    } catch (err) {
      console.error("Error removing metadata:", err);
      setError("Failed to remove metadata");
    }
  };

  const handleCategoryClick = (category: Category, fileIndex: number) => {
    setSelectedCategory(category);
    setSelectedFileIndex(fileIndex);
  };

  // Cleanup function to revoke object URLs
  const cleanupPreviewUrls = () => {
    fileMetadataList.forEach((fm) => {
      if (fm.previewUrl) {
        URL.revokeObjectURL(fm.previewUrl);
      }
    });
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupPreviewUrls();
    };
  }, []);

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Dropzone */}
        <Card className="mb-8 border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_30px_60px_-30px_rgba(0,0,0,0.6)] rounded-2xl">
          <CardContent className="p-8">
            <div className="flex justify-center">
              <div
                className={`relative inline-block cursor-pointer p-8 rounded-2xl w-full max-w-xl transition-all duration-300 text-center border-2 border-dashed
                ${
                  isDragOver
                    ? "border-emerald-400/70 bg-emerald-500/10"
                    : "border-blue-300/40 bg-blue-500/5"
                }
                hover:border-blue-300 hover:bg-blue-500/10 hover:-translate-y-0.5 hover:shadow-lg`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    handleFileChange({ target: { files } } as any);
                  }
                }}
              >
                <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                {isDragOver && (
                  <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/10 via-cyan-400/10 to-blue-400/10 blur" />
                )}
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Select image or video files to view metadata"
                />
                <div className="text-lg md:text-xl font-medium mb-2 text-slate-100">
                  📁 Choose files or drag them here
                </div>
                <div className="text-sm text-slate-300/80">
                  Supports: JPG, PNG, GIF, MP4, MOV, AVI (Multiple files)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <Card className="mb-8 border border-white/10 bg-slate-900/40 backdrop-blur-md rounded-2xl">
            <CardContent className="p-8 flex justify-center items-center">
              <div className="flex items-center text-slate-300">
                Processing files...
                <div className="ml-3 w-5 h-5 border-2 border-slate-400/50 border-t-transparent rounded-full animate-spin" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-8 border border-red-500/20 bg-red-500/10 backdrop-blur-md rounded-2xl">
            <CardContent className="p-4">
              <div className="text-red-300 font-medium flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toolbar */}
        {fileMetadataList.length > 0 && (
          <Card className="mb-8 border border-white/10 bg-slate-900/40 backdrop-blur-md rounded-2xl">
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={exportAllMetadataAsJson}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <span className="mr-2">💾</span>
                  Export All Metadata (JSON)
                </Button>

                <Button
                  onClick={() =>
                    setViewMode(viewMode === "list" ? "grid" : "list")
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span className="mr-2">
                    {viewMode === "list" ? "📱" : "📋"}
                  </span>
                  {viewMode === "list" ? "Grid View" : "List View"}
                </Button>

                <Button
                  onClick={() => {
                    // Clear all files
                    cleanupPreviewUrls();
                    setFileMetadataList([]);
                    setSelectedCategory(null);
                    setSelectedFileIndex(null);
                    setShowMapDialog(false);
                  }}
                  className="bg-slate-600 hover:bg-slate-700 text-white"
                >
                  <span className="mr-2">🗑️</span>
                  Clear All Files
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files */}
        {fileMetadataList.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-center text-slate-100">
              Processed Files ({fileMetadataList.length})
            </h2>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-6"
              }
            >
              {fileMetadataList.map((fileMetadata, index) => {
                const categories = fileMetadata.error
                  ? []
                  : categorizeMetadata(fileMetadata.metadata);

                return (
                  <Card
                    key={index}
                    className={`border border-white/10 bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_30px_60px_-30px_rgba(0,0,0,0.6)] transition-transform duration-200 hover:-translate-y-0.5 ${
                      viewMode === "grid" ? "h-full" : ""
                    }`}
                  >
                    <CardHeader className={viewMode === "grid" ? "pb-2" : ""}>
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle
                          className={`font-semibold text-slate-100 truncate ${
                            viewMode === "grid" ? "text-sm" : "text-lg"
                          }`}
                          title={fileMetadata.file.name}
                        >
                          {fileMetadata.file.name}
                        </CardTitle>
                        <div className="flex gap-2 shrink-0">
                          {fileMetadata.error ? (
                            <Badge
                              variant="destructive"
                              className={viewMode === "grid" ? "text-xs" : ""}
                            >
                              Error
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={`bg-white/10 text-slate-200 border-white/10 ${
                                viewMode === "grid" ? "text-xs" : ""
                              }`}
                            >
                              {formatFileSize(fileMetadata.file.size)}
                            </Badge>
                          )}
                          {fileMetadata.gpsData && (
                            <Badge
                              variant="outline"
                              className={`border-emerald-400/40 text-emerald-300 ${
                                viewMode === "grid" ? "text-xs" : ""
                              }`}
                            >
                              📍 GPS
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className={viewMode === "grid" ? "p-4" : ""}>
                      {/* Preview */}
                      {fileMetadata.previewUrl && (
                        <div
                          className={`${viewMode === "grid" ? "mb-4" : "mb-6"}`}
                        >
                          <div
                            className={`relative w-full rounded-xl overflow-hidden ring-1 ring-white/10 bg-slate-800/60 ${
                              viewMode === "grid" ? "h-32" : "h-48"
                            }`}
                          >
                            {fileMetadata.file.type.startsWith("image/") ? (
                              <img
                                src={fileMetadata.previewUrl}
                                alt={`Preview of ${fileMetadata.file.name}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : fileMetadata.file.type.startsWith("video/") ? (
                              <video
                                src={fileMetadata.previewUrl}
                                className="w-full h-full object-cover"
                                muted
                                onLoadedData={(e) => {
                                  const video = e.target as HTMLVideoElement;
                                  video.currentTime = 1;
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLVideoElement;
                                  target.style.display = "none";
                                }}
                              >
                                <source
                                  src={fileMetadata.previewUrl}
                                  type={fileMetadata.file.type}
                                />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                  <div className="text-4xl mb-2">📄</div>
                                  <div className="text-sm">
                                    No Preview Available
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                        </div>
                      )}

                      {/* Error or Content */}
                      {fileMetadata.error ? (
                        <div className="text-red-300 font-medium flex items-center gap-2">
                          <span>⚠️</span>
                          {fileMetadata.error}
                        </div>
                      ) : (
                        <div>
                          {/* GPS */}
                          {fileMetadata.gpsData && (
                            <div
                              className={`p-4 rounded-xl ring-1 ring-emerald-400/20 bg-emerald-500/10 ${
                                viewMode === "grid" ? "mb-3" : "mb-4"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-emerald-200">
                                  <p
                                    className={`font-medium ${
                                      viewMode === "grid" ? "text-sm" : ""
                                    }`}
                                  >
                                    📍 Location Data Found
                                  </p>
                                  <p
                                    className={`${
                                      viewMode === "grid"
                                        ? "text-xs"
                                        : "text-sm"
                                    }`}
                                  >
                                    Lat:{" "}
                                    {fileMetadata.gpsData.latitude.toFixed(6)}°,
                                    Long:{" "}
                                    {fileMetadata.gpsData.longitude.toFixed(6)}°
                                    {fileMetadata.gpsData.altitude &&
                                      `, Alt: ${fileMetadata.gpsData.altitude.toFixed(
                                        1
                                      )}m`}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => {
                                    setShowMapDialog(true);
                                    setSelectedFileIndex(index);
                                  }}
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                  <span className="mr-1">🗺️</span>
                                  {viewMode === "grid" ? "" : "View Map"}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Categories */}
                          {categories.length > 0 && (
                            <div>
                              <h3
                                className={`font-semibold text-slate-100 mb-4 ${
                                  viewMode === "grid" ? "text-sm" : "text-lg"
                                }`}
                              >
                                {viewMode === "grid"
                                  ? "Categories"
                                  : "Metadata Categories"}
                              </h3>
                              <div
                                className={`grid gap-3 ${
                                  viewMode === "grid"
                                    ? "grid-cols-1"
                                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                }`}
                              >
                                {categories.map((category) => (
                                  <Card
                                    key={category.name}
                                    className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg border border-white/10 bg-slate-800/40 backdrop-blur rounded-xl"
                                    onClick={() =>
                                      handleCategoryClick(category, index)
                                    }
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleCategoryClick(category, index);
                                      }
                                    }}
                                    aria-label={`View ${category.name} metadata for ${fileMetadata.file.name} (${category.count} items)`}
                                  >
                                    <CardHeader className="pb-2">
                                      <CardTitle
                                        className={`text-center text-slate-100 ${
                                          viewMode === "grid"
                                            ? "text-xs"
                                            : "text-base"
                                        }`}
                                      >
                                        {category.name}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-center">
                                      <Badge
                                        variant="secondary"
                                        className={`mb-2 bg-white/10 text-slate-200 border-white/10 ${
                                          viewMode === "grid" ? "text-xs" : ""
                                        }`}
                                      >
                                        {category.count} items
                                      </Badge>
                                      <div
                                        className={`text-slate-300/90 line-clamp-2 ${
                                          viewMode === "grid"
                                            ? "text-xs"
                                            : "text-sm"
                                        }`}
                                      >
                                        {category.preview}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          {!fileMetadata.error && (
                            <div
                              className={`mt-4 pt-4 border-t border-white/10 ${
                                viewMode === "grid" ? "space-y-2" : "space-y-3"
                              }`}
                            >
                              <h4
                                className={`font-medium text-slate-100 ${
                                  viewMode === "grid" ? "text-sm" : "text-base"
                                }`}
                              >
                                File Actions
                              </h4>
                              <div
                                className={`flex gap-2 ${
                                  viewMode === "grid" ? "flex-col" : "flex-wrap"
                                }`}
                              >
                                <Button
                                  onClick={() =>
                                    exportIndividualMetadataAsJson(fileMetadata)
                                  }
                                  size={viewMode === "grid" ? "sm" : "default"}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <span className="mr-1">💾</span>
                                  {viewMode === "grid" ? "JSON" : "Export JSON"}
                                </Button>
                                <Button
                                  onClick={() =>
                                    removeMetadata(fileMetadata.file)
                                  }
                                  size={viewMode === "grid" ? "sm" : "default"}
                                  className="bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                  <span className="mr-1">🧹</span>
                                  {viewMode === "grid"
                                    ? "Clean"
                                    : "Remove Metadata"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Dialog */}
        <Dialog
          open={!!selectedCategory && selectedFileIndex !== null}
          onOpenChange={() => {
            setSelectedCategory(null);
            setSelectedFileIndex(null);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border border-white/10 bg-slate-900/80 backdrop-blur-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                {selectedCategory?.name} —{" "}
                {fileMetadataList[selectedFileIndex!]?.file.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedCategory?.items &&
                Object.entries(selectedCategory.items).map(([key, value]) => {
                  const displayValue = formatMetadataValue(key, value);
                  const displayKey = formatMetadataKey(key);

                  return (
                    <Card
                      key={key}
                      className="border border-white/10 bg-slate-800/40 backdrop-blur rounded-xl"
                    >
                      <CardContent className="p-4">
                        <div className="text-[10px] font-semibold text-slate-300/70 uppercase tracking-wide mb-1">
                          {displayKey}
                        </div>
                        <div className="text-slate-100 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {displayValue}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Map Dialog */}
        <Dialog
          open={showMapDialog && selectedFileIndex !== null}
          onOpenChange={(open) => {
            if (!open) {
              setShowMapDialog(false);
              setSelectedFileIndex(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden border border-white/10 bg-slate-900/80 backdrop-blur-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                📍 Photo Location —{" "}
                {fileMetadataList[selectedFileIndex!]?.file.name}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 rounded-xl overflow-hidden ring-1 ring-white/10">
              {fileMetadataList[selectedFileIndex!]?.gpsData && (
                <InteractiveMap
                  latitude={
                    fileMetadataList[selectedFileIndex!].gpsData!.latitude
                  }
                  longitude={
                    fileMetadataList[selectedFileIndex!].gpsData!.longitude
                  }
                  title={`Photo Location (${fileMetadataList[
                    selectedFileIndex!
                  ].gpsData!.latitude.toFixed(6)}, ${fileMetadataList[
                    selectedFileIndex!
                  ].gpsData!.longitude.toFixed(6)})`}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MetadataViewer;
