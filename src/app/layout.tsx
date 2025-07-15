import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MuiThemeProvider from './components/MuiThemeProvider';
import AppLayout from './components/AppLayout'; // Import the new AppLayout component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tenant Manager",
  description: "Manage your tenants with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MuiThemeProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </MuiThemeProvider>
      </body>
    </html>
  );
}

