---
"website": minor
---

RSS and JSON feeds carry each article in full, in English and Spanish, so feed readers and the newsletter's RSS-to-email no longer stop at the summary. The article HTML is trimmed for readers and email: page controls, icons and print-only references are left out, highlighted code becomes plain preformatted text, folded code examples appear once in full, and links and images use absolute URLs. JSON Feed items use `content_html` and keep the description as `summary`.
