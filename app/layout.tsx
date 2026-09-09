import { Inter, Geist_Mono } from "next/font/google";

import "./globals.css";

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/modules/common/sidebar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans antialiased", inter.variable, fontMono.variable)}
    >
      <body>
        <ThemeProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0 bg-muted/20">
              <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75">
                <SidebarTrigger />
                <div className="ml-3 h-4 w-px bg-border" />
                <p className="ml-3 text-sm text-muted-foreground">Engineering context, connected</p>
              </header>
              <main className="min-w-0 flex-1">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
