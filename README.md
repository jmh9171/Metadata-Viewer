# 🎨 Metadata Viewer with Three.js 3D Effects

A stunning, interactive metadata viewer for images and videos with beautiful 3D animations powered by Three.js!

## ✨ Features

### 🎯 Core Functionality

- **File Upload**: Drag & drop or click to upload images and videos
- **Metadata Extraction**: Extract EXIF data, GPS coordinates, and technical details
- **Interactive Map**: View photo locations on an interactive map
- **Export Options**: Export metadata as JSON files
- **Multiple Views**: Switch between list and grid layouts

### 🌟 3D Visual Effects

- **Floating Particle Background**: Animated particles that respond to mouse movement
- **3D Upload Area**: Interactive 3D file icons and floating arrows
- **3D Data Visualization**: Immersive 3D space showing metadata as floating cards
- **Geometric Shapes**: Rotating wireframe shapes (octahedrons, tetrahedrons, icosahedrons)
- **Floating Orbs**: Animated spherical objects with wireframe effects
- **Mouse Interaction**: Camera movement follows mouse cursor
- **Dynamic Lighting**: Ambient and directional lighting for depth

### 🎨 Visual Enhancements

- **Smooth Animations**: CSS animations for cards, buttons, and UI elements
- **Glow Effects**: Pulsing glow animations on interactive elements
- **3D Card Effects**: Hover effects with perspective transforms
- **Particle Systems**: Multiple particle effects with different behaviors
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Metadata-Viewer
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🎮 How to Use

### Basic Usage

1. **Upload Files**: Drag and drop image or video files onto the upload area, or click to browse
2. **View Metadata**: The app will automatically extract and display metadata in organized categories
3. **Explore 3D**: Click the "3D Visualization" button to see your metadata in an immersive 3D space
4. **View Location**: If GPS data is found, click the map button to see photo locations
5. **Export Data**: Export individual files or all metadata as JSON

### 3D Features

- **Background Particles**: Move your mouse to see the particle system respond
- **3D Upload Area**: Watch floating file icons and arrows animate
- **3D Data Visualization**:
  - Hover over cards to see them scale up
  - Watch cards rotate and float in 3D space
  - See connections between related metadata items
  - Camera automatically rotates around the scene

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **3D Graphics**: Three.js for WebGL rendering
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives
- **Maps**: Leaflet with React-Leaflet
- **File Processing**: EXIFReader for metadata extraction
- **Build Tool**: Vite for fast development

## 🎨 Customization

### Adjusting 3D Effects

You can customize the 3D effects by modifying the component props:

```tsx
// Background intensity (0.1 to 1.0)
<ThreeJSBackground intensity={0.3} particleCount={300} />

// Upload area effects
<ThreeJSUploadArea isDragOver={isDragOver} />

// 3D visualization
<ThreeJSDataVisualizer
  metadata={metadata}
  isVisible={show3DVisualizer}
  onClose={() => setShow3DVisualizer(false)}
/>
```

### CSS Animations

The app includes custom CSS animations that you can apply to any element:

```css
.animate-float          /* Floating animation */
/* Floating animation */
/* Floating animation */
/* Floating animation */
.animate-pulse-glow     /* Pulsing glow effect */
.animate-rotate-3d      /* 3D rotation */
.animate-particle-float /* Particle floating */
.animate-glow-pulse     /* Glow pulsing */
.three-d-card; /* 3D card hover effects */
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note**: 3D effects require WebGL support. The app will gracefully degrade on older browsers.

## 🎯 Performance

- **Optimized Rendering**: Uses efficient Three.js techniques for smooth 60fps animations
- **Responsive Design**: Automatically adjusts particle count and effects based on device performance
- **Memory Management**: Proper cleanup of WebGL contexts and event listeners
- **Lazy Loading**: 3D components only initialize when needed

## 🔧 Development

### Project Structure

```
src/
├── components/
│   ├── MetadataViewer.tsx          # Main component
│   ├── ThreeJSBackground.tsx       # 3D background effects
│   ├── ThreeJSDataVisualizer.tsx   # 3D data visualization
│   ├── ThreeJSUploadArea.tsx       # 3D upload area
│   └── InteractiveMap.tsx          # Map component
├── lib/
│   └── utils.ts                    # Utility functions
└── index.css                       # Styles and animations
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎉 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Three.js community for the amazing 3D library
- Radix UI for accessible component primitives
- Tailwind CSS for the utility-first styling approach
- The open-source community for inspiration and tools

---

**Enjoy exploring your metadata in 3D! 🚀✨**
