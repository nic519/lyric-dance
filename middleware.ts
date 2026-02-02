import { NextResponse } from "next/server";

const ignoredPaths = new Set(["/__webpack_hmr", "/@vite/client"]);

export function middleware(request: Request) {
    const url = new URL(request.url);
    if (ignoredPaths.has(url.pathname)) {
        return new Response(null, { status: 204 });
    }
    if (url.pathname.startsWith("/__webpack_hmr/")) {
        return new Response(null, { status: 204 });
    }
    if (url.pathname.startsWith("/@vite/client/")) {
        return new Response(null, { status: 204 });
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/__webpack_hmr/:path*", "/@vite/client/:path*"],
};
