import { Item } from '@dcl/schemas'
import { AssetType } from '../../asset/types'
import {
  fetchFavoritedItemsSuccess,
  unpickItemAsFavoriteSuccess,
  undoUnpickingItemAsFavoriteSuccess
} from '../../favorites/actions'
import {
  fetchItemsRequest,
  fetchItemsSuccess,
  fetchTrendingItemsSuccess
} from '../../item/actions'
import { ItemBrowseOptions } from '../../item/types'
import { fetchNFTsRequest, fetchNFTsSuccess } from '../../nft/actions'
import { NFT, NFTsFetchOptions } from '../../nft/types'
import { browse } from '../../routing/actions'
import { VendorName } from '../../vendor'
import { Section } from '../../vendor/decentraland'
import { setView } from '../actions'
import { View } from '../types'
import { BrowseUIState, INITIAL_STATE, browseReducer } from './reducer'

const assetIds = ['0x0-assetId1', '0x0-assetId2', '0x0-assetId3']

describe('when reducing the action of setting a view', () => {
  const initialState: BrowseUIState = {
    ...INITIAL_STATE,
    view: View.MARKET,
    itemIds: assetIds,
    nftIds: assetIds,
    count: assetIds.length,
    page: 1
  }

  it('should set the view and reset the state and empty the itemIds, nftIds, count and page', () => {
    expect(browseReducer(initialState, setView(View.LISTS))).toEqual({
      ...initialState,
      view: View.LISTS,
      itemIds: [],
      nftIds: [],
      count: undefined,
      page: undefined
    })
  })
})

describe('when reducing the browse action', () => {
  const initialState: BrowseUIState = {
    ...INITIAL_STATE,
    nftIds: assetIds
  }

  describe('when the view is set in the browser options', () => {
    it('should clear the nftIds array in the state', () => {
      expect(browseReducer(initialState, browse({ view: View.LISTS }))).toEqual(
        {
          ...initialState,
          nftIds: []
        }
      )
    })
  })

  describe('when the view is not set in the browser options', () => {
    it('should keep the nftIds', () => {
      expect(browseReducer(initialState, browse({ view: undefined }))).toEqual(
        initialState
      )
    })
  })
})

const fetchRequestActions: [
  string,
  {
    action: typeof fetchNFTsRequest | typeof fetchItemsRequest
    assetType: AssetType
  }
][] = [
  [
    'fetching NFTs',
    {
      action: fetchNFTsRequest,
      assetType: AssetType.NFT
    }
  ],
  [
    'fetching items',
    {
      action: fetchItemsRequest,
      assetType: AssetType.ITEM
    }
  ]
]

describe.each(fetchRequestActions)(
  'when reducing the request action of %s',
  (_, { action, assetType }) => {
    let initialState: BrowseUIState = {
      ...INITIAL_STATE,
      page: 1,
      [`${assetType}Ids`]: assetIds,
      count: assetIds.length
    }

    let fetchOptions: NFTsFetchOptions & ItemBrowseOptions = {
      vendor: VendorName.DECENTRALAND,
      params: { first: 10, skip: 0 },
      view: View.MARKET
    }

    describe('when the view is atlas', () => {
      beforeEach(() => {
        fetchOptions = {
          ...fetchOptions,
          view: View.ATLAS
        }
        initialState = {
          ...initialState,
          view: View.ATLAS
        }
      })

      it('should return the state as it was before', () => {
        expect(browseReducer(initialState, action(fetchOptions))).toEqual(
          initialState
        )
      })
    })

    const views = {
      [AssetType.NFT]: [View.MARKET, View.ACCOUNT, View.CURRENT_ACCOUNT],
      [AssetType.ITEM]: [
        View.MARKET,
        View.ACCOUNT,
        View.CURRENT_ACCOUNT,
        View.LISTS
      ]
    }

    describe.each(views[assetType])(
      'when it is loading more AND view is %s',
      view => {
        beforeEach(() => {
          fetchOptions = {
            ...fetchOptions,
            view,
            page: 2
          }
        })

        describe('and it is the same view', () => {
          beforeEach(() => {
            initialState = {
              ...initialState,
              view
            }
          })
          it(`should keep the ${assetType} ids and clear the count`, () => {
            expect(browseReducer(initialState, action(fetchOptions))).toEqual({
              ...initialState,
              count: undefined
            })
          })
        })

        describe('and it is a different view', () => {
          beforeEach(() => {
            fetchOptions = {
              ...fetchOptions,
              view: 'another view' as View
            }
          })

          it(`should clear the ${assetType} ids and count`, () => {
            expect(browseReducer(initialState, action(fetchOptions))).toEqual({
              ...initialState,
              [`${assetType}Ids`]: [],
              count: undefined
            })
          })
        })
      }
    )
  }
)

