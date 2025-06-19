import './globals.css'

export const metadata = {
  title: 'Evidencija Radnih Sati - AG Group',
  description: 'Aplikacija za evidenciju radnih sati i kalkulaciju zarada sa intuitivnim kalendar interfejsom',
  keywords: 'evidencija, radni sati, zarada, kalendar, smene, AG Group',
  authors: [{ name: 'AG Group' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Evidencija Sati'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="sr">
      <head>
        {/* PWA Meta tags */}
        <meta name="application-name" content="Evidencija Sati" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Evidencija Sati" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Favicon and icons */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Tailwind CSS */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}