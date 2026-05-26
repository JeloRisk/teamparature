import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Geist, Geist_Mono, Titan_One } from "next/font/google";
import "./globals.css";

import "nprogress/nprogress.css";
import TopProgressBarClientWrapper from "./components/TopProgressBarClientWrapper";

import { ReactNode } from "react";
import { Provider } from "./provider";
import AuthSync from "./components/AuthSync";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const titanOne = Titan_One({
  variable: "--font-titan-one",
  subsets: ["latin"],
  weight: "400", // required for Titan_One
});
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Choose the weights you need
  variable: '--font-plus-jakarta',       // Define a custom CSS variable name
});

// Site metadata
export const metadata: Metadata = {
  title: "Teamparature – Team Mood Tracking",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${titanOne.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning={true}>
        <Provider>
          <AuthSync />
          <TopProgressBarClientWrapper />
          {children}
        </Provider>
      </body>
    </html>
  );
}
