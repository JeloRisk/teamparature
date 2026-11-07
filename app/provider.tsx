"use client";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from 'sonner';


import { SessionProvider } from "next-auth/react";

type Props = {
    children?: React.ReactNode;
};

function ThemeToaster() {
    const { theme } = useTheme();
    return <Toaster theme={theme as "light" | "dark" | "system"} richColors position="top-right" />;
}

export const Provider = ({ children }: Props) => {
    return <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange><SessionProvider>{children}<ThemeToaster /></SessionProvider></ThemeProvider>;
};