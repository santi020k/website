# Contact handoff

The Work with me intake composes a WhatsApp message in the current document. The
form starts hidden and becomes usable only after its submit handler is attached.
Until then, including when JavaScript is disabled or fails to load, a direct
WhatsApp link remains available alongside the calendar, email, and LinkedIn options.

Opening WhatsApp keeps the form and its draft on screen. The inline retry link
contains the complete composed message and updates when a visitor edits the
fields or topic. It is a normal external link, so it also works if the scripted
popup is blocked. Opening a tab does not prove that a message was sent; the status
asks the visitor to review and send it in WhatsApp.

Drafts are not written to site URLs, browser storage, or the server. Leaving or
reloading the document does not provide a saved-draft guarantee. The retained
`/work-with-me/sent/` URL offers contact options without claiming a successful
handoff. It remains excluded from indexing and the sitemap.

`tests/work-with-me.spec.ts` covers composition, edits and retries, blocked
popups, missing JavaScript, ClientRouter navigation, direct visits to the retained
URL, and light/dark accessibility. The homepage hero tests cover the contact
entry point and the product-specific introduction.
