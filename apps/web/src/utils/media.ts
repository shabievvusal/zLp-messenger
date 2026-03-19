/**
 * Normalizes a media attachment URL to the current format (/api/media/file/...).
 *
 * Over time the URL format in the DB has changed:
 *   v1: http://minio:9000/zlp-media/...  ← Docker-internal hostname, inaccessible from browser
 *   v2: /media/zlp-media/...             ← nginx proxy (still works)
 *   v3: /api/media/file/...              ← current (nginx → MinIO rewrite)
 */
export function mediaUrl(url: string | undefined | null): string {
  if (!url) return ''

  // v1: http://minio:9000/zlp-media/{objectPath}  →  /api/media/file/{objectPath}
  const minioInternal = 'http://minio:9000/zlp-media/'
  if (url.startsWith(minioInternal)) {
    return '/api/media/file/' + url.slice(minioInternal.length)
  }

  return url
}
