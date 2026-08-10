import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isMaster = session?.user?.isMaster ?? false;
  const isAdmin = session?.user?.isAdmin ?? false;
  const isPrivileged = isMaster || isAdmin;

  if (!isPrivileged) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-8 text-center max-w-sm">
          <LogoMark size={28} />
          <h1 className="font-head text-xl font-semibold text-white mt-4 mb-2">
            {session?.user ? "Not authorized" : "Sign in required"}
          </h1>
          {!session?.user && <p className="text-sm text-muted mb-3">This page is visible only to the admin or master account.</p>}
          <Link href={session?.user ? "/" : "/login"} className="text-cyan hover:underline text-sm">
            {session?.user ? "Back home" : "Sign in →"}
          </Link>
        </div>
      </div>
    );
  }

  return <AdminShell email={session!.user!.email ?? ""}>{children}</AdminShell>;
}
