import type { Metadata } from 'next'
import { Images } from 'lucide-react'

import type { GalleryImage } from '@sfgc/shared'
import { api, safeFetch } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Reveal, RevealGroup, RevealItem } from '@/components/motion/reveal'
import { COLLEGE } from '@/content/college'

export const metadata: Metadata = {
  title: 'Photo gallery',
  description: `Photographs of life at ${COLLEGE.name} — campus, events, festivals and student activities.`,
}

/**
 * Live, so a photograph added in the staff panel appears without a redeploy.
 * Sixty seconds matches the notices and events feeds; a gallery does not need
 * to be fresher than the notices are.
 */
export const revalidate = 60

export default async function GalleryPage() {
  const { items } = await safeFetch(
    () => api.gallery.list({ limit: 100 }),
    // The page must render even with the API asleep or down — an empty gallery
    // is a far better outcome than a 500 on a public marketing site.
    { items: [] as GalleryImage[], meta: { page: 1, limit: 0, total: 0, totalPages: 1 } },
    'gallery.list',
  )

  // Grouped in memory rather than with a query per album: the whole page is one
  // read, and a college gallery is tens of images, not thousands.
  const byAlbum = new Map<string, GalleryImage[]>()
  for (const image of items) {
    const bucket = byAlbum.get(image.album) ?? []
    bucket.push(image)
    byAlbum.set(image.album, bucket)
  }

  return (
    <div className="section">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            Gallery
          </span>
          <h1 className="heading-lg mt-5">Life at {COLLEGE.short}</h1>
          <p className="lede mt-4">
            Campus, celebrations and the everyday — photographs from around the college.
          </p>
        </Reveal>

        {items.length === 0 ? (
          <p className="mx-auto mt-16 max-w-md rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No photographs have been published yet. Please check back soon.
          </p>
        ) : (
          <div className="mt-16 space-y-16">
            {[...byAlbum.entries()].map(([album, images]) => (
              <section key={album}>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="heading-sm">{album}</h2>
                  <Badge variant="outline">
                    {images.length} {images.length === 1 ? 'photo' : 'photos'}
                  </Badge>
                </div>

                <RevealGroup className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {images.map((image) => (
                    <RevealItem key={image.id}>
                      <figure
                        className="group overflow-hidden rounded-2xl border border-border
                                   bg-card shadow-card transition-shadow hover:shadow-lift"
                      >
                        {/* A plain img rather than next/image: these URLs point at
                            whatever host the uploader used, and next/image needs
                            every hostname declared in next.config.mjs up front —
                            which would make adding a photo a code change.
                            loading="lazy" keeps the page light regardless. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.imageUrl}
                          // Empty alt marks the image decorative, which is correct
                          // when nobody wrote a description: a screen reader then
                          // skips it rather than reading out a title that does not
                          // describe the picture.
                          alt={image.altText ?? ''}
                          className="h-56 w-full bg-muted object-cover transition-transform
                                     duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        {image.caption ? (
                          <figcaption className="p-4 text-sm text-muted-foreground">
                            {image.caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    </RevealItem>
                  ))}
                </RevealGroup>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
