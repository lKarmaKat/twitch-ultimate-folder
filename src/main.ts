import { mount } from 'svelte'
// import './app.css'

// import App from './App.svelte'
import DisplayWrapper from './svelte/DisplayWrapper.svelte'
const app = mount(DisplayWrapper, {
  target: document.body!,
})

export default app
