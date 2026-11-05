/// <reference types="astro/client" />

// Astro 7.3 omits the standard form relationship attribute.
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/rel
// Remove this declaration when Astro includes the native attribute.
declare namespace astroHTML.JSX {
  interface FormHTMLAttributes {
    rel?: string | null | undefined
  }
}
