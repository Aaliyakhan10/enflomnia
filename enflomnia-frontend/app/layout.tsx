import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Enflomnia — Content Nervous System",
    description: "The Self-Evolving Content Nervous System for the Global Enterprise",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
