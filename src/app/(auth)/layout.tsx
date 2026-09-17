import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div aria-hidden className="atmosphere pointer-events-none fixed inset-0" />
      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <Logo className="text-3xl" />
        </div>
        {children}
      </div>
    </div>
  );
}
