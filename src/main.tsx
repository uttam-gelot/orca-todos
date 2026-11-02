// Global tokens and resets first, so component stylesheets (imported by each component) follow.
import './styles.css'
import { render } from 'preact'
import { App } from './App'
import { load, select } from './store'

render(<App />, document.getElementById('root')!)
void load()

// Browser preview only: `#select=<id>` opens a todo's details (Orca never sets a hash).
const preselect = location.hash.match(/select=([\w-]+)/)?.[1]
if (preselect) setTimeout(() => select(preselect, true), 50)
