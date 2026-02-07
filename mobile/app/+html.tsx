import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Web-only: configures the root HTML for every page during static export.
 * Runs in Node.js only; add global <head> elements and PWA/standalone meta here.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="el">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* PWA theme: status bar / browser chrome matches brand */}
        <meta name="theme-color" content="#121212" />
        {/* Apple standalone mode (no URL bar when added to home screen) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Comfort Foods" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
