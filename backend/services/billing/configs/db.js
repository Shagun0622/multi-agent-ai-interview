import { connectServiceDatabase } from "../../../shared/databaseConnections.js";

export const connectDB = () => connectServiceDatabase(
    "billing",
    process.env.BILLING_MONGODB_URL || process.env.MONGODB_URL,
);
