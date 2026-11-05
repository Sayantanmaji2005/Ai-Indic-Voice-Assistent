import { NextResponse } from "next/server";
export async function GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const origin = url.origin;
    if (error || !code) {
        return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent(error || "Authorization cancelled")}`);
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    const redirectUri = `${origin}/api/auth/google/callback`;
    try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            return NextResponse.redirect(`${origin}/?auth_error=token_exchange_failed`);
        }
        // Fetch Google User Profile
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (!profileRes.ok) {
            return NextResponse.redirect(`${origin}/?auth_error=profile_fetch_failed`);
        }
        const profile = await profileRes.json();
        const userData = {
            id: profile.sub,
            name: profile.name || profile.given_name || "Google User",
            email: profile.email,
            avatar: profile.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
            provider: "google",
            locale: profile.locale || "en-IN",
            joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        };
        // Redirect to home with user profile serialized in cookie or query hash
        const response = NextResponse.redirect(`${origin}/?auth_success=1#google_user=${encodeURIComponent(JSON.stringify(userData))}`);
        response.cookies.set("indica_user", JSON.stringify(userData), {
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            sameSite: "lax",
        });
        return response;
    }
    catch {
        return NextResponse.redirect(`${origin}/?auth_error=unknown_error`);
    }
}
