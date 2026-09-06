import React from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles.css'

// Real deploy (Vercel) uses clean URLs via BrowserRouter, matched by
// statically prerendered files per route (see prerender.mjs). The
// "preview" build (a single self-contained HTML file for a live demo
// that has no server to rewrite paths) uses HashRouter instead — same
// app, same routes, just addressed as /#/category/... rather than
// /category/... vite.config.js sets __ROUTER_MODE__ per build mode.
const Router = __ROUTER_MODE__ === 'hash' ? HashRouter : BrowserRouter
const root = document.getElementById('root')

if (root.hasChildNodes()) {
  hydrateRoot(
    root,
    <Router><App /></Router>
  )
} else {
  createRoot(root).render(
    <Router><App /></Router>
  )
}
