import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, requireWeddingAccess } from "@/lib/auth";
import { WeddingNav } from "./wedding-nav";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  let membership;
  try {
    membership = await requireWeddingAccess(id, user.id);
  } catch {
    notFound();
  }
  const wedding = membership.wedding;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← My events
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-medium">
            {wedding.coupleNames}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{wedding.location}</p>
        </div>
        <WeddingNav weddingId={wedding.id} />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
