import { connectServiceDatabase } from "../../../shared/databaseConnections.js";

export const connectDB = () => connectServiceDatabase(
    "roadmap",
    process.env.ROADMAP_MONGODB_URL || process.env.MONGODB_URL,
);
