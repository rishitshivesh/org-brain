"use client";

import {
  BrainCircuit,
  ChevronsUpDown,
  CircleHelp,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SIDEBAR_ITEMS } from "@/constants";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r bg-sidebar/92 backdrop-blur-xl"
    >
      <SidebarHeader className="border-b bg-sidebar/80">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" prefetch />}
              className="group/brand transition-colors duration-200"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-sm transition-transform duration-300 group-hover/brand:rotate-[-3deg] group-hover/brand:scale-105">
                <BrainCircuit className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  Org Brain
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  Engineering intelligence
                </span>
              </span>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground opacity-60 transition-opacity group-hover/brand:opacity-100" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="portal-scroll">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.16em]">
            Workspace
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {SIDEBAR_ITEMS.map(({ href, icon: Icon, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);

              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={label}
                    render={<Link href={href} prefetch />}
                    className="relative overflow-hidden transition-[background-color,color,transform] duration-200 active:scale-[0.985]"
                  >
                    {active ? (
                      <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-foreground/70" />
                    ) : null}
                    <Icon className="transition-transform duration-200 group-hover/menu-button:scale-105" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t bg-sidebar/80">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Help"
              className="transition-colors duration-200"
            >
              <CircleHelp />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              className="transition-colors duration-200"
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
