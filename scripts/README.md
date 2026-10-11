# CC0 background house preparation

build-houses.mjs prepares existing Kenney City Kit Suburban 2.0 models:
building-type-p (villa), building-type-q (cantilever), building-type-g (pavilion).
These replace the previous procedural houses. Source and CC0 licence:
https://kenney.nl/assets/city-kit-suburban

Download the official ZIP and unpack it locally. Run from the repository root:

    node scripts/build-houses.mjs "path/to/Models/GLB format"

Build-only packages: three@0.185.1, @gltf-transform/core@4.5.1,
@gltf-transform/extensions@4.5.1, @gltf-transform/functions@4.5.1,
meshoptimizer@1.2.0 and sharp.

The conversion preserves house geometry, normalizes metre scale, mutes green
roof colours to slate, bakes the palette into linear vertex colours and applies
Meshopt compression. No image texture files are shipped with these houses.
The front faces the street and no balconies are added.

The three exports total 42,732 bytes. Each uses one material batch. The repeated
villa reuses the loaded asset. All three models load in parallel through the
site's existing decoder; Node build packages are not website dependencies.

Licence inventory: ../THIRD_PARTY_NOTICES.md.

The prepared house exports are currently unused. The roadside reuses the base
scene's flat-roof volumes. Only garage and woodshed from build-outbuildings.mjs
are loaded as additional buildings, totalling 26,240 bytes without image textures.
Build the original outbuildings with the same packages:

    node scripts/build-outbuildings.mjs
