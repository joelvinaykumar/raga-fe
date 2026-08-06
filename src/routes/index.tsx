import { redirect, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge-base" });
  },
  component: () => null,
});
