import { connect } from 'react-redux'
import { Dispatch } from 'redux'
import { getIsFavoritesEnabled } from '../../../modules/features/selectors'
import { RootState } from '../../../modules/reducer'
import { goBack } from '../../../modules/routing/actions'
import { MapStateProps, MapDispatchProps } from './OnBack.types'
import OnBack from './OnBack'

const mapState = (state: RootState): MapStateProps => ({
  isFavoritesEnabled: getIsFavoritesEnabled(state)
})

const mapDispatch = (dispatch: Dispatch): MapDispatchProps => ({
  onBack: (location?: string) => dispatch(goBack(location))
})

export default connect(mapState, mapDispatch)(OnBack)