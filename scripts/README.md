# Original house assets

`build-houses.mjs` creates the three background house GLBs from original
procedural geometry and colour-only materials. It does not download assets.

Run from the repository root with Node.js and the build-only packages
`three@0.185.1`, `@gltf-transform/core@4.5.1`,
`@gltf-transform/extensions@4.5.1`, `@gltf-transform/functions@4.5.1` and
`meshoptimizer@1.2.0` installed in your development
environment: `node scripts/build-houses.mjs`.
The website loads the exported GLBs, not this generator or its Node dependencies.
Exports use Meshopt compression, decoded by the site's existing decoder.
The three exports total 35,552 bytes (before HTTP compression). Each house has
six material batches, no image textures, and the repeated villa reuses the
loaded asset. The environment loads all three distinct assets in parallel.

Licence/provenance inventory: `../THIRD_PARTY_NOTICES.md`.
