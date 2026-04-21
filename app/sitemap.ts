import type { MetadataRoute } from 'next'

/**
 * ekkoee.com sitemap
 *
 * Next.js will serve this at /sitemap.xml automatically.
 * Add new public routes here as they are created.
 * Do NOT include /portal/* or /admin/* routes (private).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://ekkoee.com'
  const now = new Date()

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // TODO: add public routes below as they come online
    // {
    //   url: `${baseUrl}/about`,
    //   lastModified: now,
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
    // {
    //   url: `${baseUrl}/pricing`,
    //   lastModified: now,
    //   changeFrequency: 'monthly',
    //   priority: 0.8,
    // },
  ]
}
