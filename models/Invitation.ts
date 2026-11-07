import mongoose, { Schema, Document } from "mongoose";

export interface InvitationDocument extends Document {
    organization: mongoose.Types.ObjectId;
    email: string;
    role: "owner" | "member";
    invitedBy: mongoose.Types.ObjectId;
    status: "pending" | "accepted" | "expired";
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

const InvitationSchema = new Schema<InvitationDocument>({
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ["owner", "member"], default: "member" },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
});

export default mongoose.models.Invitation ||
    mongoose.model<InvitationDocument>("Invitation", InvitationSchema);
