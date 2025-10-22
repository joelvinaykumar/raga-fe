"use client";

import * as React from "react";
import { AxiosResponse } from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Ellipsis, Feather, Loader2, Plus, Trash2 } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import axios from "@/lib/axios";
import { SessionResponse } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
} from "./ui/alert-dialog";

import { Button } from "./ui/button";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [deleteModalVisible, setDeleteModalVisible] = React.useState<{
    open: boolean;
    id: string;
  }>({ open: false, id: "" });

  const { data: sessions = [] } = useQuery<any, any, SessionResponse[]>({
    queryKey: ["list-sessions"],
    queryFn: () => axios.get("list-sessions"),
    select: (res: AxiosResponse) => res.data,
  });

  const { mutateAsync: deleteSession, isPending: isDeletingSession } =
    useMutation({
      mutationKey: ["delete-session"],
      mutationFn: (session_id: string) =>
        axios.delete(`/delete-session/${session_id}`),
      onSuccess: (_, ctx) => {
        queryClient.invalidateQueries({ queryKey: ["list-sessions"] });
        toast.success(`Deleted session ${ctx}`);
      },
    });

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="bg-gradient-to-r from-purple-500 to-orange-400 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Feather className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">RAGA</span>
                    <span className="truncate text-xs">Free Plan</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="list-none gap-4">
            <SidebarMenuItem>
              <SidebarMenuButton variant="outline" asChild>
                <Link to="/chat">
                  <Plus className="size-4 mr-1" />
                  New Chat
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <h4 className="text-xs text-muted-foreground font-semibold">
              Sessions
            </h4>
            {sessions.map((session, index) => (
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index / 20 }}
              >
                <SidebarMenuItem key={session.session_id}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === `/chat/${session.session_id}`
                    }
                  >
                    <Link
                      to="/chat/$sessionId"
                      params={{ sessionId: session.session_id }}
                    >
                      <span>
                        {session.user_query.slice(0, 25)}
                        {session.user_query.length > 25 && "..."}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Ellipsis className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            setDeleteModalVisible({
                              open: true,
                              id: session.session_id,
                            })
                          }
                        >
                          <Trash2 className="text-destructive" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              </motion.div>
            ))}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
      <AlertDialog
        open={deleteModalVisible.open}
        onOpenChange={(value) => setDeleteModalVisible({ open: value, id: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogHeader>Confirm Action</AlertDialogHeader>
            <AlertDialogDescription>
              You will lose your chat history for this session permanently. Are
              you sure you want to delete this session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <Button
            className="bg-destructive"
            disabled={isDeletingSession}
            onClick={() => deleteSession(deleteModalVisible?.id)}
          >
            {isDeletingSession && <Loader2 className="animate-spin" />}
            {isDeletingSession ? "Deleting Session" : "Confirm, Delete"}
          </Button>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
