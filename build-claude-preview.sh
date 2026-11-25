#!/bin/sh
# Builds the version of Pharmie that runs inside a Claude artifact (in-memory routing,
# relative paths, OCR language data as JSON). Not needed for Render.
set -e
VITE_ROUTER=memory VITE_LANG_URL=ocr/eng.traineddata.json npx vite build --base ./ --outDir dist-claude --emptyOutDir
node -e "const fs=require('fs');fs.writeFileSync('dist-claude/ocr/eng.traineddata.json',JSON.stringify({base64:fs.readFileSync('public/ocr/eng.traineddata.gz').toString('base64')}));fs.rmSync('dist-claude/ocr/eng.traineddata.gz')"
