"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AcceptInviteClient() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "accepted" | "error">("loading");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const accept = async () => {
            try {
                const res = await fetch("/api/invitations/accept", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, userId: "CURRENT_USER_ID" }),
                });

                if (res.ok) {
                    setStatus("accepted");
                    setTimeout(() => router.replace("/dashboard"), 2000);
                } else {
                    setStatus("error");
                }
            } catch {
                setStatus("error");
            }
        };

        accept();
    }, [token, router]);

    if (status === "loading") return <p>Validating invitation...</p>;
    if (status === "accepted") return <p>✅ Invitation accepted! Redirecting...</p>;
    return <p>❌ Invalid or expired invitation.</p>;
}
