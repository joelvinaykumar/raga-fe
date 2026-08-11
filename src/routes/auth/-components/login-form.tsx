import z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, loginWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formSchema = z.object({
    email: z.email(),
    password: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage(null);
    try {
      await login(values);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please check your credentials and try again.",
      );
    }
  };

  const onGoogleLogin = async () => {
    setErrorMessage(null);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("google error => ", error);
      setErrorMessage("Could not sign in with Google. Please try again.");
    }
  };

  return (
    <div
      className={`rounded-lg border border-[#e7e5e4] bg-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)] md:p-8 text-[#1e1b19] ${className ?? ""}`}
      {...props}
    >
      <div className="mb-6 border-t-2 border-[#340075] pt-4 text-center">
        <h2 className="font-serif text-3xl font-bold leading-tight text-[#1e1b19]">
          Welcome Back
        </h2>
        <p className="mt-1 text-base text-[#4a4452]">
          Sign in to your workspace
        </p>
      </div>

      <div className="space-y-3">
        {errorMessage && (
          <Alert variant="destructive" className="mb-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-center gap-2 border-[#ccc3d4] bg-[#fff8f5] text-base font-medium text-[#1e1b19] hover:-translate-y-0.5 hover:bg-white"
          onClick={onGoogleLogin}
        >
          <img src="/google.webp" alt="Google logo" className="h-4 w-4" />
          Continue with Google
        </Button>
      </div>

      <div className="relative my-6 text-center">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <span className="relative bg-white px-3 font-mono text-xs uppercase tracking-[0.2em] text-[#4a4452]">
          Or
        </span>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Form {...form}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase tracking-[0.2em] text-[#1e1b19]">
                  Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="engineer@company.com"
                    className="h-11 rounded-lg border-[#ccc3d4] bg-white font-mono text-sm text-[#1e1b19] placeholder:font-mono placeholder:text-[#9a91a3] focus-visible:ring-[#340075]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase tracking-[0.2em] text-[#1e1b19]">
                  Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    className="h-11 rounded-lg border-[#ccc3d4] bg-white font-mono text-sm text-[#1e1b19] placeholder:font-mono placeholder:text-[#9a91a3] focus-visible:ring-[#340075]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            className="h-11 w-full rounded-lg bg-[#340075] text-white text-base font-semibold hover:-translate-y-0.5 hover:bg-[#340075]/95"
            loading={form.formState.isSubmitting}
          >
            Continue with Email
          </Button>
        </Form>
      </form>

      <p className="mt-5 text-center text-sm text-[#4a4452]">
        Don&apos;t have an account?{" "}
        <span className="font-semibold text-[#340075] hover:underline cursor-pointer">
          Request Access
        </span>
      </p>
    </div>
  );
}
