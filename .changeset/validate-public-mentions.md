---
"website": patch
---

Validate external Webmention data and URLs before rendering, preserve anonymous
author fallbacks, and prevent avatar dimension lookup failures from breaking builds.
Send Webmention authentication in headers instead of request URLs.
Let the browser handle partial file requests without service-worker cache interception.
