export const IMAGE_BASE = 'https://kr.object.ncloudstorage.com/biz02gj'

export function buildImageUrl(path) {
  if (path == null) return ''
  const value = String(path).trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value
  }
  const rel = value.startsWith('/') ? value : `/${value}`
  if (rel.startsWith('/medical/') || rel.startsWith('/learning/')) return rel
  return `${IMAGE_BASE}${rel}`
}
