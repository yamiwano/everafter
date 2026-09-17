import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div>
      <h1 className="mb-1 text-center font-serif text-2xl font-medium">
        Welcome back
      </h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Sign in to your SnapTime dashboard
      </p>
      <AuthForm mode="signin" />
    </div>
  );
}
