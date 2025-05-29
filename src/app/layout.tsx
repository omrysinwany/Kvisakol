// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Rubik } from 'next/font/google';

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik',
});

// Fonts
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'כביסכל הזמנות',
  description: 'קטלוג מוצרים והזמנות דיגיטליות לסוכני מכירות של כביסכל – פשוט, מהיר ומקצועי',
  applicationName: 'כביסכל הזמנות',
  keywords: ['כביסכל', 'הזמנות', 'קטלוג דיגיטלי', 'סוכני מכירות', 'מערכת הזמנות'],
  authors: [{ name: 'Omry Sinwany' }],
  creator: 'Omry Sinwany',
  openGraph: {
    title: 'כביסכל הזמנות',
    description: 'מערכת דיגיטלית להזמנות וקטלוג מוצרים לסוכני מכירות – מותאם לנייד ולמחשב',
    url: 'https://kvisakolorders.com',
    siteName: 'כביסכל הזמנות',
    locale: 'he_IL',
    type: 'website',
  },
  icons: {
    icon: '/images/products/kvisakol.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="light">
      <body className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} antialiased font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
