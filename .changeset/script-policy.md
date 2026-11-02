---
"website": patch
---

Harden transport and script security. Responses now send `Strict-Transport-Security`, and every
current page carries a script policy that allows only the site's own inline scripts by hash, so
injected inline code no longer runs. Archived versions keep their existing policy.
