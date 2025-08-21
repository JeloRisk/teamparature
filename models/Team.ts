import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
    organization: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    createdBy?: mongoose.Types.ObjectId;
}

const TeamSchema = new Schema<ITeam>(
    {
        organization: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        name: { type: String, required: true },
        description: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

export const Team =
    mongoose.models.Team || mongoose.model<ITeam>("Team", TeamSchema);
