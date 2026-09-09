"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SIDEBAR_ITEMS } from "@/constants";
import { BrainCircuit } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />

      <SidebarContent>
        <SidebarHeader>
          <div className={"flex gap-2 items-center"}>
            <BrainCircuit
              size={48}
              className={"p-1.5 bg-accent rounded-xl aspect-square"}
            />
            <span className="text-lg font-bold">AIOps</span>
          </div>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarMenu>
            {SIDEBAR_ITEMS.map((item) => {
              const { icon: Icon, label, href } = item;

              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    className={"flex items-center gap-2"}
                    onClick={() => {
                      window.location.href = href;
                    }}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}
