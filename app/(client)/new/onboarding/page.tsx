"use client";

import { useState } from "react";
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
    const { orgName, setOrgName, reset } = useOnboardingStore();
    const { logout, user } = useAuthStore();
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

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
        } catch (err: any) {
            setMessage(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
            {/* 🔹 Global Header */}
            <header className="flex items-center justify-between px-6 py-4 shadow-sm bg-white">
                <h1 className="text-xl font-bold text-indigo-600">teamparature</h1>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-gray-100"
                        >
                            <Avatar className="h-9 w-9">
                                <AvatarFallback>{user?.firstName?.[0] ?? "U"}</AvatarFallback>
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
                            className="cursor-pointer text-red-600"
                        >
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* 🔹 Org Creation Form */}
            <main className="flex items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md shadow-xl rounded-3xl border border-indigo-100">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-xl font-semibold text-indigo-700">
                            🚀 Create Your Organization
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {message && (
                            <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700 border border-indigo-200">
                                {message}
                            </div>
                        )}

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
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
