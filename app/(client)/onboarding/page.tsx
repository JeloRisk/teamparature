"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/app/stores/useOnboardingStore";
import { useAuthStore } from "@/app/stores/useAuthStore";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";

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

    const { logout, user } = useAuthStore();
    const [message, setMessage] = useState<string | null>(null);
    const [checkError, setCheckError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        setLoading(true);
        setCheckError(false);
        const checkMembership = async () => {
            try {
                const res = await fetch("/api/me/memberships", { signal: controller.signal });
                if (!res.ok) throw new Error("Could not load memberships");
                const data = await res.json();

                const membership = data.memberships?.find((item: { isActive: boolean; organization: { _id: string } | null }) =>
                    item.isActive && item.organization?._id);
                if (membership) {
                    router.replace(`/${membership.organization._id}`);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to check memberships", err);
                setCheckError(true);
                setLoading(false);
            } finally {
                clearTimeout(timeout);
            }
        };

        checkMembership();
    }, [router, attempt]);

    if (checkError) {
        return <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <p role="alert">Couldn’t check your memberships. Please try again.</p>
            <Button onClick={() => setAttempt(value => value + 1)}>Retry</Button>
        </div>;
    }

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center text-gray-500 dark:text-muted-foreground">
                Checking your memberships...
            </div>
        );
    }


    const handleCreate = async () => {
        try {
            const res = await fetch("/api/orgs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: orgName }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create org");

            setMessage("✅ Organization created!");
            router.replace("/dashboard");
        } catch (err: unknown) {
            setMessage(getErrorMessage(err))
        }
    };

    function getErrorMessage(err: unknown): string {
        return err instanceof Error ? err.message : String(err)
    }

    const handleJoin = async () => {
        try {
            const res = await fetch("/api/orgs/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to join org")

            setMessage("🎉 Joined organization!")
            router.replace("/dashboard")
        } catch (err: unknown) {
            setMessage(getErrorMessage(err))
        }
    }


    return (
        <div className="min-h-screen bg-gradient-to-br dark:bg-none from-indigo-50 via-purple-50 to-blue-50">
            {/* 🔹 Global Header */}
            <header className="flex items-center justify-between px-6 py-4 shadow-sm bg-card dark:bg-card">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-[#c4bce5]">MyApp</h1>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-muted dark:hover:bg-muted"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>
                                    {user?.firstName?.[0] ?? "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48" align="end">
                        <DropdownMenuItem
                            onClick={() => router.push("/profile")}
                            className="cursor-pointer"
                        >
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer text-red-600 dark:text-[#eea09a]"
                        >
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* 🔹 Onboarding Card */}
            <main className="flex items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md shadow-xl rounded-3xl border border-indigo-100">
                    <CardHeader className="text-center space-y-2">
                        {step === 1 && (
                            <>
                                <CardTitle className="text-3xl font-extrabold text-indigo-600 dark:text-[#c4bce5]">
                                    Hey 👋 Welcome!
                                </CardTitle>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    Do you want to{" "}
                                    <span className="font-medium text-indigo-500">
                                        start something new
                                    </span>{" "}
                                    or{" "}
                                    <span className="font-medium text-purple-500">
                                        join your crew
                                    </span>
                                    ?
                                </p>
                            </>
                        )}
                        {step === 2 && mode === "create" && (
                            <CardTitle className="text-xl font-semibold text-indigo-700 dark:text-[#c4bce5]">
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
                            <div className="rounded-lg bg-indigo-50 dark:bg-[#34313e] p-3 text-sm text-indigo-700 dark:text-[#c4bce5] border border-indigo-200">
                                {message}
                            </div>
                        )}

                        {/* Step 1 buttons */}
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

                        {/* Step 2 create org */}
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
                                        disabled={!orgName}
                                        onClick={handleCreate}

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

                        {/* Step 2 join org */}
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
                                        disabled={!inviteCode}
                                        onClick={handleJoin}

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
            </main>
        </div>
    );
}
