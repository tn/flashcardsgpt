import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react'

import './globals.css'

function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Component {...pageProps} />
      <Analytics />
    </div>
  )
}

export default App
