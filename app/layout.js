export const metadata = {
  title: 'Cosmic OS',
  description: 'AI-powered cosmic advisor',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
