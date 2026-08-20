import z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, MailCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

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

const formSchema = z
  .object({
    email: z.email({ message: "Enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signup, loginWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setErrorMessage(null);
    try {
      const data = await signup({
        email: values.email,
        password: values.password,
      });

      // No session means Supabase requires email confirmation before sign-in.
      if (!data.session) {
        setConfirmationSent(true);
        toast.success("Confirm your email to continue", {
          description:
            "We sent a verification link to your inbox. You can sign in once your email is confirmed.",
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again.",
      );
    }
  };

  const onGoogleSignup = async () => {
    setErrorMessage(null);
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("google signup error => ", error);
      setErrorMessage("Could not continue with Google. Please try again.");
    }
  };

  if (confirmationSent) {
    return (
      <div
        className={`rounded-lg border border-[#e7e5e4] bg-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)] md:p-8 text-[#1e1b19] ${className ?? ""}`}
        {...props}
      >
        <div className="mb-4 border-t-2 border-[#340075] pt-4 text-center">
          <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="font-serif text-3xl font-bold leading-tight text-[#1e1b19]">
            Check your inbox
          </h2>
          <p className="mt-2 text-base text-[#4a4452]">
            We&apos;ve sent a confirmation link to{" "}
            <span className="font-semibold text-[#1e1b19]">
              {form.getValues("email")}
            </span>
            .
          </p>
        </div>
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-sm leading-relaxed text-amber-800">
            You must confirm your email before you can sign in. Open the link in
            your inbox to activate your account, then return here to log in and
            start using RAGA.
          </p>
        </div>
        <Link
          to="/login"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#340075] text-base font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-[#340075]/95"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-[#e7e5e4] bg-white p-6 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.1),0_1px_2px_-1px_rgb(0_0_0_/_0.1)] md:p-8 text-[#1e1b19] ${className ?? ""}`}
      {...props}
    >
      <div className="mb-6 border-t-2 border-[#340075] pt-4 text-center">
        <h2 className="font-serif text-3xl font-bold leading-tight text-[#1e1b19]">
          Create your account
        </h2>
        <p className="mt-1 text-base text-[#4a4452]">
          Spin up your RAG workspace in minutes
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
          onClick={onGoogleSignup}
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
                    placeholder="At least 8 characters"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-mono text-xs uppercase tracking-[0.2em] text-[#1e1b19]">
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
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
            Create Account
          </Button>
        </Form>
      </form>

      <p className="mt-5 text-center text-sm text-[#4a4452]">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-[#340075] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
