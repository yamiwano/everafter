import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <div>
      <h1 className="mb-1 text-center font-serif text-2xl font-medium">
        Create your account
      </h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Your event is two minutes away
      </p>
      <AuthForm mode="signup" />
    </div>
  );
}
