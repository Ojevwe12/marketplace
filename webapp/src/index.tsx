import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Router } from 'react-router-dom'
import ModalProvider from 'decentraland-dapps/dist/providers/ModalProvider'
import ToastProvider from 'decentraland-dapps/dist/providers/ToastProvider'
import TranslationProvider from 'decentraland-dapps/dist/providers/TranslationProvider'
import WalletProvider from 'decentraland-dapps/dist/providers/WalletProvider'
import * as modals from './components/Modals'
import { Routes } from './components/Routes'
import { ScrollToTop } from './components/ScrollToTop'
import './modules/analytics/sentry'
import './modules/analytics/track'
import { initStore, createHistory } from './modules/store'
import * as locales from './modules/translation/locales'
import './themes'
import './index.css'

const history = createHistory()
const store = initStore(history)

function main() {
  const component = (
    <Provider store={store}>
      <TranslationProvider locales={Object.keys(locales)}>
        <WalletProvider>
          <Router history={history}>
            <ToastProvider>
              <ModalProvider components={modals}>
                <ScrollToTop />
                <Routes />
              </ModalProvider>
            </ToastProvider>
          </Router>
        </WalletProvider>
      </TranslationProvider>
    </Provider>
  )

  render(component, document.getElementById('root'))
}

main()
