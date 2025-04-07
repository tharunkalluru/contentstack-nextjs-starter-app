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
import { useEffect } from 'react'; // ✅ Required for script injection

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
  
    const w = window as any;
    const jstag = w.jstag = w.jstag || {};
    jstag._q = jstag._q || [];
    jstag.config = {}; // Fixes moarConfig crash
  
    const methods = ['init', 'loadEntity', 'send', 'call', 'getid', 'setid', 'pageView', 'getSegments'];
    methods.forEach((method) => {
      jstag[method] = function () {
        jstag._q.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    });
  
    jstag.init({
      cid: 'a84fef4e65fe894eecb707074a47c0f2',
      loadid: true,
    });
  
    const script = document.createElement('script');
    script.src = 'https://c.lytics.io/api/tag/a84fef4e65fe894eecb707074a47c0f2/latest.min.js';
    script.async = true;
    script.onload = () => {
      console.log('[Lytics] Script loaded');
  
      // ✅ Wait for Lytics tag to be fully ready
      jstag.call('ready', () => {
        console.log('[Lytics] Tag is ready, sending pageView...');
        jstag.pageView(); // ✅ This will trigger /c and /personalize
      });
    };
  
    document.head.appendChild(script);
  }, []);
  
  

  // ✅ SPA route change tracking for Lytics
  useEffect(() => {
    const handleRouteChange = () => {
      if ((window as any).jstag?.pageView) {
        (window as any).jstag.pageView();

        // Optional: Refresh profile after navigation
        (window as any).jstag.loadEntity((profile: any) => {
          console.log('Lytics Profile after route change:', profile?.data);
        });

        // Optional: Clear Pathfora campaigns
        if ((window as any).pathfora) {
          (window as any).jstag.config.pathfora.publish.candidates = {
            experiences: [],
            variations: [],
            legacyABTests: [],
          };
          (window as any)._pfacfg = {};
          (window as any).pathfora.clearAll();
        }
      }
    };

    Router.events.on('routeChangeComplete', handleRouteChange);
    return () => Router.events.off('routeChangeComplete', handleRouteChange);
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
        <meta name='application-name' content='Contentstack-Nextjs-Starter-App' />
        <meta charSet='utf-8' />
        <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
        <meta name='viewport' content='width=device-width,initial-scale=1,minimum-scale=1' />
        <meta name='theme-color' content='#317EFB' />
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
