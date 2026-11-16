import test from "node:test";
import assert from "node:assert/strict";
import { validateRedisUrl } from "../shared/redis/redis.js";

test("Upstash TCP URLs require TLS", () => {
    assert.equal(
        validateRedisUrl("rediss://default:example-token@demo.upstash.io:6379"),
        "rediss://default:example-token@demo.upstash.io:6379",
    );
    assert.throws(
        () => validateRedisUrl("redis://default:example-token@demo.upstash.io:6379"),
        /Upstash REDIS_URL must use rediss:\/\/ TLS/,
    );
});

test("Redis TCP URL validation rejects non-Redis protocols", () => {
    assert.throws(
        () => validateRedisUrl("https://example.upstash.io"),
        /must use the redis:\/\/ or rediss:\/\/ TCP protocol/,
    );
});
