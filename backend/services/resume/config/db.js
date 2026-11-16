import { connectServiceDatabase } from "../../../shared/databaseConnections.js";

export const connectDB = () => connectServiceDatabase(
    "resume",
    process.env.RESUME_MONGODB_URL || process.env.MONGODB_URL,
);
