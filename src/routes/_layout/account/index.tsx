import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Calendar, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/_layout/account/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { current_user } = useAuth();

  const profile = current_user?.user_metadata;

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="p-8 h-full w-full grid place-items-center bg-[#fff8f5] dark:bg-[#121115] border-l border-[#ccc3d4]/20 dark:border-[#2d2a2e]/20"
    >
      <Card className="w-full max-w-md border border-[#ccc3d4] dark:border-[#4a4452] bg-white dark:bg-[#16141a] rounded-xl shadow-none p-2 text-[#1e1b19] dark:text-[#f4ece8]">
        <CardHeader className="text-center pb-6 border-b border-[#ccc3d4]/30 dark:border-[#2d2a2e]/30">
          <div className="relative mx-auto mt-2">
            <Avatar className="w-24 h-24 border-2 border-[#340075] dark:border-[#6c40d6] rounded-full p-1 bg-white dark:bg-[#1a1820]">
              <AvatarImage
                src={profile?.picture}
                alt={profile?.full_name}
                className="rounded-full object-cover"
              />
              <AvatarFallback className="text-xl font-serif font-bold bg-[#340075] dark:bg-[#6c40d6] text-white">
                {getInitials(profile?.full_name ?? current_user?.email ?? "U")}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-1 mt-4">
            <div className="text-xs font-mono text-[#4a4452] dark:text-[#9c95a6] uppercase tracking-widest mt-1">
              Editorial Contributor
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#1e1b19] dark:text-[#f4ece8] tracking-tight">
              {profile?.full_name ?? "Elliot Editor"}
            </h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="space-y-4">
            {/* Email field */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
              <Mail className="w-5 h-5 text-[#340075] dark:text-[#9c7beb]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                  Editorial Contact
                </p>
                <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] truncate font-sans">
                  {profile?.email ?? current_user?.email}
                </p>
              </div>
              {profile?.email_verified && (
                <Badge
                  variant="outline"
                  className="bg-[#340075]/10 dark:bg-[#6c40d6]/20 text-[#340075] dark:text-[#9c7beb] border-[#340075]/20 dark:border-[#9c7beb]/20 text-xxs font-mono rounded-md"
                >
                  Verified
                </Badge>
              )}
            </div>

            {/* Phone field */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
              <Phone className="w-5 h-5 text-[#340075] dark:text-[#9c7beb]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                  Verified Phone
                </p>
                <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] font-sans">
                  Not provided
                </p>
              </div>
              {!profile?.phone_verified && (
                <Badge
                  variant="outline"
                  className="bg-yellow-500/10 text-amber-800 dark:text-amber-500 border-amber-500/20 text-xxs font-mono rounded-md"
                >
                  Pending
                </Badge>
              )}
            </div>

            {/* Calendar session field */}
            <div className="flex items-center gap-4 p-4 rounded-lg border border-[#ccc3d4]/40 dark:border-[#4a4452]/40 bg-[#fff8f5] dark:bg-[#1c1a20]">
              <Calendar className="w-5 h-5 text-[#340075] dark:text-[#9c7beb]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono uppercase tracking-wider text-[#4a4452] dark:text-[#9c95a6]">
                  Session Access Stamp
                </p>
                <p className="text-sm font-medium text-[#1e1b19] dark:text-[#f4ece8] font-sans leading-relaxed">
                  {new Intl.DateTimeFormat("en-IN", {
                    timeStyle: "short",
                    hour12: true,
                    dateStyle: "full",
                  }).format(
                    current_user?.last_sign_in_at
                      ? new Date(current_user?.last_sign_in_at)
                      : new Date(),
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
