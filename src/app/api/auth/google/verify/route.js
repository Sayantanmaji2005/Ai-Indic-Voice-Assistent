import { NextResponse } from "next/server";
export async function POST(req) {
    try {
        const body = await req.json();
        const { credential, accessToken } = body;
        let userProfile = null;
        // Option A: Token from Google OAuth2 Access Token
        if (accessToken) {
            const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (googleRes.ok) {
                const data = await googleRes.json();
                userProfile = {
                    id: data.sub || `google_${Date.now()}`,
                    name: data.name || data.given_name || "Google User",
                    email: data.email,
                    avatar: data.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
                    provider: "google",
                    locale: data.locale || "en-IN",
                    joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                };
            }
        }
        // Option B: Google Credential (JWT ID Token) from Google Identity Services
        if (!userProfile && credential) {
            // Decode JWT payload safely
            const parts = credential.split(".");
            if (parts.length === 3) {
                const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = Buffer.from(payloadBase64, "base64").toString("utf-8");
                const data = JSON.parse(jsonPayload);
                if (data.email) {
                    userProfile = {
                        id: data.sub || `google_${Date.now()}`,
                        name: data.name || data.given_name || "Google User",
                        email: data.email,
                        avatar: data.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
                        provider: "google",
                        locale: data.locale || "en-IN",
                        joinedAt: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
                    };
                }
            }
        }
        if (!userProfile) {
            return NextResponse.json({ error: "Invalid Google credential or access token" }, { status: 400 });
        }
        return NextResponse.json({ success: true, user: userProfile });
    }
    catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to verify Google login" }, { status: 500 });
    }
}
