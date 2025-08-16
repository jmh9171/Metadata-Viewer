import MetadataViewer from "./components/MetadataViewer";

function App() {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col justify-center items-center p-8 text-center">
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