describe('when reducing the fetch NFTs success action', () => {
  let initialState: BrowseUIState = { ...INITIAL_STATE }

  let nftsFetchOptions = {
    vendor: VendorName.DECENTRALAND,
    params: { first: 10, skip: 0 }
  } as NFTsFetchOptions
  let nft: NFT
  let nfts: NFT[]

  beforeEach(() => {
    nft = {
      id: '0x0-assetId1',
      vendor: VendorName.DECENTRALAND,
      data: {}
    } as NFT
    nfts = [nft]
  })

  describe('when the timestamp of the action is lower than the last timestamp of the state', () => {
    beforeEach(() => {
      initialState = { ...initialState, lastTimestamp: 2 }
      nftsFetchOptions = {
        ...nftsFetchOptions,
        view: View.ATLAS
      }
    })

    it('should return the state as it was before', () => {
      expect(
        browseReducer(
          initialState,
          fetchNFTsSuccess(nftsFetchOptions, nfts, [], [], [], 1, 1)
        )
      ).toEqual(initialState)
    })
  })

  describe('when the timestamp of the action is greater than the last timestamp of the state', () => {
    let timestamp: number
    let count: number

    beforeEach(() => {
      count = 1
      timestamp = 3
    })

    describe.each([View.MARKET, View.CURRENT_ACCOUNT, View.ACCOUNT])(
      'and the view is %s',
      (view: View) => {
        beforeEach(() => {
          initialState = { ...initialState, lastTimestamp: 2 }
          nftsFetchOptions = {
            ...nftsFetchOptions,
            view
          }
        })

        it('should return the state with the view, the nft ids, the count and the last timestamp that comes in the action payload', () => {
          expect(
            browseReducer(
              initialState,
              fetchNFTsSuccess(
                nftsFetchOptions,
                nfts,
                [],
                [],
                [],
                count,
                timestamp
              )
            )
          ).toEqual({
            ...initialState,
            view,
            nftIds: [nft.id],
            count,
            lastTimestamp: timestamp
          })
        })
      }
    )

    describe('and is loading more results', () => {
      let view: View
      let initialPage: number
      beforeEach(() => {
        view = View.MARKET
        initialPage = 1
        initialState = {
          ...initialState,
          lastTimestamp: 2,
          view,
          page: initialPage,
          nftIds: ['anotherAssetId']
        }
        nftsFetchOptions = {
          ...nftsFetchOptions,
          page: initialPage + 1,
          view
        }
      })

      it('should return the state with the nft ids concatenated with the previous ones, the count, the last timestamp that comes in the action payload and increment the page', () => {
        expect(
          browseReducer(
            initialState,
            fetchNFTsSuccess(
              nftsFetchOptions,
              nfts,
              [],
              [],
              [],
              count,
              timestamp
            )
          )
        ).toEqual({
          ...initialState,
          nftIds: [...initialState.nftIds, nft.id],
          count,
          page: nftsFetchOptions.page,
          lastTimestamp: timestamp
        })
      })
    })

    describe('and the view is no one of the previous ones', () => {
      let view: View

      beforeEach(() => {
        view = View.LISTS
        initialState = {
          ...initialState,
          lastTimestamp: 2
        }
        nftsFetchOptions = {
          ...nftsFetchOptions,
          view
        }
      })

      it('should return the previous state', () => {
        expect(
          browseReducer(
            initialState,
            fetchNFTsSuccess(
              nftsFetchOptions,
              nfts,
              [],
              [],
              [],
              count,
              timestamp
            )
          )
        ).toEqual(initialState)
      })
    })
  })
})

describe('when reducing the success action of fetching trending items', () => {
  const initialState: BrowseUIState = { ...INITIAL_STATE }
  const item = { id: 'itemId1' } as Item

  it('should return a state with the ids of the trending items', () => {
    expect(
      browseReducer(initialState, fetchTrendingItemsSuccess([item]))
    ).toEqual({
      ...initialState,
      itemIds: [item.id]
    })
  })
})

