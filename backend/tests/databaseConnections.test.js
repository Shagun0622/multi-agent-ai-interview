import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "../shared/mongoose.js";
import { connectDatabases, databaseConnections } from "../shared/databaseConnections.js";
import User from "../services/auth/model/user.model.js";
import Resume from "../services/resume/models/resume.model.js";
import Interview from "../services/interview/models/interview.model.js";
import Roadmap from "../services/roadmap/models/roadmap.model.js";
import Billing from "../services/billing/models/billing.model.js";

const serviceModels = { auth: User, resume: Resume, interview: Interview, roadmap: Roadmap, billing: Billing };
const fakeUris = Object.fromEntries(
    Object.keys(databaseConnections).map(service => [service, `mongodb://test.invalid/${service}`]),
);

test("five services have independent Mongoose connections and bound models", () => {
    const connections = Object.values(databaseConnections);
    assert.equal(connections.length, 5);
    assert.equal(new Set(connections).size, 5);
    assert.ok(connections.every(connection => connection !== mongoose.connection));

    for (const [service, model] of Object.entries(serviceModels)) {
        assert.equal(model.db, databaseConnections[service], `${model.modelName} connection`);
        assert.ok(databaseConnections[service].modelNames().includes(model.modelName));
        assert.ok(!mongoose.connection.modelNames().includes(model.modelName));
    }
});

test("startup initializes each named cluster independently", async () => {
    const connected = [];
    const originals = new Map();
    for (const [service, connection] of Object.entries(databaseConnections)) {
        originals.set(service, connection.openUri);
        connection.openUri = uri => {
            connected.push({ service, uri, connection });
            return Promise.resolve(connection);
        };
    }

    try {
        await connectDatabases({ uris: fakeUris });
    } finally {
        for (const [service, connection] of Object.entries(databaseConnections)) {
            connection.openUri = originals.get(service);
        }
    }

    assert.deepEqual(
        connected.map(({ service }) => service).sort(),
        Object.keys(databaseConnections).sort(),
    );
    assert.equal(new Set(connected.map(({ uri }) => uri)).size, 5);
    assert.equal(new Set(connected.map(({ connection }) => connection)).size, 5);
    assert.equal(mongoose.connection.readyState, 0);
});

test("startup reports the specific required cluster that failed", async () => {
    const originals = new Map();
    for (const [service, connection] of Object.entries(databaseConnections)) {
        originals.set(service, connection.openUri);
        connection.openUri = () => service === "resume"
            ? Promise.reject(Object.assign(new Error("simulated failure"), { name: "MongoServerSelectionError" }))
            : Promise.resolve(connection);
    }

    try {
        await assert.rejects(
            connectDatabases({ uris: fakeUris }),
            /Resume \(RESUME_MONGODB_URL\): .*MongoServerSelectionError/,
        );
    } finally {
        for (const [service, connection] of Object.entries(databaseConnections)) {
            connection.openUri = originals.get(service);
        }
    }
});
