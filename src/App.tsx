import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import MetadataViewer from "./components/MetadataViewer";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 w-full p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col justify-center items-center text-center">
        {/* Banner */}
        <div className="w-full mb-8">
          <Alert className=" bg-gradient-to-r from-green-400/80 to-blue-500/80 shadow-lg px-6 py-4 flex flex-col md:flex-row items-center justify-center gap-3 border border-blue-300 dark:border-blue-700">
            <CheckCircle className="w-8 h-8 text-blue-700 dark:text-blue-200" />
            <div className="text-left">
              <AlertTitle className="font-semibold text-blue-900 dark:text-blue-100 text-lg">
                100% Client-Side Metadata Viewer
              </AlertTitle>
              <AlertDescription className="text-blue-900/80 dark:text-blue-200/80 text-sm">
                Your files never leave your device. All metadata is processed
                securely in your browser.
              </AlertDescription>
            </div>
          </Alert>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
            Media Metadata Viewer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Select an image or video file to view its metadata, export it as
            JSON, or download a clean version without metadata
          </p>
        </div>

        <div className="w-full">
          <MetadataViewer />
        </div>
      </div>
    </div>
  );
}

export default App;
