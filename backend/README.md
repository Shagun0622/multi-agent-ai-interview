# Unified backend

This directory runs the existing Gateway and all five service routers in one
Express process. The original service entry points remain available for
rollback; Render should start only `gateway/index.js` through the root script.

## Local setup

1. From `backend`, install the unified dependencies with `npm install`.
2. Copy `.env.example` to `.env` and provide the required local credentials.
   Do not commit `.env` or Firebase service account files.
3. Set `FIREBASE_SERVICE_ACCOUNT_PATH` to the service account JSON file path.
   The file must be readable by the Node process.
4. Start with `npm run dev` or `npm start`.
5. Check `http://localhost:8000/health` and
   `http://localhost:8000/api/warmup`.

All five MongoDB URLs and Redis (`REDIS_URL`) are required at startup. Each URL
must be the complete original connection string, including its original
database name. The app opens five independent Mongoose connections in parallel:
`AUTH_MONGODB_URL`, `RESUME_MONGODB_URL`, `INTERVIEW_MONGODB_URL`,
`ROADMAP_MONGODB_URL`, and `BILLING_MONGODB_URL`. Each service's models are
registered on that service's connection. No database names, collections, data,
or clusters are merged. The app uses one shared Redis client. It also needs
`FRONTEND_URL` for credentialed CORS. `GROQ_API_KEY` powers resume, interview,
and roadmap generation; `YOUTUBE_API_KEY` powers roadmap resources; and the
Razorpay key pair powers billing. The frontend still needs
`VITE_BACKEND_URL` set to this server's base URL and retains its existing
Firebase and Razorpay public configuration.

For Upstash with ioredis, use the TCP connection URL from the Upstash Console
(`Connect` → `TCP`), which uses `rediss://` TLS. The Gateway waits for Redis to
reach the `ready` state and verifies startup with `PING`; the `connect` event
alone only means the TCP socket connected.

## Render Web Service

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/health`

Configure all five `*_MONGODB_URL` variables, `REDIS_URL`, `FRONTEND_URL`, `GROQ_API_KEY`,
`YOUTUBE_API_KEY`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` in the Render
service environment. Provide the Firebase Admin service account as a Render
secret file and set `FIREBASE_SERVICE_ACCOUNT_PATH` to its mounted path. Render
sets `PORT`; the app uses that value and defaults to 8000 for local use.

Startup fails with the affected service and environment variable named if any
required MongoDB connection fails. `/health` reports readiness for all five
connections and Redis.

No old `*_SERVICE_URL` values are used by the unified backend.
