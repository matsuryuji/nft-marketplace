import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { collectionHandlers } from './collection'
import { favoriteHandlers } from './favorites'
import { homeHandlers } from './home'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

export const handlers = [
  ...authHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...collectionHandlers,
  ...walletHandlers,
  ...profileHandlers,
  ...favoriteHandlers,
  ...homeHandlers,
  ...nftHandlers,
]
