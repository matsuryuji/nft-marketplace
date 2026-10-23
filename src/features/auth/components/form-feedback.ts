import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toApiError } from '@/shared/api/errors'

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  const apiError = toApiError(error)
  const matched = fields.filter((field) => apiError.fields[field])
  matched.forEach((field, index) =>
    setError(field, { type: 'server', message: apiError.fields[field] }, { shouldFocus: index === 0 }),
  )
  if (matched.length === 0) setError('root.server' as Path<T>, { type: 'server', message: apiError.message })
}
