import mongoose, { Schema } from "mongoose"
import { activityActions } from "@/lib/activity-actions"

const ActivitySchema = new Schema({
    organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    action: { type: String, enum: Object.keys(activityActions), required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetLabel: { type: String, required: true },
    previousRole: { type: String, enum: ["owner", "member"] },
    newRole: { type: String, enum: ["owner", "member"] },
    outcome: { type: String, enum: ["pending", "succeeded", "failed"], default: "succeeded" },
    createdAt: { type: Date, default: Date.now, immutable: true },
})
ActivitySchema.index({ organization: 1, createdAt: -1, _id: -1 })

export const Activity = mongoose.models.Activity || mongoose.model("Activity", ActivitySchema)
