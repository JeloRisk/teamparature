// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthday?: Date;
    avatar?: string;
    resetPasswordToken: string;
    resetPasswordExpires: Date;
    isVerified: boolean;
    onboarded: boolean;
}

const UserSchema = new Schema<IUser>(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        birthday: { type: Date },
        avatar: { type: String, default: '' },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        isVerified: { type: Boolean, default: false },
        onboarded: { type: Boolean, default: false },
    },
    { timestamps: true }
);


export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
