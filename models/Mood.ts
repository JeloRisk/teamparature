import mongoose, { Schema, Document } from "mongoose";

export interface IMood extends Document {
    user: mongoose.Types.ObjectId;
    membership?: mongoose.Types.ObjectId; 
    organization: mongoose.Types.ObjectId;
    team?: mongoose.Types.ObjectId;

    userSnapshot: {
        name: string;
        email: string;
    };

    mood: "happy" | "neutral" | "sad" | "stressed" | "excited";
    rank: number; // 1–5 scale
    note?: string;
    date: Date;
}

const MoodSchema = new Schema<IMood>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        membership: { type: Schema.Types.ObjectId, ref: "Membership" },
        organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
        team: { type: Schema.Types.ObjectId, ref: "Team" },

        userSnapshot: {
            name: String,
            email: String,
        },

        mood: {
            type: String,
            enum: ["happy", "neutral", "sad", "stressed", "excited"],
            required: true,
        },
        rank: {
            type: Number,
            min: 1,
            max: 5,
            required: true,
        },
        note: { type: String },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export const Mood =
    mongoose.models.Mood || mongoose.model<IMood>("Mood", MoodSchema);
