import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { AmbientBackground } from "@/modules/common/ambient-background";
import { PageProgress } from "@/modules/common/page-progress";
import { PortalFrame } from "@/modules/common/portal-frame";
import { PortalTopbar } from "@/modules/common/portal-topbar";
import { AppSidebar } from "@/modules/common/sidebar";

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
      <body className="h-svh overflow-hidden">
        <ThemeProvider>
          <SidebarProvider>
            <AmbientBackground />
            <AppSidebar />
            <SidebarInset className="relative z-10 h-svh min-w-0 overflow-hidden bg-background/72 backdrop-blur-[2px]">
              <PageProgress />
              <PortalTopbar />
              <PortalFrame>{children}</PortalFrame>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
