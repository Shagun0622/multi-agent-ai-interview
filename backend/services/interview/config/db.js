import { connectServiceDatabase } from "../../../shared/databaseConnections.js";

export const connectDB = () => connectServiceDatabase(
    "interview",
    process.env.INTERVIEW_MONGODB_URL || process.env.MONGODB_URL,
);
