import * as React from 'react';

import { AppProps } from 'next/app';
import Head from 'next/head';
import { Html } from 'next/document';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <style>{`
          @font-face {
            font-family: 'JSArirang-Regular';
            src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/JSArirang-RegularA1.woff') format('woff');
            font-weight: normal;
            font-style: normal;
          }
          html, body, #__next { margin: 0; padding: 0; width: 100%; height: 100%; }
          body {
            background-image: url(/static/imgs/bg.jpg);
            background-position: center;
            background-size: cover;
          }
        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
