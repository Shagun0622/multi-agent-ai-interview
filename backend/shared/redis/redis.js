import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
    // The Gateway calls connectRedis() after dotenv has loaded and MongoDB is ready.
    lazyConnect: true,
});

const errorSummary = error => {
    const type = error?.name || "RedisError";
    const codes = new Set();
    const visited = new Set();
    const collectCodes = (current, depth = 0) => {
        if (!current || depth > 5 || visited.has(current)) return;
        visited.add(current);
        if (current.code) codes.add(String(current.code));
        collectCodes(current.cause, depth + 1);
        for (const nested of current.errors || []) collectCodes(nested, depth + 1);
    };
    collectCodes(error);
    return `${type}${codes.size ? ` (${[...codes].join(", ")})` : ""}`;
};

let startupPromise;

redis.on("connect", () => {
    console.info("[redis] TCP connected; waiting for Redis readiness");
});

redis.on("ready", () => {
    console.info("[redis] ready");
});

redis.on("reconnecting", delay => {
    console.warn(`[redis] reconnecting in ${delay}ms`);
});

redis.on("close", () => {
    console.warn("[redis] socket closed");
});

redis.on("end", () => {
    console.error("[redis] reconnect attempts ended");
});

redis.on("error", error => {
    // Do not print error.message: some client errors can include connection details.
    console.error(`[redis] connection error: ${errorSummary(error)}`);
});

export const validateRedisUrl = (value = process.env.REDIS_URL) => {
    if (!value) {
        throw new Error("REDIS_URL is required");
    }

    let parsed;
    try {
        parsed = new URL(value);
    } catch {
        throw new Error("REDIS_URL must be a valid Redis TCP URL");
    }

    if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
        throw new Error("REDIS_URL must use the redis:// or rediss:// TCP protocol");
    }

    if (parsed.hostname.endsWith(".upstash.io") && parsed.protocol !== "rediss:") {
        throw new Error("Upstash REDIS_URL must use rediss:// TLS; copy the TCP URL from Upstash Connect");
    }

    return value;
};

export const connectRedis = () => {
    validateRedisUrl();

    if (redis.status === "ready") {
        return redis.ping().then(() => redis);
    }
    if (startupPromise) {
        return startupPromise;
    }

    startupPromise = (async () => {
        try {
            await redis.connect();
            if (redis.status !== "ready") {
                throw new Error(`Redis did not reach ready state (status: ${redis.status})`);
            }

            // Verify a real command after the AUTH/TLS/ready handshake.
            await redis.ping();
            return redis;
        } catch (error) {
            const stage = redis.status === "ready" ? "PING" : "connection";
            throw new Error(`Redis startup ${stage} failed (${errorSummary(error)})`, { cause: error });
        } finally {
            startupPromise = undefined;
        }
    })();

    return startupPromise;
};

export const closeRedis = () => redis.disconnect();

export default redis;
