import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = env.VITE_SITE_URL || process.env.URL || ''
  const verificationToken = env.VITE_GOOGLE_SITE_VERIFICATION
  const seoHeadTags = {
    name: 'roomly-seo-head-tags',
    transformIndexHtml() {
      const tags = []
      if (siteUrl) {
        tags.push({
          tag: 'link',
          attrs: { rel: 'canonical', href: `${new URL(siteUrl).origin}/` },
          injectTo: 'head',
        })
      }
      if (verificationToken) {
        tags.push({
          tag: 'meta',
          attrs: { name: 'google-site-verification', content: verificationToken },
          injectTo: 'head',
        })
      }
      return tags
    },
  }

  return {
    plugins: [react(), seoHeadTags],
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    },
    server: {
      port: 5173,
      strictPort: false,
    },
  }
})
