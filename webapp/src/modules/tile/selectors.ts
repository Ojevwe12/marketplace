import { createSelector } from 'reselect'
import { Tile } from '../../components/Atlas/Atlas.types'
import { RootState } from '../reducer'
import { TileState } from './reducer'

export const getState = (state: RootState) => state.tile
export const getTiles = (state: RootState) => getState(state).data
export const getLoading = (state: RootState) => getState(state).loading
export const getError = (state: RootState) => getState(state).error

export const getTilesByEstateId = createSelector<RootState, TileState['data'], Record<string, Tile[]>>(getTiles, tiles => {
  const tilesByEstateId: Record<string, Tile[]> = {}
  for (const tile of Object.values(tiles)) {
    if (tile.estate_id) {
      if (!tilesByEstateId[tile.estate_id]) {
        tilesByEstateId[tile.estate_id] = []
      }
      tilesByEstateId[tile.estate_id].push(tile)
    }
  }
  return tilesByEstateId
})
