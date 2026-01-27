import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
let connected = false;
export const connectDb = async () => {
    if (connected)
        return;
    try {
        await mongoose.connect(env.mongo.uri, {
            dbName: env.mongo.dbName,
            serverSelectionTimeoutMS: 10000
        });
        connected = true;
        logger.info("mongo_connected", { uri: env.mongo.uri, db: env.mongo.dbName });
    }
    catch (error) {
        logger.error("mongo_connection_failed", { error });
        throw error;
    }
};
