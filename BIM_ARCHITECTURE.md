# BIM Architecture & 3D Viewer Specification

## Overview
The CortexBuild BIM Viewer provides native visualization of Building Information Modeling (BIM) files, specifically targeting the IFC (Industry Foundation Classes) standard.

## Rendering Pipeline
### Native IFC Support
The viewer utilizes `web-ifc-three`, a wrapper around `web-ifc`, to parse and render IFC data directly in the browser using Three.js.

**Key Configuration:**
- **WASM Path**: The IFC engine relies on WebAssembly. The binaries are hosted at `/wasm/` and configured via `ifcLoader.ifcManager.setWasmPath('/wasm/')`.
- **Bundle Optimization**: To prevent initial load degradation, all 3D libraries (`three`, `web-ifc-three`, `OrbitControls`) are loaded via dynamic `import()` calls only when the BIMViewer module is mounted.

## Coordinate System & Navigation
### 3D Space
The viewer uses a standard Three.js coordinate system (Y-up).

### Jump-to-Clash Logic
Clash detections are stored as absolute 3D coordinates `[x, y, z]`. The "Jump-to-Clash" feature implements the following:

1. **Targeting**: The camera target is set exactly to the clash location.
2. **Offset**: The camera is positioned at `target + [5, 5, 5]` to provide a clear isometric perspective of the intersection.
3. **Interpolation**: A cubic-out easing function is used to interpolate the camera position and controls target over 1000ms, preventing sudden visual snaps and maintaining spatial context.

## Backend Processing
### Metadata Extraction
BIM files are processed asynchronously upon upload:
- **Element Count**: Extracted via `ifcApi.GetCountAll()`.
- **Floor Count**: Derived by counting unique `IFCBUILDINGSTOREY` entities.
- **Version Detection**: The IFC schema (e.g., IFC2X3, IFC4) is extracted by parsing the `FILE_SCHEMA` entry in the file header.

## Maintenance
When updating the 3D engine:
1. Ensure WASM binaries are updated in the `/public/wasm` directory.
2. Verify that the `IFCLoader` version is compatible with the current `three.js` version.
