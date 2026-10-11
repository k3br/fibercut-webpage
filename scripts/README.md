# Original house assets

`build-houses.mjs` creates the three background house GLBs from original
procedural geometry and colour-only materials. It does not download assets.

Run from the repository root with Node.js and the build-only packages
`three@0.185.1` and `@gltf-transform/core@4.5.1` installed in your development
environment: `node scripts/build-houses.mjs`.
The website loads the exported GLBs, not this generator or its Node dependencies.

Licence/provenance inventory: `../THIRD_PARTY_NOTICES.md`.
