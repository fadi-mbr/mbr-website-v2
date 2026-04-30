import { MetadataRoute } from 'next'

/**
 * Sitemap for SEO.
 *
 * Only canonical URLs belong here. Section anchors (#services, #reviews,
 * etc.) are not separate pages; search engines fold fragments into the
 * parent URL and listing them as distinct entries can downgrade trust.
 * When real `/services`, `/team` etc. routes are added, list them here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mbrme.com'
  const lastModified = new Date()

  return [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/cookie-policy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/privacy-policy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
