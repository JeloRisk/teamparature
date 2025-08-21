// /app/api/auth/[...nextauth]/route.ts  (App Router)
// or /pages/api/auth/[...nextauth].ts   (Pages Router)

import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Ensure DB is connected
                await connectDB();

                // Find user by email
                const user = await User.findOne({ email: credentials?.email });
                if (!user) return null;

                // Compare password
                const isPasswordCorrect = await compare(
                    credentials!.password,
                    user.password
                );
                if (!isPasswordCorrect) return null;

                // Return minimal user object (must be serializable)
                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    birthday: user.birthday,
                    avatar: user.avatar,
                    onboarded: user.onboarded,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt", // stateless sessions
        maxAge: 24 * 60 * 60, // 1 day
        updateAge: 60 * 60, // refresh once per hour
    },

    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },

    callbacks: {
        async jwt({ token, user }) {
            // On login, user exists
            if (user) {
                token.id = user.id;
            }

            if (token.id) {
                // Always fetch latest user from DB to get fresh onboarded value
                await connectDB();
                const dbUser = await User.findById(token.id);
                if (dbUser) {
                    token.onboarded = dbUser.onboarded;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
                session.user.onboarded = token.onboarded as boolean;
            }
            return session;
        },
    },


    secret: process.env.NEXTAUTH_SECRET,

    pages: {
        signIn: "/login", // custom login page
    },
};

// Export handler depending on router type
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; // App Router
// export default NextAuth(authOptions); // Pages Router
