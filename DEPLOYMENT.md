# Book Editor deployment wrapper

This repository deploys the full book editor to Railway.

- The application source is bundled in `app.tar.gz.b64`.
- `Dockerfile` extracts the source, installs dependencies, builds the React app, and starts the Node server.
- Set `STORAGE_ROOT=/data` and attach a Railway volume at `/data` so manuscript, revision request, suggestion, and upload data persist across deploys.