describe('when reducing the success action of fetching favorited items', () => {
  let initialState: BrowseUIState
  let browseOptions: ItemBrowseOptions
  let actionTimestamp: number
  let items: Item[]
  let total: number

  beforeEach(() => {
    total = 1
    items = [
      {
        id: '0x0-assetId1',
        itemId: 'assetId1'
      } as Item
    ]
    initialState = { ...INITIAL_STATE }
    browseOptions = {}
  })

  describe('when the timestamp of the action is lower than the last timestamp of the state', () => {
    beforeEach(() => {
      initialState.lastTimestamp = 2
      actionTimestamp = 1
    })

    it('should return the state as it was before', () => {
      expect(
        browseReducer(
          initialState,
          fetchFavoritedItemsSuccess(
            items,
            {},
            1,
            browseOptions,
            actionTimestamp
          )
        )
      ).toEqual(initialState)
    })
  })

  describe('and the timestamp of the action is greater than the last timestamp of the state', () => {
    beforeEach(() => {
      initialState.lastTimestamp = 2
      actionTimestamp = 3
      initialState.itemIds = ['anItemId']
    })

    describe('and the page being loaded is lower or equal than the one already loaded', () => {
      beforeEach(() => {
        browseOptions = { page: 1 }
        initialState.page = 2
      })

      it('should return a state overwriting the ids and the total of the favorited items', () => {
        expect(
          browseReducer(
            initialState,
            fetchFavoritedItemsSuccess(
              items,
              {},
              total,
              browseOptions,
              actionTimestamp
            )
          )
        ).toEqual({
          ...initialState,
          itemIds: items.map(item => item.id),
          page: 1,
          count: total
        })
      })
    })

    describe('and the page being loaded is greater than the one already loaded', () => {
      beforeEach(() => {
        browseOptions = { page: 2 }
        initialState.page = 1
        initialState.itemIds = ['anotherId']
      })

      it('should return a state where the ids are appended to the new ones and the total of the favorited items and the page updated', () => {
        expect(
          browseReducer(
            initialState,
            fetchFavoritedItemsSuccess(
              items,
              {},
              total,
              browseOptions,
              actionTimestamp
            )
          )
        ).toEqual({
          ...initialState,
          itemIds: [...initialState.itemIds, ...items.map(item => item.id)],
          page: browseOptions.page,
          count: total
        })
      })
    })

    describe("and there's no loaded page in the state", () => {
      beforeEach(() => {
        browseOptions = { page: 1 }
        initialState.page = undefined
      })

      it('should return a state overwriting the ids and the total of the favorited items', () => {
        expect(
          browseReducer(
            initialState,
            fetchFavoritedItemsSuccess(
              items,
              {},
              total,
              browseOptions,
              actionTimestamp
            )
          )
        ).toEqual({
          ...initialState,
          itemIds: items.map(item => item.id),
          page: 1,
          count: total
        })
      })
    })

    describe('and is being forced to load more items', () => {
      beforeEach(() => {
        browseOptions = { page: 30 }
        initialState.page = 1
        initialState.itemIds = ['anotherId']
      })

      it('should return a state where the ids are appended to the new ones and the total of the favorited items updated', () => {
        expect(
          browseReducer(
            initialState,
            fetchFavoritedItemsSuccess(
              items,
              {},
              total,
              browseOptions,
              actionTimestamp,
              true
            )
          )
        ).toEqual({
          ...initialState,
          itemIds: [...initialState.itemIds, ...items.map(item => item.id)],
          count: total
        })
      })
    })
  })
})

