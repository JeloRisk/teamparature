"use client";
import { usePathname } from "next/navigation";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from 'sonner';


import { SessionProvider } from "next-auth/react";

type Props = {
    children?: React.ReactNode;
};

function ThemeToaster() {
    const { theme, forcedTheme } = useTheme();
    return <Toaster theme={(forcedTheme ?? theme) as "light" | "dark" | "system"} richColors position="top-right" />;
}

export const Provider = ({ children }: Props) => {
    const pathname = usePathname();
    const forcedTheme = pathname === "/login" || pathname === "/register" ? "light" : undefined;
    return <ThemeProvider forcedTheme={forcedTheme} attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange><SessionProvider>{children}<ThemeToaster /></SessionProvider></ThemeProvider>;
};