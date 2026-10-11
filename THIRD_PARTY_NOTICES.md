# Asset provenance and third-party notices

Reviewed on 2026-10-11. Keep this file and `licenses/` in deployed copies.
This inventory distinguishes verified third-party licences from supplied assets
whose ownership cannot be established from the files alone. A generator name
in a GLB is not a copyright licence for its geometry or textures.

## Verified freely usable third-party assets

| Deployed files | Source | Licence and attribution |
| --- | --- | --- |
| `assets/environment/tree-oak.glb`, `tree-pine.glb` | Kenney Nature Kit 2.1, `tree_detailed`, `tree_pineRoundB`: https://kenney.nl/assets/nature-kit | CC0 1.0; commercial use and modification permitted, credit optional. Original package notice: `licenses/kenney-nature-kit.txt`. |
| `assets/environment/house-villa.glb`, `house-cantilever.glb`, `house-pavilion.glb` | Kenney City Kit Suburban 2.0, `building-type-p`, `building-type-q`, `building-type-g`: https://kenney.nl/assets/city-kit-suburban | CC0 1.0; metre scale, muted roofs, palette baked into vertex colours and Meshopt compression. Original notice: `licenses/kenney-city-kit-suburban.txt`. Replaces previous original procedural houses. |
| `assets/environment/grass.webp` | Poly Haven `grass_ground` diffuse texture: https://polyhaven.com/a/grass_ground | CC0 1.0; resized and converted to WebP. |
| `assets/environment/sky.webp` | Poly Haven `kloofendal_48d_partly_cloudy_puresky`, tonemapped JPG: https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky | CC0 1.0; resized and converted to WebP. |

Poly Haven asset licence: https://polyhaven.com/license
CC0 terms: https://creativecommons.org/publicdomain/zero/1.0/
These notices credit the original creators voluntarily; CC0 does not require
a visible website credit. No Poly Haven website preview renders are used.

## Original assets generated for this project

`assets/environment/tree-natural.glb`, `assets/environment/garage.glb`,
`assets/environment/woodshed.glb`, `models/web/coffee-table.glb`,
`models/web/dining-table.glb` (retained but no longer loaded),
`models/web/outdoor-seating.glb` and `models/web/pool-table.glb` were built from
procedural geometry for this project, with colour-only materials. They were
not downloaded from a model marketplace, and contain no third-party textures.
The local construction scripts were reviewed during this audit.
The separate CC0 house preparation source is retained in `scripts/build-houses.mjs`.
Original outbuilding geometry is retained in `scripts/build-outbuildings.mjs`.
Only house-pavilion is loaded (reused along the road); house-villa and
house-cantilever are retained as unused prepared CC0 assets. Active background
models total 39,012 bytes, including the garage and woodshed.
No external model attribution or model licence fee is required for these assets. This
statement does not grant an open-source licence to the entire project.

## Customer-owned supplied assets

On 2026-10-11 the site owner confirmed that the customer is the author of the
photos and the carport, fence, gate and stair models. This covers
`gallery/*.jpg`, their derived thumbnails, and `models/web/customer-gate.glb`,
`2_ograja.optimized.glb`, `3_stopnice.optimized.glb`,
`4_nadstresek.optimized.glb`. These are customer-owned assets used for the
commissioned site; they are not public-domain downloads. No external model
licence fee or mandatory third-party attribution was identified for them.

## Supplied assets — separate provenance confirmation outstanding

- `fibercut-scene.glb`, including its 10 remaining embedded images: existing uploaded
  scene, with Trimesh recorded as generator. No copyright/licence metadata
  or original construction source is available to establish all image origins.
  The owner indicated that textures should originate from fibercut.si; this
  is a stated expected source, not independent verification of every image.
  The unused `MountainBackdrop` and both photographic landscape textures were
  removed during this audit. The remaining images show material noise,
  perforation patterns, a shadow gradient and turf, rather than landscape photos.
- `assets/fibercut-logo.svg`, `fibercut-logo-light.svg`: vectorised supplied logo.
- `assets/kodica-logo.png`: existing brand logo.

Use of these remaining supplied assets was requested by the site owner, but that request
alone is not documentary evidence of copyright ownership or an upstream licence.
Confirm ownership or permission for commercial website publication, including
embedded textures, before declaring every asset licence-cleared. These files
must not be labelled CC0 or MIT merely because the rendering software is MIT.

No paid marketplace model was identified among the deployed assets. The known
third-party models are CC0; generated project models have no external model
licence dependency; CAD authorship is confirmed by the owner. This is not an
unqualified guarantee about undocumented pre-existing scene content.

## Runtime software

| Component | Exact source/version | Licence notice |
| --- | --- | --- |
| Three.js and used addons (`GLTFLoader`, `RoomEnvironment`, `BufferGeometryUtils`) | `three@0.185.1`, pinned jsDelivr imports in `index.html`; https://github.com/mrdoob/three.js | MIT, copyright 2010–2026 Three.js authors; `licenses/three-MIT.txt`. |
| MeshoptDecoder | Meshoptimizer 1.1 embedded in the pinned Three.js addon; https://github.com/zeux/meshoptimizer | MIT, copyright 2016–2026 Arseny Kapoulkine; `licenses/meshoptimizer-MIT.txt`. |
| Lenis | Vendored `lenis@1.3.26`; https://github.com/darkroomengineering/lenis | MIT, copyright 2024 darkroom.engineering; `assets/vendor/lenis/LICENSE` and `licenses/lenis-MIT.txt`. |

MIT permits commercial use and redistribution while requiring preservation of
copyright and permission notices. Full notices are included, not just SPDX tags.
Retain upstream headers in any redistributed JavaScript.

The site uses system fonts; no separately licensed webfont is distributed.
FreeCAD, glTF-Transform, Trimesh and Sharp used for local asset generation are
not shipped as website runtime code. Their software licences do not, by
themselves, determine the copyright licence of exported assets. Ignored local
downloads and dependencies under `.tools/` are not part of the committed site.
