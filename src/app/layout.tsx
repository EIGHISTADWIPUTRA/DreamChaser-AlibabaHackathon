import type { Metadata } from "next";
import { SessionProvider } from "@/hooks/useSession";
import "./globals.css";

export const metadata: Metadata = {
    title: "Nusara",
    description: "Nusara — Learn to write English Narrative Text with AI-powered guidance",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className="min-h-screen bg-background text-foreground antialiased">
                <SessionProvider>{children}</SessionProvider>
            </body>
        </html>
    );
}
