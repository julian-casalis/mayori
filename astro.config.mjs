import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://julian-casalis.github.io',
  output: 'static',
  adapter: cloudflare()
});