// Load backend/.env before importing modules that create external clients.
import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDatabases } from "./config/db.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { isAuth } from "./middleware/isAuth.js";
import authRouter from "../services/auth/routes/auth.route.js";
import resumeRouter from "../services/resume/routes/resume.route.js";
import interviewRouter from "../services/interview/routes/interview.route.js";
import roadmapRouter from "../services/roadmap/routes/roadmap.route.js";
import billingRouter from "../services/billing/routes/billing.route.js";
import redis, { closeRedis, connectRedis } from "../shared/redis/redis.js";
import { closeDatabases, databaseConnections } from "../shared/databaseConnections.js";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

const readiness = async () => {
    const services = Object.entries(databaseConnections).map(([service, connection]) => ({
        service: `${service}-mongodb`,
        ready: connection.readyState === 1,
    }));
    const mongoReady = services.every(service => service.ready);

    let redisReady = false;
    let redisError;
    try {
        if (redis.status !== "ready") {
            throw new Error(`Redis client is not ready (status: ${redis.status})`);
        }
        const response = await redis.ping();
        if (response !== "PONG") {
            throw new Error(`Redis PING returned an unexpected response (${String(response)})`);
        }
        redisReady = true;
    } catch (error) {
        const safeStack = String(error.stack || error)
            .replace(/rediss?:\/\/[^\s\"'`]+/gi, "[Redis URL redacted]");
        console.error("[readiness] Redis check failed:\n" + safeStack);
        redisError = error.name || "connection error";
    }
    services.push({
        service: "redis",
        ready: redisReady,
        ...(!redisReady && { error: redisError }),
    });

    return { ready: mongoReady && redisReady, services };
};

app.get("/", (_req, res) => res.send("Unified Backend"));
app.get("/health", async (_req, res) => {
    const result = await readiness();
    res.status(result.ready ? 200 : 503).json(result);
});

// Kept for the existing frontend startup check, now checking this process only.
app.get("/api/warmup", async (_req, res) => {
    const result = await readiness();
    res.status(result.ready ? 200 : 503).json({
        ready: result.ready,
        services: [{ service: "unified-backend", ready: result.ready }, ...result.services],
    });
});

app.use("/api/auth", authRouter);
app.use("/api/resume", isAuth, resumeRouter);
app.use("/api/interview", isAuth, interviewRouter);
app.use("/api/roadmap", isAuth, roadmapRouter);
app.use("/api/billing", isAuth, billingRouter);
app.get("/api/me", isAuth, getCurrentUser);

const startServer = async () => {
    try {
        await connectDatabases();
        // Wait for TCP, TLS/AUTH, Redis readiness and a successful PING.
        await connectRedis();

        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => {
            console.log(`Unified Backend Started on ${PORT}`);
        });
    } catch (error) {
        console.error("Unified backend startup failed:", error.message);
        closeRedis();
        await closeDatabases();
        process.exitCode = 1;
    }
};

startServer();
