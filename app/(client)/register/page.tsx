'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        birthday: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'An unknown error occurred.');
            } else {
                setMessage(data.message);
                setForm({ firstName: '', lastName: '', email: '', password: '', birthday: '' });
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Failed to connect to the server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-blue-50 px-4">
            <div className="w-full max-w-md p-10 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-blue-600 mb-2">Teamparature</h1>
                    <p className="text-gray-700">Create your account and start tracking your team's mood!</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        name="firstName"
                        placeholder="First Name"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        name="lastName"
                        placeholder="Last Name"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        name="birthday"
                        type="date"
                        placeholder="Birthday (optional)"
                        value={form.birthday}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <Button
                        type="submit"
                        disabled={loading}
                        aria-busy={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-all disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </Button>
                </form>

                {message && (
                    <p role="status" className="mt-4 text-sm text-center text-green-700 bg-green-100 p-3 rounded-md">{message}</p>
                )}
                {error && (
                    <p role="alert" className="mt-4 text-sm text-center text-red-700 bg-red-100 p-3 rounded-md">{error}</p>
                )}

                <div className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <a
                        href="/login"
                        className="text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        Log in
                    </a>
                </div>
            </div>
        </div>
    );
}
