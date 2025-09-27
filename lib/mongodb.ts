import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Please define MONGODB_URI in .env");

declare global {
    var _mongoose: {
        conn: Mongoose | null;
        promise: Promise<Mongoose> | null;
    } | undefined;
}

if (!global._mongoose) {
    global._mongoose = { conn: null, promise: null };
}

const cached = global._mongoose; // now guaranteed to exist

export default async function connectDB(): Promise<Mongoose> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        mongoose.set("strictQuery", true); // optional
        cached.promise = mongoose.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