describe('when reducing the fetch items success action', () => {
  let initialState: BrowseUIState
  let itemsBrowserOptions: ItemBrowseOptions
  let item: Item
  let items: Item[]

  beforeEach(() => {
    initialState = { ...INITIAL_STATE, lastTimestamp: 2 }
    item = {
      id: '0x0-assetId1',
      itemId: 'assetId1'
    } as Item
    items = [item]
  })

  describe('when the timestamp of the action is lower than the last timestamp of the state', () => {
    beforeEach(() => {
      itemsBrowserOptions = {
        ...itemsBrowserOptions,
        view: View.ATLAS
      }
    })

    it('should return the state as it was before', () => {
      expect(
        browseReducer(
          initialState,
          fetchItemsSuccess(items, items.length, itemsBrowserOptions, 1)
        )
      ).toEqual(initialState)
    })
  })

  describe('when the timestamp of the action is greater than the last timestamp of the state', () => {
    let timestamp: number
    let count: number

    beforeEach(() => {
      count = 1
      timestamp = 3
    })

    describe.each([View.MARKET, View.CURRENT_ACCOUNT, View.ACCOUNT])(
      'and the view is %s',
      view => {
        beforeEach(() => {
          initialState = { ...initialState, lastTimestamp: 2 }
          itemsBrowserOptions = {
            ...itemsBrowserOptions,
            view
          }
        })

        it('should return the state with the view, the item ids, the count and the last timestamp that comes in the action payload', () => {
          expect(
            browseReducer(
              initialState,
              fetchItemsSuccess(items, count, itemsBrowserOptions, timestamp)
            )
          ).toEqual({
            ...initialState,
            view,
            itemIds: [item.id],
            count,
            lastTimestamp: timestamp
          })
        })
      }
    )

    describe('and is loading more results', () => {
      let view: View
      let initialPage

      beforeEach(() => {
        view = View.MARKET
        initialPage = 1
        initialState = {
          ...initialState,
          itemIds: ['anotherAssetId'],
          view,
          page: initialPage
        }
        itemsBrowserOptions = {
          ...itemsBrowserOptions,
          view,
          page: initialPage + 1
        }
      })

      describe('and the section is lists', () => {
        beforeEach(() => {
          itemsBrowserOptions = {
            ...itemsBrowserOptions,
            section: Section.LISTS
          }
        })

        it('should return the state with the item ids concatenated with the previous ones, page and the last timestamp that comes in the action payload', () => {
          expect(
            browseReducer(
              initialState,
              fetchItemsSuccess(items, count, itemsBrowserOptions, timestamp)
            )
          ).toEqual({
            ...initialState,
            itemIds: [...initialState.itemIds, item.id],
            lastTimestamp: timestamp,
            count,
            page: itemsBrowserOptions.page
          })
        })
      })

      describe('and the section is not lists', () => {
        beforeEach(() => {
          itemsBrowserOptions = {
            ...itemsBrowserOptions,
            section: Section.ALL
          }
        })

        it('should return the state with the item ids concatenated with the previous ones, and the count and last timestamp that comes in the action payload', () => {
          expect(
            browseReducer(
              initialState,
              fetchItemsSuccess(items, count, itemsBrowserOptions, timestamp)
            )
          ).toEqual({
            ...initialState,
            itemIds: [...initialState.itemIds, item.id],
            count,
            page: itemsBrowserOptions.page,
            lastTimestamp: timestamp
          })
        })
      })
    })

    describe('and the view is no one of the previous ones', () => {
      let view: View

      beforeEach(() => {
        view = View.HOME_LAND
        itemsBrowserOptions = {
          ...itemsBrowserOptions,
          view
        }
      })

      it('should return the previous state', () => {
        expect(
          browseReducer(
            initialState,
            fetchItemsSuccess(items, count, itemsBrowserOptions, timestamp)
          )
        ).toEqual(initialState)
      })
    })
  })
})

describe('when reducing the action of the success of the unpicking of an item', () => {
  let initialState: BrowseUIState = { ...INITIAL_STATE }

  describe('and the current state has no count', () => {
    beforeEach(() => {
      initialState.count = undefined
    })

    it('should return a state with its count unchanged', () => {
      expect(
        browseReducer(initialState, unpickItemAsFavoriteSuccess({} as Item))
      ).toEqual({
        ...initialState,
        count: undefined
      })
    })
  })

  describe('and the current state has a count', () => {
    beforeEach(() => {
      initialState.count = 1
    })

    it('should return a state with its count reduced', () => {
      expect(
        browseReducer(initialState, unpickItemAsFavoriteSuccess({} as Item))
      ).toEqual({
        ...initialState,
        count: 0
      })
    })
  })
})

describe('when reducing the action of the success of the undo of the unpicking of an item', () => {
  let initialState: BrowseUIState = { ...INITIAL_STATE }

  describe('and the current state has no count', () => {
    beforeEach(() => {
      initialState.count = undefined
    })

    it('should return a state with its count unchanged', () => {
      expect(
        browseReducer(
          initialState,
          undoUnpickingItemAsFavoriteSuccess({} as Item)
        )
      ).toEqual({
        ...initialState,
        count: undefined
      })
    })
  })

  describe('and the current state has a count', () => {
    beforeEach(() => {
      initialState.count = 1
    })

    it('should return a state with its count increased', () => {
      expect(
        browseReducer(
          initialState,
          undoUnpickingItemAsFavoriteSuccess({} as Item)
        )
      ).toEqual({
        ...initialState,
        count: 2
      })
    })
  })
})