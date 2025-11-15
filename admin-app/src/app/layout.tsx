import type { Metadata } from 'next';
import '../styles/globals.css';
import { ReactQueryProvider } from '@/providers/react-query-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Mixillo Admin Dashboard',
  description: 'Complete admin dashboard for Mixillo platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          {children}
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
