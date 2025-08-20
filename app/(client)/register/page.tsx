'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Calendar } from "lucide-react";

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
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-[30%_70%]">
            <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-700 via-blue-600 to-orange-500 text-white p-10 relative overflow-hidden">
                <div className="text-center max-w-xs space-y-4">
                    <h2 className="text-2xl font-semibold">Balance Your Workplace</h2>
                    <p className="text-sm text-blue-100">
                        Monitor, understand, and adjust your team’s “temperature.”
                        Ensure productivity without burnout, and harmony without stagnation.
                    </p>
                </div>

                {/* Subtle Floating Emojis */}
                <div className="absolute top-12 left-12 text-4xl opacity-70 animate-bounce">🔥</div>
                <div className="absolute bottom-12 right-12 text-4xl opacity-70 animate-pulse">❄️</div>
            </div>
            <div className="flex items-center justify-center bg-white px-6 py-12">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center">
                        <img src="/logo.png" alt="Teamparature Logo" className="mx-auto h-12 w-auto mb-4" />
                        <h1 className="text-4xl font-bold text-blue-700">Teamparature</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Create your account and take control of your team’s balance and productivity.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    name="firstName"
                                    placeholder="First Name"
                                    value={form.firstName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                name="password"
                                type="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Birthday */}
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input
                                name="birthday"
                                type="date"
                                value={form.birthday}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg bg-orange-500 text-white font-semibold shadow-md hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? 'Registering...' : 'Register'}
                        </Button>
                    </form>

                    {message && (
                        <p
                            role="status"
                            className="mt-4 text-sm text-center text-green-700 bg-green-100 p-3 rounded-md"
                        >
                            {message}
                        </p>
                    )}
                    {error && (
                        <p
                            role="alert"
                            className="mt-4 text-sm text-center text-red-700 bg-red-100 p-3 rounded-md"
                        >
                            {error}
                        </p>
                    )}

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-600 hover:underline">
                            Log in
                        </a>
                    </div>
                </div>
            </div>

        </div>
    );
}
