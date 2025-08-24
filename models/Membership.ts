import mongoose, { Schema, Document } from "mongoose";

export interface IMembership extends Document {
    user: mongoose.Types.ObjectId;
    organization: mongoose.Types.ObjectId;
    team?: mongoose.Types.ObjectId;
    role: "owner" | "member";
    isActive: boolean;
}

const MembershipSchema = new Schema<IMembership>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organization: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: "Team",
            default: null,
        },
        role: {
            type: String,
            enum: ["owner", "member"],
            default: "member",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

MembershipSchema.index({ user: 1, organization: 1 }, { unique: true });

export const Membership =
    mongoose.models.Membership ||
    mongoose.model<IMembership>("Membership", MembershipSchema);
