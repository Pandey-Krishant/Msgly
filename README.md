# Msgly

Private, end‑to‑end focused messaging UI with a real‑time Socket.io backend.

**Repo Layout**
- `msgly` — Next.js client app
- `socketserver` — Socket.io server

**Tech Stack**
- Next.js 16 + React 19
- NextAuth (credentials)
- MongoDB
- Socket.io
- Tailwind CSS

**Ports**
- Client: `http://localhost:3000`
- Socket server: `http://localhost:3001`

**Environment Variables**
Create `msgly/.env.local` with:

| Key | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | NextAuth secret |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server URL, e.g. `http://localhost:3001` |

**Quick Start**
1. Install and run the socket server.
```bash
cd socketserver
npm install
npm run dev
```

2. Install and run the Next.js app.
```bash
cd ../msgly
npm install
npm run dev
```

3. Open the app.
```text
http://localhost:3000
```

**Notes**
- If you change the client port, update CORS in `socketserver/index.js`.
- If you use a different socket URL in production, set `NEXT_PUBLIC_SOCKET_URL`.
