/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-600 text-sm">Checking authentication...</p>
            </div>
        );
    }

    const handleLogin = async () => {
        setLoading(true);
        setError('');

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError(res.error === 'CredentialsSignin' ? 'Invalid email or password.' : res.error);
        } else if (res?.ok) {
            router.replace('/dashboard');
        } else {
            setError('Unexpected error. Please try again.');
        }

        setLoading(false);
    };

    return (
        <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-blue-100 px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md space-y-6">
                <div className="flex justify-center">
                    <img
                        src="/logo.png"
                        alt="App Logo"
                        className="h-16 w-auto"
                    />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-center text-gray-800">Login to Your Account</h1>

                {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="you@example.com"
                        className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="text-right text-sm">
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">
                        Forgot your password?
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full px-4 py-2 font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/register"
                        className="text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </main>
    );
}
