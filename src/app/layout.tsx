import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

const notoSans = Noto_Sans({
  weight: ['400', '600'],
  subsets: ['cyrillic-ext'],
});

export const metadata: Metadata = {
  title: 'Anibel DL',
  description: 'Download video from Anibel.net in one click',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={notoSans.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
