import { resolve } from 'node:path';
import {
  getComponentChunkLinks,
  getFontFaceStyles,
  getFontLinks,
  getIconLinks,
  getInitialStyles,
  getLoaderScript,
  getMetaTagsAndIconLinks,
} from '@porsche-design-system/components-js/partials';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const REGEX_HEAD = /<\/head>/;
const REGEX_BODY = /<\/body>/;

const transformIndexHtmlPlugin = () => {
  return {
    name: 'html-transform',
    transformIndexHtml(html) {
      const headPartials = [
        getInitialStyles(),
        getComponentChunkLinks({
          components: ['display', 'text', 'carousel', 'link-tile', 'link-pure', 'link'],
        }),
        getFontFaceStyles(),
        getFontLinks(),
        getIconLinks(),
        getMetaTagsAndIconLinks({
          appTitle: 'Commissions by Porsche Design System',
        }),
      ].join('');

      const bodyPartials = [getLoaderScript()].join('');

      return html.replace(REGEX_HEAD, `${headPartials}$&`).replace(REGEX_BODY, `${bodyPartials}$&`);
    },
  };
};

export default defineConfig({
  base: process.env.BASE_PATH || '',
  root: 'src',
  publicDir: '../public',
  emptyOutDir: true,
  server: {
    host: true,
  },
  build: {
    outDir: '../dist/',
    rollupOptions: {
      input: {
        'sdx26-1': resolve(__dirname, 'src/sdx26/1/index.html'),
        'sdx26-2': resolve(__dirname, 'src/sdx26/2/index.html'),
        'sdx26-3': resolve(__dirname, 'src/sdx26/3/index.html'),
        'landing-page-1': resolve(__dirname, 'src/landing-page/1/index.html'),
        'drive-homepage': resolve(__dirname, 'src/drive-homepage/index.html'),
        'drive-voucher': resolve(__dirname, 'src/drive-voucher/index.html'),
        'ai-assistant-widget': resolve(__dirname, 'src/ai-assistant-widget/index.html'),
        'co-driver': resolve(__dirname, 'src/co-driver/index.html'),
        'admin-panel': resolve(__dirname, 'src/admin-panel/index.html'),
        'shop-checkout': resolve(__dirname, 'src/shop-checkout/index.html'),
        'shop-homepage': resolve(__dirname, 'src/shop-homepage/index.html'),
        'shop-product-list': resolve(__dirname, 'src/shop-product-list/index.html'),
        'shop-product-detail': resolve(__dirname, 'src/shop-product-detail/index.html'),
        'shop-shopping-cart': resolve(__dirname, 'src/shop-shopping-cart/index.html'),
        'model-black-edition': resolve(__dirname, 'src/model-black-edition/index.html'),
      },
    },
  },
  plugins: [transformIndexHtmlPlugin(), tailwindcss()],
});
