import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/_providers/providers';
import { ChatbotWidget } from '@/_components/ai/chatbot-widget';
import { CommandPalette } from '@/_components/ai/command-palette';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IsDB-BISEW Connect',
  description: 'Scholarship Community Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <ChatbotWidget />
        <CommandPalette />
      </body>
    </html>
  );
}
