import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { GoogleAuthModal } from "@/components/google-auth-modal";
export const metadata = {
    title: "Indica — Search in your language | AI Indic Voice Assistant",
    description: "An evidence-led, ultra-fast multilingual Indian voice and search assistant powered by Groq, Tavily, and ElevenLabs.",
};
export default function RootLayout({ children }) {
    return (<html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,600;1,700&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,600&family=Unbounded:wght@700;800;900&family=Syne:wght@700;800;900&family=Righteous&family=Montserrat:wght@800;900&family=Poppins:wght@800;900&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+Bengali:wght@400;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet"/>
        <link rel="icon" href="/indica-icon.png" type="image/png"/>
        <link rel="apple-touch-icon" href="/indica-icon.png"/>
      </head>
      <body>
        <AuthProvider>
          {children}
          <GoogleAuthModal />
        </AuthProvider>
      </body>
    </html>);
}
