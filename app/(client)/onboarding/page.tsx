"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/app/stores/useOnboardingStore";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useAuthStore } from "@/app/stores/useAuthStore";

export default function OnboardingPage() {
    const {
        step,
        mode,
        orgName,
        inviteCode,
        setStep,
        setMode,
        setOrgName,
        setInviteCode,
        reset,
    } = useOnboardingStore();

    const { logout } = useAuthStore(); // logout function
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkMembership = async () => {
            try {
                const res = await fetch("/api/me/memberships");
                const data = await res.json();
                router.replace("/dashboard");

                if (data?.memberships?.length > 0) {
                    router.replace("/dashboard");
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to check memberships", err);
                setLoading(false);
            }
        };

        checkMembership();
    }, [router]);




    const handleNext = async () => {
        setMessage(null);

        if (mode === "create" && step === 2) {
            const res = await fetch("/api/orgs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: orgName }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Hmm, couldn’t create your org 😅");
                return;
            }

            reset();
            router.replace("/dashboard");
        }

        if (mode === "join" && step === 2) {
            const res = await fetch("/api/orgs/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Oops, invite code not valid 🚧");
                return;
            }

            setMessage("🎉 You’re in! Welcome to the team 💜");
            reset();
            router.replace("/dashboard");
        }
    };

    const handleLogout = async () => {
        await logout(); // clear session/token
        router.replace("/login");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-gray-500">
                Checking your memberships...
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 px-4">
            <Card className="w-full max-w-md shadow-xl rounded-3xl border border-indigo-100 relative">
                {/* Logout button top-right */}
                <Button
                    variant="ghost"
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 px-2 py-1 text-sm"
                    onClick={handleLogout}
                >
                    Logout
                </Button>

                <CardHeader className="text-center space-y-2">
                    {step === 1 && (
                        <>
                            <CardTitle className="text-3xl font-extrabold text-indigo-600">
                                Hey 👋 Welcome!
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Do you want to <span className="font-medium text-indigo-500">start something new</span> or <span className="font-medium text-purple-500">join your crew</span>?
                            </p>
                        </>
                    )}
                    {step === 2 && mode === "create" && (
                        <CardTitle className="text-xl font-semibold text-indigo-700">
                            🚀 Let’s name your organization
                        </CardTitle>
                    )}
                    {step === 2 && mode === "join" && (
                        <CardTitle className="text-xl font-semibold text-purple-700">
                            🔑 Enter your invite code
                        </CardTitle>
                    )}
                </CardHeader>

                <CardContent className="space-y-6">
                    {message && (
                        <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 border border-indigo-200">
                            {message}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="flex flex-col gap-3">
                            <Button
                                className="w-full rounded-xl py-6 text-lg"
                                onClick={() => {
                                    setMode("create");
                                    setStep(2);
                                }}
                            >
                                ➕ Start a New Org
                            </Button>
                            <Button
                                className="w-full rounded-xl py-6 text-lg"
                                variant="secondary"
                                onClick={() => {
                                    setMode("join");
                                    setStep(2);
                                }}
                            >
                                📩 Join with Invite
                            </Button>
                        </div>
                    )}

                    {step === 2 && mode === "create" && (
                        <div className="space-y-4">
                            <Input
                                placeholder="e.g. Dream Team Inc."
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="rounded-xl border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200"
                            />
                            <p className="text-xs text-gray-400 text-center">
                                Don’t worry, you can rename this later ✨
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 rounded-xl"
                                    onClick={handleNext}
                                    disabled={!orgName}
                                >
                                    Create
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 rounded-xl"
                                    onClick={() => reset()}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && mode === "join" && (
                        <div className="space-y-4">
                            <Input
                                placeholder="Paste invite code here"
                                value={inviteCode}
                                onChange={(e) => setInviteCode(e.target.value)}
                                className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                            />
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1 rounded-xl"
                                    onClick={handleNext}
                                    disabled={!inviteCode}
                                >
                                    Join
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="flex-1 rounded-xl"
                                    onClick={() => reset()}
                                >
                                    Back
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
