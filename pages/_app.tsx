import type { AppProps } from 'next/app'

import './globals.css'

function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Component {...pageProps} />
    </div>
  )
}

export default App
