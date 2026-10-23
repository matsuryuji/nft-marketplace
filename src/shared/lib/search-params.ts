type SearchValue = string | number | boolean | null | undefined | SearchValue[]

export function parseSearch(searchString: string): Record<string, unknown> {
  const params = new URLSearchParams(searchString.startsWith('?') ? searchString.slice(1) : searchString)
  const result: Record<string, unknown> = {}
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key)
    result[key] = values.length > 1 ? values : values[0]
  }
  return result
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search as Record<string, SearchValue>)) {
    const values = Array.isArray(value) ? value : [value]
    for (const item of values) {
      if (item !== undefined && item !== null && item !== '') params.append(key, String(item))
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}
