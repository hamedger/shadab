import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />

        {/* PWA */}
        <link rel="icon" type="image/png" href="/assets/icon.png" />
        <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#c9a24b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* SEO */}
        <title>Shadab Restaurant & Grill — Authentic Hyderabadi Cuisine, Chicago</title>
        <meta name="description" content="Grand opening Fri, Oct 16 — breakfast, lunch & dinner buffet, open 24 hours. Authentic Hyderabadi, 100% Zabihah Halal. 2309-11 W Devon Ave, Chicago." />

        {/* Open Graph */}
        <meta property="og:title" content="Shadab Restaurant & Grill — Authentic Hyderabadi Cuisine, Chicago" />
        <meta property="og:description" content="Grand opening Fri, Oct 16 — breakfast, lunch & dinner buffet, open 24 hours. Authentic Hyderabadi, 100% Zabihah Halal. 2309-11 W Devon Ave, Chicago." />
        <meta property="og:image" content="https://shadab.io/assets/og-image.jpg" />
        <meta property="og:url" content="https://shadab.io" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shadab Restaurant & Grill — Authentic Hyderabadi Cuisine, Chicago" />
        <meta name="twitter:description" content="Grand opening Fri, Oct 16 — breakfast, lunch & dinner buffet, open 24 hours. Authentic Hyderabadi, 100% Zabihah Halal. 2309-11 W Devon Ave, Chicago." />
        <meta name="twitter:image" content="https://shadab.io/assets/og-image.jpg" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: '#0d2b22' }}>
        {children}
      </body>
    </html>
  )
}
