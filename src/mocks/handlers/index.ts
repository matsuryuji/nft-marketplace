import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { homeHandlers } from './home'
import { nftHandlers } from './nfts'

export const handlers = [...authHandlers, ...cartHandlers, ...homeHandlers, ...nftHandlers]
