import { authHandlers } from './auth'
import { homeHandlers } from './home'
import { nftHandlers } from './nfts'

export const handlers = [...authHandlers, ...homeHandlers, ...nftHandlers]
