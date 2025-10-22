import { createFileRoute } from "@tanstack/react-router";
import { Feather } from "lucide-react";
import { LoginForm } from "./auth/-components/login-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="bg-gradient-to-r from-purple-500 to-orange-400 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <Feather className="size-4" />
          </div>
          <span className="text-2xl font-semibold">RAGA</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/environmental-study.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
