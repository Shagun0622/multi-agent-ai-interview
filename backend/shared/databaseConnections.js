import mongoose from "./mongoose.js";

const definitions = {
    auth: {
        label: "Auth",
        envVar: "AUTH_MONGODB_URL",
        connection: mongoose.createConnection(),
    },
    resume: {
        label: "Resume",
        envVar: "RESUME_MONGODB_URL",
        connection: mongoose.createConnection(),
    },
    interview: {
        label: "Interview",
        envVar: "INTERVIEW_MONGODB_URL",
        connection: mongoose.createConnection(),
    },
    roadmap: {
        label: "Roadmap",
        envVar: "ROADMAP_MONGODB_URL",
        connection: mongoose.createConnection(),
    },
    billing: {
        label: "Billing",
        envVar: "BILLING_MONGODB_URL",
        connection: mongoose.createConnection(),
    },
};

const pendingConnections = new Map();
const sanitizeMongoUri = message => String(message || "connection error")
    .replace(/mongodb(?:\+srv)?:\/\/[^\s\"'`]+/gi, "[MongoDB URL redacted]");

export const databaseConnections = Object.freeze(
    Object.fromEntries(
        Object.entries(definitions).map(([service, config]) => [service, config.connection]),
    ),
);

export const connectServiceDatabase = async (service, uri = process.env[definitions[service]?.envVar]) => {
    const config = definitions[service];
    if (!config) {
        throw new Error(`Unknown MongoDB service: ${service}`);
    }
    if (!uri) {
        throw new Error(`${config.envVar} is required`);
    }

    if (config.connection.readyState === 1) {
        return config.connection;
    }
    if (pendingConnections.has(service)) {
        return pendingConnections.get(service);
    }

    const pending = Promise.resolve().then(async () => {
        try {
            // In the installed Mongoose version openUri() returns a Promise,
            // not the Connection object; await it directly.
            await config.connection.openUri(uri);
            console.log(`${config.label} MongoDB connected`);
            return config.connection;
        } catch (error) {
            throw new Error(
                `${config.label} MongoDB connection failed (${error.name || "connection error"}): ${sanitizeMongoUri(error.message)}`,
                { cause: error },
            );
        } finally {
            pendingConnections.delete(service);
        }
    });

    pendingConnections.set(service, pending);
    return pending;
};

export const closeDatabases = async () => {
    const entries = Object.entries(definitions);
    const results = await Promise.allSettled(entries.map(([, config]) => config.connection.close()));
    results.forEach((result, index) => {
        if (result.status === "rejected") {
            const config = entries[index][1];
            console.error(`${config.label} MongoDB close failed (${result.reason?.name || "close error"})`);
        }
    });
};

export const connectDatabases = async ({
    uris = Object.fromEntries(
        Object.entries(definitions).map(([service, config]) => [service, process.env[config.envVar]]),
    ),
    connector = connectServiceDatabase,
} = {}) => {
    const missing = Object.entries(definitions)
        .filter(([service]) => !uris[service])
        .map(([, config]) => config.envVar);

    if (missing.length) {
        throw new Error(`Missing required MongoDB URLs: ${missing.join(", ")}`);
    }

    const results = await Promise.all(
        Object.entries(definitions).map(async ([service, config]) => {
            try {
                await connector(service, uris[service]);
                return { service, ok: true };
            } catch (error) {
                return { service, ok: false, error };
            }
        }),
    );

    const failures = results.filter(result => !result.ok);
    if (failures.length) {
        await closeDatabases();

        const details = failures.map(({ service, error }) => {
            const config = definitions[service];
            return `${config.label} (${config.envVar}): ${sanitizeMongoUri(error.message || error.name)}`;
        });
        throw new Error(`MongoDB startup failed: ${details.join("; ")}`, {
            cause: failures.map(failure => failure.error),
        });
    }

    return databaseConnections;
};
