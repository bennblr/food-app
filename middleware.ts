import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Защита админ-роутов
    if (path.startsWith("/admin")) {
      const allowedRoles = ["APP_OWNER", "APP_EDITOR"];
      if (!token || !allowedRoles.includes((token as any).role)) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    // Защита роутов ресторана (доступны владельцам ресторанов, сотрудникам и админам приложения)
    if (path.startsWith("/restaurant")) {
      const allowedRoles = ["RESTAURANT_OWNER", "RESTAURANT_EMPLOYEE", "APP_OWNER", "APP_EDITOR"];
      if (!token || !allowedRoles.includes((token as any).role)) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    // Защита роутов курьера (доступны водителям и админам приложения)
    if (path.startsWith("/driver")) {
      const allowedRoles = ["DRIVER", "APP_OWNER", "APP_EDITOR"];
      if (!token || !allowedRoles.includes((token as any).role)) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Публичные роуты
        if (
          path.startsWith("/api/restaurants") ||
          path.startsWith("/api/dishes") ||
          path.startsWith("/api/cuisines") ||
          path.startsWith("/api/categories") ||
          path.startsWith("/api/promotions") ||
          path.startsWith("/auth") ||
          path === "/"
        ) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/restaurant/:path*",
    "/driver/:path*",
    "/orders/:path*",
    "/profile/:path*",
  ],
};


