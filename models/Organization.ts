import mongoose, { Schema, Document } from "mongoose";
import slugify from "slugify";

export interface IOrganization extends Document {
    name: string;
    description?: string;
    inviteCode: string;
    createdBy: mongoose.Types.ObjectId;
    slug: string;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true },
        description: { type: String },
        inviteCode: { type: String, required: true, unique: true },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        slug: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

// to auto-generate slug before saving
OrganizationSchema.pre("validate", async function (next) {
    if (!this.isModified("name")) return next();

    const baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Ensure uniqueness
    while (
        await mongoose.models.Organization.exists({ slug })
    ) {
        slug = `${baseSlug}-${counter++}`;
    }

    this.slug = slug;
    next();
});

export const Organization =
    mongoose.models.Organization ||
    mongoose.model<IOrganization>("Organization", OrganizationSchema);
