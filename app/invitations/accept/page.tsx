"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        const accept = async () => {
            // TODO: Replace CURRENT_USER_ID with session user
            const res = await fetch("/api/invitations/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, userId: "CURRENT_USER_ID" }),
            });
            const data = await res.json();
            setStatus(res.ok ? "accepted" : "error");
        };

        if (token) accept();
    }, [token]);

    if (status === "loading") return <p>Validating invitation...</p>;
    if (status === "accepted") return <p>✅ You’ve joined the organization!</p>;
    return <p>❌ Invalid or expired invitation.</p>;
}
