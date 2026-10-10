FIBERCUT 3D WEB PACKAGE

Upload these files and folders to the same GitHub Pages folder:
  index.html
  assets/scene.js
  assets/customer-scene.js
  assets/environment.js
  assets/environment/
  assets/environment/tree-natural.glb
  fibercut-scene.glb
  models/web/customer-gate.glb
  models/web/4_nadstresek.optimized.glb
  models/web/3_stopnice.optimized.glb
  models/web/2_ograja.optimized.glb
  models/web/coffee-table.glb
  models/web/dining-table.glb

All PBR textures are embedded inside fibercut-scene.glb.
No MP4/video background is used. The camera moves through the actual 3D scene.
Customer CAD models replace the old gate, carport and stairs. The gate opens
before the camera crosses it. The journey ends at the entrance with contacts.
Meshopt decoding is configured in assets/scene.js. All models load before the
initial loading screen releases scrolling.

Optional: README.txt does not need to be uploaded.

Local development: .tools/ contains scripts, dependencies, model reports and
the optional preview. It is excluded from Git by .gitignore and is not part
of the GitHub Pages site. AGENTS.md and PROJECT_CONTEXT.md are local only.
Uncompressed IGES, BREP and intermediate GLB exports have been removed.
Run the camera and gate check from the repository root:
  node .tools/cad-runtime/check-journey.mjs

Environment assets (CC0):
  Trees: Kenney Nature Kit, tree_detailed and tree_pineRoundB.
  https://kenney.nl/assets/nature-kit
  Grass: Poly Haven grass_ground, resized to 512px WebP.
  https://polyhaven.com/a/grass_ground
  Sky: Poly Haven Kloofendal 48d Partly Cloudy Pure Sky, 2048px WebP.
  https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
  The four deployed asset files total 133770 bytes. Tree parts use instancing.
  Source downloads are local only, under ignored .tools/nature/.
