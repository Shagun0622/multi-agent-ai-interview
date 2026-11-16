import { connectServiceDatabase } from "../../../shared/databaseConnections.js";

export const connectDb = () => connectServiceDatabase(
    "auth",
    process.env.AUTH_MONGODB_URL || process.env.MONGODB_URL,
);
