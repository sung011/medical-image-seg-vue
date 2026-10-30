import { API_BASE } from '../../apiBase'

const REGION_IDS = {
  brain: 'brain',
  chest: 'chest',
  abdomen: 'abdomen',
  knee: 'knee',
  뇌: 'brain',
  흉부: 'chest',
  복부: 'abdomen',
  무릎: 'knee'
}

function parsePgArray(value) {
  if (!value || typeof value !== 'string') return []
  const inner = value.replace(/^\{|\}$/g, '').trim()
  if (!inner) return []
  return inner.split(',').map((part) => part.trim()).filter(Boolean)
}

function mapItem(item, index) {
  const en = item.name_en || ''
  const ko = item.name_ko || ''
  const region = REGION_IDS[item.body_part] || ''
  const id = item.id != null
    ? String(item.id)
    : (item.term_id != null ? String(item.term_id) : `${index}-${ko}`)
  return {
    id,
    en,
    ko,
    desc: item.definition_ko || '',
    descEn: item.definition_en || '',
    categories: parsePgArray(item.tags_ko),
    sources: region ? [{ region, type: item.modality || '' }] : []
  }
}

export async function searchGlossary(query, regionLabel) {
  const parts = [(query || '').trim(), (regionLabel || '').trim()].filter(Boolean)
  const q = parts.join(' ')
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  const suffix = params.toString() ? `?${params}` : ''
  const response = await fetch(`${API_BASE}/glossary/search${suffix}`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.ok) {
    throw new Error('용어 사전을 불러오지 못했습니다.')
  }
  return (data.items || []).map(mapItem)
}

export function filterGlossary(terms, { region, type, query, kind }) {
  const q = query.trim().toLowerCase()
  const raw = query.trim()
  return terms.filter((term) => {
    const matchRegion = region === 'all' || term.sources.some((source) => source.region === region)
    const matchType = type === 'all' || term.sources.some((source) => {
      const sameType = source.type === type
      const sameRegion = region === 'all' || source.region === region
      return sameType && sameRegion
    })
    const matchName = term.en.toLowerCase().includes(q) || term.ko.includes(raw)
    const matchSymptom =
      term.desc.toLowerCase().includes(q) ||
      term.desc.includes(raw) ||
      term.descEn.toLowerCase().includes(q)
    const mode = kind === 'term' || kind === 'symptom' ? kind : 'all'
    const matchQuery =
      !q ||
      (mode === 'term' && matchName) ||
      (mode === 'symptom' && matchSymptom) ||
      (mode === 'all' && (matchName || matchSymptom))
    return matchRegion && matchType && matchQuery
  })
}

export function relatedTerms(terms, term, limit = 6) {
  if (!term || !term.categories.length) return []
  return terms
    .filter((item) => item.id !== term.id && item.categories.some((tag) => term.categories.includes(tag)))
    .slice(0, limit)
}

export function studyTarget(term, region, type) {
  if (!term || !term.sources.length) return null
  return (
    term.sources.find((source) => {
      const sameRegion = region === 'all' || source.region === region
      const sameType = type === 'all' || source.type === type
      return sameRegion && sameType
    }) || term.sources[0]
  )
}
