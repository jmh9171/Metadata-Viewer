import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import MetadataViewer from "./components/MetadataViewer";

function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Enhanced background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(75%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent_70%)]" />
        <div className="absolute inset-0 [background:radial-gradient(1000px_400px_at_50%_0%,rgba(255,255,255,0.08),transparent)]" />
        <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay [mask-image:radial-gradient(ellipse_at_center,black,transparent)] bg-[url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'160\\' height=\\'160\\' viewBox=\\'0 0 40 40\\'><path fill=\\'none\\' stroke=\\'%23ffffff\\' stroke-opacity=\\'0.3\\' stroke-width=\\'0.5\\' d=\\'M0 20h40M20 0v40\\'/></svg>')]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-10 md:py-14">
        {/* Banner */}
        <div className="w-full mb-8">
          <Alert className="backdrop-blur-xl bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-indigo-500/20 ring-1 ring-white/20 shadow-[0_2px_0_0_rgba(255,255,255,0.1)_inset,0_10px_30px_-10px_rgba(0,0,0,0.6)] px-5 py-4 rounded-xl flex flex-col md:flex-row items-center justify-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 blur-md bg-blue-400/40 rounded-full" />
              <CheckCircle className="relative w-7 h-7 text-blue-200" />
            </div>
            <div className="text-center md:text-left">
              <AlertTitle className="font-semibold text-slate-100 text-base md:text-lg">
                100% Client-Side Metadata Viewer
              </AlertTitle>
              <AlertDescription className="text-slate-300/90 text-sm">
                Your files never leave your device. All metadata is processed
                securely in your browser.
              </AlertDescription>
            </div>
          </Alert>
        </div>

        {/* Heading */}
        <div className="mb-8 md:mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(255,255,255,0.7))]">
            Media Metadata Viewer
          </h1>
          <p className="text-base md:text-lg text-slate-200/95 max-w-2xl mx-auto leading-relaxed">
            Select an image or video file to view its metadata, export it as
            JSON, or download a clean version without metadata.
          </p>
        </div>

        {/* Main card */}
        <div className="w-full">
          <MetadataViewer />
        </div>
      </div>
    </div>
  );
}

export default App;
