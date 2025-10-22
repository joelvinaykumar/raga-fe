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
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="p-8 h-full w-full grid place-items-center"
    >
      <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-0 shadow-card hover:shadow-card-hover transition-all duration-300 float-animation">
        <CardHeader className="text-center pb-4">
          <div className="relative mx-auto">
            <Avatar className="w-24 h-24 ring-4 ring-primary/20 ring-offset-4 ring-offset-background pulse-glow">
              <AvatarImage src={profile?.picture} alt={profile?.full_name} />
              <AvatarFallback className="text-xl font-bold bg-gradient-primary text-primary-foreground">
                {getInitials(profile?.full_name ?? current_user?.email)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2 mt-4">
            <h2 className="text-2xl font-bold gradient-text">
              {profile?.full_name}
            </h2>
            <p className="text-muted-foreground">User</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <Mail className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground truncate">
                  {profile?.email ?? current_user?.email}
                </p>
              </div>
              {profile?.email_verified && (
                <Badge
                  variant="outline"
                  className="bg-success/10 text-success border-success/20 text-xs"
                >
                  Verified
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <Phone className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">Not provided</p>
              </div>
              {!profile?.phone_verified && (
                <Badge
                  variant="outline"
                  className="bg-warning/10 text-warning border-warning/20 text-xs"
                >
                  Pending
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <Calendar className="w-4 h-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Last Login</p>
                <p className="text-sm text-muted-foreground">
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
