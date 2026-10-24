import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { favoriteHandlers } from './favorites'
import { homeHandlers } from './home'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

export const handlers = [
  ...authHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...walletHandlers,
  ...profileHandlers,
  ...favoriteHandlers,
  ...homeHandlers,
  ...nftHandlers,
]
