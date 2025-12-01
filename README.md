
# Virtual Try-On Glasses (Browser, 2D + 3D)

This is a **pure front-end** Virtual Try-On (VTO) project that runs in the **browser** using:

- **MediaPipe FaceMesh** for facial landmarks
- **2D PNG overlay** for simple glasses
- **Three.js** for a basic **3D glasses** mesh

No build step or backend required — just open `index.html` in a browser (or via a simple static server).

---

## Features

### 1. 2D PNG Overlay Mode
- Uses `assets/glasses.png`
- Tracks your eye landmarks (indices `33` and `263` from FaceMesh)
- Scales and rotates the glasses to match your head

### 2. 3D Glasses Mode
- Uses Three.js to build a simple glasses frame (two rectangular lenses + bridge)
- Positions and rotates the 3D mesh using the same facial landmarks
- You can later **replace this mesh with your own `.glb` model** if you want

---

## How to Run

1. Unzip the project.
2. Start a simple static HTTP server in the project folder (recommended):

   **Python 3**
   ```bash
   python -m http.server 8080
   ```

   Then open:
   ```
   http://localhost:8080/index.html
   ```

   > Opening `index.html` directly via `file://` may block camera access in some browsers.

3. Allow the page to use your **webcam** when prompted.
4. Use the buttons at the top to switch between **2D Overlay** and **3D Glasses** modes.

---

## Customize

### Change the glasses PNG

Replace the file:

- `assets/glasses.png`

with your own transparent PNG. Try to keep similar aspect ratio or adjust the scale multiplier in `js/app.js`:

```js
const glassesWidth = eyeDist * 2.4; // increase/decrease for size
```

### Use your own 3D GLB model

Right now the 3D glasses are created procedurally in `createGlassesMesh()`.

If you want to load your own `.glb` file instead:

1. Add your model to a folder like `models/my-glasses.glb`.
2. Include GLTFLoader from Three.js CDN in `index.html`:

   ```html
   <script src="https://cdn.jsdelivr.net/npm/three@0.164.1/examples/js/loaders/GLTFLoader.js"></script>
   ```

3. Replace `createGlassesMesh()` implementation in `js/app.js` with a loader call.

---

## Notes

- This was kept intentionally simple to make it easy to understand and extend.
- For production, you may want to:
  - Optimize the mesh
  - Add UI controls (size slider, color selector)
  - Support multiple glasses styles
  - Handle orientation / mobile layout more carefully
