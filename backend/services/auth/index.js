import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDb } from "./configs/db.js";
import authRouter from "./routes/auth.route.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 6001;

app.use("/", authRouter);

const startServer = async () => {
    try {
        await connectDb();

        app.listen(PORT, () => {
            console.log(`Auth Service Started on ${PORT}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
};

startServer();