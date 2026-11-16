// Global tokens and resets first, so component stylesheets (imported by each component) follow.
import './styles.css'
import { render } from 'preact'
import { App } from './App'
import { followLanguage } from './i18n/t'
import { load, select } from './store'

render(<App />, document.getElementById('root')!)
// The language first, so a first run names its default states in it.
void followLanguage().then(load)

// Browser preview only: `#select=<id>` opens a todo's details (Orca never sets a hash).
const preselect = location.hash.match(/select=([\w-]+)/)?.[1]
if (preselect) setTimeout(() => select(preselect, true), 50)
