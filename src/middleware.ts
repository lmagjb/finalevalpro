import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Maps a URL prefix to the roles allowed on it.
const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/ao-ii", roles: ["ao_ii"] },
  { prefix: "/ao", roles: ["admin_officer"] }, // legacy generic AO dashboard
  { prefix: "/principal", roles: ["principal"] },
  { prefix: "/psds", roles: ["psds"] },
  { prefix: "/hr-ao-iv", roles: ["hr_ao_iv"] },
];

// Exact-segment match so "/ao" doesn't also match "/ao-ii/dashboard".
function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const match = ROUTE_ROLES.find((route) => pathMatchesPrefix(pathname, route.prefix));
    if (match && !match.roles.includes(role ?? "")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/teacher/:path*",
    "/ao/:path*",
    "/ao-ii/:path*",
    "/principal/:path*",
    "/psds/:path*",
    "/hr-ao-iv/:path*",
  ],
};
