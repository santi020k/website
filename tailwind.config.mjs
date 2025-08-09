/** @type {import('tailwindcss').Config} */
export default {
  // Point to all your component files
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],

  // Add the safelist here
  safelist: [
    {
      pattern: /^astro-/
    }
  ],

  // Your other theme extensions can go here
  theme: {
    extend: {}
  },

  plugins: []
}
