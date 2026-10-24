import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { privateKeys, sessionKeys, useSession } from '@/features/auth/session'
import type { Session } from '@/shared/contracts/auth'
import type { Profile } from '@/shared/contracts/profile'
import { changePassword, fetchProfile, removeAvatar, updateProfile, uploadAvatar } from './api'

export const profileKey = (userId: string) => [...privateKeys.user(userId), 'profile'] as const

export const profileQuery = (userId: string) =>
  queryOptions({ queryKey: profileKey(userId), queryFn: ({ signal }) => fetchProfile(signal), staleTime: 60_000 })

export function useProfile() {
  const { user } = useSession()
  return useQuery({ ...profileQuery(user?.id ?? ''), enabled: Boolean(user) })
}

function useStoreProfile() {
  const queryClient = useQueryClient()
  return (profile: Profile) => {
    queryClient.setQueryData(profileKey(profile.id), profile)
    queryClient.setQueryData<Session | null>(sessionKeys.current(), (session) =>
      session
        ? {
            ...session,
            user: {
              id: profile.id,
              username: profile.username,
              displayName: profile.displayName,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
            },
          }
        : session,
    )
  }
}

export function useUpdateProfile() {
  const store = useStoreProfile()
  return useMutation({ mutationFn: updateProfile, onSuccess: store })
}

export function useAvatarMutations() {
  const store = useStoreProfile()
  return {
    upload: useMutation({ mutationFn: uploadAvatar, onSuccess: store }),
    remove: useMutation({ mutationFn: removeAvatar, onSuccess: store }),
  }
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}
