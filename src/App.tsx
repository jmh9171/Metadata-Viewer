import "./App.css";
import MetadataViewer from "./components/MetadataViewer";

function App() {
  return (
    <div className="app">
      <h1>Media Metadata Viewer</h1>
      <p>Select an image or video file to view its metadata</p>
      <MetadataViewer />
    </div>
  );
}

export default App;
