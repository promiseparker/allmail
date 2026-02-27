import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function getCurrentUser() {
  const session = await requireAuth();
  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    image: session.user.image,
    plan: (session.user as any).plan ?? "free",
  };
}

// Type augmentation
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      plan: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    plan?: string;
  }
}
