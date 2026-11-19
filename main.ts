// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
// The guide itself is plain static files under app/ (index.html, style.css,
// ES modules, app/data/trophies.json; no build step, nothing fetched over
// the network). This program hands it in: it copies app/ and screenshots/
// from beside this file to /output and writes /output/dossier.json — the
// summary the judge reads (screenshots, the first load's files and bytes,
// and the source) — using the vendored make.fun library. Leave
// vendor/makefun-frontend.ts untouched: the scorer requires dossier.json
// to be byte for byte what its own copy writes.
//
// Run it locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with:  node serve.ts   (then http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(out, { recursive: true });
cpSync(join(here, "app"), join(out, "app"), { recursive: true });
mkdirSync(join(out, "screenshots"), { recursive: true });
if (existsSync(join(here, "screenshots"))) {
  cpSync(join(here, "screenshots"), join(out, "screenshots"), { recursive: true });
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse — more than
// 4 screenshots or one over 256 KiB; more than 993 files and directories in
// app/ or 48 MiB of app files.
writeFileSync(
  join(out, "dossier.json"),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
