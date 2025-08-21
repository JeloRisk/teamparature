import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
    name: string;
    description?: string;
    inviteCode: string;
    createdBy: mongoose.Types.ObjectId;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true },
        description: { type: String },
        inviteCode: { type: String, required: true, unique: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

export const Organization =
    mongoose.models.Organization ||
    mongoose.model<IOrganization>("Organization", OrganizationSchema);