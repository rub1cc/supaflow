import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Source_Sans_3 } from "next/font/google";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";

import { Toaster } from "sonner";

// If loading a variable font, you don't need to specify the font weight
const mainFont = Source_Sans_3({ subsets: ["latin"] });

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <main className={mainFont.className}>
        <Toaster />
        <Component {...pageProps} />
      </main>
    </SessionContextProvider>
  );
}
