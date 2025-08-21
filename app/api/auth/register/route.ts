/*
================================================================================
/app/api/auth/register/route.js
================================================================================
- Refactored to use the `VerificationToken` model.
- The process is now:
  1. Create the user (without any token information).
  2. Generate a unique token.
  3. Create a *separate* `VerificationToken` document linking the token to the user's ID.
  4. Send an email with a link containing only the token.
*/
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import VerificationToken from '@/models/VerificationToken';
import connectDB from '@/lib/mongodb';
import { sendVerificationEmail } from '@/lib/mailer';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { firstName, lastName, email, password, birthday } = await req.json();

        // Input validation
        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ error: 'All fields except birthday are required.' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Security Best Practice: If the user exists but is not verified,
            // we could resend the verification email instead of just erroring.
            // For now, we'll keep it simple.
            return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 }); // 409 Conflict is more specific
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            birthday,
            onboarded: false,
        });

        // Generate verification token and save it to the VerificationToken collection
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        await VerificationToken.create({
            userId: user._id,
            token,
            expiresAt,
        });


        // Send the verification email
        await sendVerificationEmail({ name: firstName, email, token });

        return NextResponse.json({
            message: 'Registration successful. Please check your email to verify your account.',
        }, { status: 201 }); // 201 Created

    } catch (error) {
        console.error('REGISTRATION_ERROR', error);
        return NextResponse.json({ error: 'An unexpected error occurred during registration.' }, { status: 500 });
    }
}