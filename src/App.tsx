import MetadataViewer from "./components/MetadataViewer";

function App() {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-center items-center p-8 text-center">
      {/* Banner */}
      <div className="w-full mb-6">
        <div className="rounded-lg bg-gradient-to-r from-green-400/80 to-blue-500/80 shadow-lg px-6 py-4 flex flex-col md:flex-row items-center justify-center gap-3 border border-blue-300 dark:border-blue-700">
          <svg
            className="w-8 h-8 text-blue-700 dark:text-blue-200 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <div className="text-left">
            <span className="block font-semibold text-blue-900 dark:text-blue-100 text-lg">
              100% Client-Side Metadata Viewer
            </span>
            <span className="block text-blue-900/80 dark:text-blue-200/80 text-sm">
              Your files never leave your device. All metadata is processed
              securely in your browser.
            </span>
          </div>
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
        Media Metadata Viewer
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        Select an image or video file to view its metadata
      </p>
      <MetadataViewer />
    </div>
  );
}

export default App;
