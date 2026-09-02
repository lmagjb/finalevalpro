import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const ROLE_REDIRECTS: Record<string, string> = {
  teacher: "/teacher/dashboard",
  admin_officer: "/ao/dashboard",
  principal: "/principal/dashboard",
  ao_ii: "/ao-ii/dashboard",
  psds: "/psds/dashboard",
  hr_ao_iv: "/hr-ao-iv/dashboard",
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const target = session?.user?.role ? ROLE_REDIRECTS[session.user.role] : undefined;
  redirect(target ?? "/login");
}
