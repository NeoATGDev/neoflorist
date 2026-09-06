import { useEffect } from 'react'

// Sets the document title/description on client-side navigation, so the
// browser tab and any client-only share stay correct after routing.
// The actual crawler-facing <head> for each route is written directly
// into dist/<route>/index.html by prerender.mjs at build time — this
// hook never runs during that SSR pass (useEffect doesn't fire on the
// server), so it can't fight with the baked-in tags.
export function useSeo({ title, description }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      let tag = document.querySelector('meta[name="description"]')
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', 'description')
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', description)
    }
  }, [title, description])
}
