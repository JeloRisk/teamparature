import { Schema, model, models } from 'mongoose';
// For hashing tokens, you would use this in your service/logic file, not the model file.
// import crypto from 'crypto';

const VerificationTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    // IMPORTANT: This field should store the HASHED token, not the plaintext one.
    token: {
        type: String,
        required: true,
        unique: true,
    },
    used: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // This field will be used by the TTL index to auto-delete the document.
    expiresAt: {
        type: Date,
        required: true,
    },
});

// 🚀 Use a TTL index to automatically delete expired tokens from the database.
VerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationToken =
    models.VerificationToken || model('VerificationToken', VerificationTokenSchema);

export default VerificationToken;