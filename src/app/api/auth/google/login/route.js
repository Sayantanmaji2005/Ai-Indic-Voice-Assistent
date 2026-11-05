import { NextResponse } from "next/server";
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (!clientId) {
        return NextResponse.json({
            error: "Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local",
        }, { status: 400 });
    }
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");
    return NextResponse.redirect(googleAuthUrl.toString());
}
