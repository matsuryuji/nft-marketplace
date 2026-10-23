export type ArtworkCharacter = 'Ape' | 'Nomad' | 'Vessel' | 'Beat'

export type Artwork = {
  path: string
  character: ArtworkCharacter
  width: number
  height: number
}

export const artworks: Artwork[] = [
  { path: '/assets/nfts/emerald-ape.webp', character: 'Ape', width: 500, height: 500 },
  { path: '/assets/nfts/sage-nomad.webp', character: 'Nomad', width: 500, height: 500 },
  { path: '/assets/nfts/neon-vessel.webp', character: 'Vessel', width: 500, height: 500 },
  { path: '/assets/nfts/golden-beat.webp', character: 'Beat', width: 500, height: 500 },
]

export const ARTWORK = { ape: 0, nomad: 1, vessel: 2, beat: 3 } as const
