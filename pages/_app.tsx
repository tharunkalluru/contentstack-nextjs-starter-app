import App from 'next/app';
import Head from 'next/head';
import Router from 'next/router';
import NProgress from 'nprogress';
import Layout from '../components/layout';
import { getHeaderRes, getFooterRes, getAllEntries } from '../helper';
import 'nprogress/nprogress.css';
import '../styles/third-party.css';
import '../styles/style.css';
import 'react-loading-skeleton/dist/skeleton.css';
import '@contentstack/live-preview-utils/dist/main.css';
import { Props } from "../typescript/pages";
import { useEffect } from 'react';

declare global {
  interface Window {
    jstag: any;
    pathfora?: any;
    _pfacfg?: any;
  }
}

// Progress bar events
Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

function MyApp(props: Props) {
  const { Component, pageProps, header, footer, entries } = props;
  const { page, posts, archivePost, blogPost } = pageProps;
  const blogList: any = posts?.concat(archivePost);

  useEffect(() => {
    if (document.querySelector('script[src*="c.lytics.io/api/tag"]')) return;
  
    window.jstag = window.jstag || ({} as any);
    window.jstag._q = window.jstag._q || [];
  
    const methods = ['init', 'loadEntity', 'send', 'call', 'getid', 'setid', 'pageView'];
    methods.forEach((m) => {
      window.jstag[m] = function () {
        window.jstag._q.push([m].concat(Array.prototype.slice.call(arguments, 0)));
      };
    });
  
    const script = document.createElement('script');
    script.src = 'https://c.lytics.io/api/tag/a84fef4e65fe894eecb707074a47c0f2/latest.min.js';
    script.async = true;
  
    script.onload = () => {
      console.log('[Lytics] Script loaded, initializing tag');
  
      window.jstag.init({
        cid: 'a84fef4e65fe894eecb707074a47c0f2',
        loadid: true,
      });
  
      // Optional ready hook
      try {
        window.jstag.call('ready', () => {
          console.log('[Lytics] Ready hook triggered, firing pageView');
          window.jstag.pageView();
        });
      } catch (e) {
        console.warn('[Lytics] call("ready") failed, fallbacking to manual fire', e);
        setTimeout(() => {
          if (window.jstag?.pageView) {
            console.log('[Lytics] Manual pageView fallback fired');
            window.jstag.pageView();
          }
        }, 2000);
      }
    };
  
    document.head.appendChild(script);
  }, []);

  // SPA route change tracking
  useEffect(() => {
    const onRouteChange = () => {
      if (!window.jstag?.pageView) return;

      console.log('[Lytics] Sending SPA routeChange pageView...');
      window.jstag.pageView();

      if (window.pathfora?.clearAll) {
        window.jstag.config.pathfora = window.jstag.config.pathfora || {};
        window.jstag.config.pathfora.publish = {
          candidates: {
            experiences: [],
            variations: [],
            legacyABTests: [],
          },
        };
        window._pfacfg = {};
        window.pathfora.clearAll();
      }

      window.jstag.loadEntity((p: any) => {
        console.log('[Lytics] Profile refreshed:', p?.data);
      });
    };

    Router.events.on('routeChangeComplete', onRouteChange);
    return () => Router.events.off('routeChangeComplete', onRouteChange);
  }, []);

  const metaData = (seo: any) => {
    const metaArr = [];
    for (const key in seo) {
      if (seo.enable_search_indexing) {
        metaArr.push(
          <meta
            name={
              key.includes('meta_')
                ? key.split('meta_')[1].toString()
                : key.toString()
            }
            content={seo[key].toString()}
            key={key}
          />
        );
      }
    }
    return metaArr;
  };

  return (
    <>
      <Head>
        <meta name="application-name" content="Contentstack-Nextjs-Starter-App" />
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1" />
        <meta name="theme-color" content="#317EFB" />
        <title>Contentstack-Nextjs-Starter-App</title>
        {page?.seo && page.seo.enable_search_indexing && metaData(page.seo)}
      </Head>
      <Layout
        header={header}
        footer={footer}
        page={page}
        blogPost={blogPost}
        blogList={blogList}
        entries={entries}
      >
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

MyApp.getInitialProps = async (appContext: any) => {
  const appProps = await App.getInitialProps(appContext);
  const header = await getHeaderRes();
  const footer = await getFooterRes();
  const entries = await getAllEntries();

  return { ...appProps, header, footer, entries };
};

export default MyApp;