import { http, parseResponse } from '@/shared/api/client'
import { profileSchema, type ChangePasswordRequest, type UpdateProfileRequest } from '@/shared/contracts/profile'

export async function fetchProfile(signal?: AbortSignal) {
  const { data } = await http.get('/profile', { signal })
  return parseResponse(profileSchema, data)
}

export async function updateProfile(body: UpdateProfileRequest) {
  const { data } = await http.patch('/profile', body)
  return parseResponse(profileSchema, data)
}

export async function changePassword(body: ChangePasswordRequest) {
  await http.put('/profile/password', body)
}

export async function uploadAvatar(dataUrl: string) {
  const { data } = await http.put('/profile/avatar', { dataUrl })
  return parseResponse(profileSchema, data)
}

export async function removeAvatar() {
  const { data } = await http.delete('/profile/avatar')
  return parseResponse(profileSchema, data)
}
