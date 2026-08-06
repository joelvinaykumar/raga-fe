"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { NavUser } from "@/components/nav-user";
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
import axios from "@/lib/axios";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

interface KnowledgeBase {
  rag_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();

  // Load active RAGs
  const { data: knowledgeBases = [], isLoading } = useQuery<KnowledgeBase[]>({
    queryKey: ["list-knowledge-bases"],
    queryFn: async () => {
      const res = await axios.get("/rag/all/");
      return res.data;
    },
  });

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[#e7e5e4] dark:border-[#2d2a2e] bg-[#fff8f5] dark:bg-[#121115] text-[#1e1b19] dark:text-[#f4ece8]"
      {...props}
    >
      <SidebarHeader className="border-b border-[#e7e5e4]/60 dark:border-[#2d2a2e]/60 px-6 py-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-[#340075] dark:bg-[#6c40d6] text-[#ffffff] shadow-sm rounded-lg">
                <span className="font-serif text-2xl font-bold">R</span>
              </div>
              <div className="grid flex-1 text-left">
                <span className="font-serif text-lg font-bold leading-none text-[#1e1b19] dark:text-[#f4ece8]">
                  RAGA
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#7b7483] dark:text-[#9c95a6] mt-1.5 leading-none">
                  FREE PLAN
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-3 pt-5">
        <SidebarGroup className="list-none p-0 flex flex-col gap-4">
          <SidebarMenuItem className="px-3">
            <Link
              to="/knowledge-base/new"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 w-full justify-center gap-2 border-[#340075] dark:border-[#6c40d6] bg-white dark:bg-[#1a1820] font-sans text-sm font-semibold text-[#340075] dark:text-[#9c7beb] shadow-sm hover:bg-[#fff8f5] dark:hover:bg-[#201d24] rounded-lg",
              )}
            >
              <Plus className="size-4" />
              New Instance
            </Link>
          </SidebarMenuItem>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center p-2 gap-4">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#7b7483] dark:text-[#9c95a6] font-semibold">
                ACTIVE RAGS
              </h4>
              <Separator className="w-12" />
              <Link
                to="/knowledge-base"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "text-[11px]",
                )}
              >
                ALL
              </Link>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : knowledgeBases.length === 0 ? (
              <p className="px-3 py-2 font-mono text-xs text-[#7b7483] dark:text-[#9c95a6]">
                No active instances
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {knowledgeBases.map((kb, index) => {
                  const isActive =
                    location.pathname.indexOf(
                      `/knowledge-base/${kb.rag_id}`,
                    ) !== -1;
                  return (
                    <motion.div
                      key={kb.rag_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index / 35 }}
                      className="relative"
                    >
                      <SidebarMenuItem className="list-none">
                        <SidebarMenuButton
                          asChild
                          className={`flex h-auto w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all relative ${
                            isActive
                              ? "border-l-4 border-l-[#340075] dark:border-l-[#9c7beb] border-[#e7e5e4] dark:border-[#2d2a2e] bg-[#f4ece8] dark:bg-[#1e1b24] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
                              : "border-transparent bg-transparent hover:bg-[#faf2ee] dark:hover:bg-[#201d24]"
                          }`}
                        >
                          <Link
                            to="/knowledge-base/$kbId"
                            params={{ kbId: kb.rag_id }}
                            className="group block w-full pr-6"
                          >
                            <div className="flex flex-col min-w-0">
                              <span
                                className={`font-sans text-sm font-bold text-[#1e1b19] dark:text-[#f4ece8] truncate`}
                              >
                                {kb.name}
                              </span>
                              {kb.description && (
                                <span className="font-sans text-[11px] text-[#4a4452] dark:text-[#9c95a6] mt-0.5 truncate leading-tight">
                                  {kb.description}
                                </span>
                              )}
                            </div>
                            {/* Green/Orange soft status lights mimicking reference design */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                              <span
                                className={`h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-emerald-500" : "bg-amber-500"}`}
                              />
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[#e7e5e4]/60 dark:border-[#2d2a2e]/60 px-4 py-3 bg-[#f4ece8]/50 dark:bg-[#1c1a20]/50">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
