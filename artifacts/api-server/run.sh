export SESSION_SECRET=parknow_secret_2026
export PORT=5000
npx esbuild src/index.ts --bundle --platform=node --outfile=dist/index.cjs --format=cjs --external:bcrypt --external:better-sqlite3 --external:pino
node ./dist/index.cjs
