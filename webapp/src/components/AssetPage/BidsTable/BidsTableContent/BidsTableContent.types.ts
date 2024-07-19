import { Bid, BidSortBy } from '@dcl/schemas'
import { Asset } from '../../../../modules/asset/types'

export type Props = {
  address?: string
  asset: Asset
  isBidsOffchainEnabled: boolean
  onAccept: (bid: Bid) => void
  isAcceptingBid: boolean
  sortBy: BidSortBy
}

export type MapStateProps = Pick<Props, 'isBidsOffchainEnabled' | 'address' | 'isAcceptingBid'>
export type MapDispatchProps = Pick<Props, 'onAccept'>
