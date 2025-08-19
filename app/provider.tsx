"use client";
import { Toaster } from 'sonner';


import { SessionProvider } from "next-auth/react";

type Props = {
    children?: React.ReactNode;
};

export const Provider = ({ children }: Props) => {
    return <SessionProvider>{children}<Toaster richColors position="top-right" /></SessionProvider>;
};