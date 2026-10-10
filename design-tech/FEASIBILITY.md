# Is the browser dot feasible in a day?

**Yes, if the promise is a small companion for selected page content and a few demonstrated pages.** The stronger Design × Tech question is how pointing, placing and pulling change the relationship with a website. Gmail and broad autonomous browsing do not need to be part of that experiment.

The assessments below are engineering estimates for one experienced builder, not implemented or benchmarked capabilities. No browser extension, Gmail connection or booking automation was built in this brief-writing round.

| Capability | Day-one verdict | Exact boundary |
| --- | --- | --- |
| A dot over the current webpage | Good core | User invokes an unpacked Chrome extension; it adds its own overlay to an ordinary HTML page. Demonstrate a small supported set. |
| Notes pinned to a passage | Good core | Store the URL, quoted text and note locally. Re-find an exact unambiguous quote on reload; if it has moved or disappeared, show an unanchored note rather than attach it to unrelated content. |
| Ask about the visible page | Good core | Send only the selected passage or explicitly chosen page sections to one backend model call; display exact supporting text. A page does not gain authority to instruct the assistant to perform other actions. |
| “Is smoking allowed?” | Good example | Quote a stated policy. If the page says nothing, say that. An outdoor terrace is not evidence of a smoking policy. |
| “I want a table for two” | Good handoff | Find/highlight the actual reservation link; let the person follow it. A demo-owned form can show prefill visibly. This does not prove third-party availability lookup, booking completion or receipt handling. |
| One consented Gmail test account | Possible stretch | Cloud project, enabled Gmail API, OAuth client/consent configuration and an eligible test account. Read one known synthetic test message through the API; do not include sending or inbox-wide automation. |
| Gmail for everyone at the event | Poor dependency | Consumer OAuth rollout, scope review and account administration add uncertainty that does not improve the core pointing interaction. |
| Arbitrary websites and booking providers | Outside this MVP | Dynamic pages, inaccessible frames, custom controls and external booking systems need separate support. Being installed in the browser is not universal access. |

## What the Chrome platform actually supports

`activeTab` provides temporary access after the user invokes the extension; access has origin and restricted-page boundaries. With `scripting`, it can inject an overlay into the supported page. This is a good foundation for an intentional “wake the dot here” interaction. It does not imply a permanently watching companion on every site. [Chrome: activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)

Content scripts can inspect and modify the DOM while their JavaScript environment is isolated from the host page. Keep original controls intact beneath a reversible extension-owned layer; allow selection and normal scrolling outside that layer. The first demo should support plain visible text and real links, not screenshots, PDFs, canvas apps or cross-origin booking iframes. [Chrome: content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

Local extension storage is suitable for a few notes without a cloud database. A development extension can be loaded through Chrome's Developer Mode, so a stage demonstration does not require a Web Store launch. [Chrome: storage](https://developer.chrome.com/docs/extensions/reference/api/storage) · [Load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)

## Gmail: technically possible, creatively optional

Google supplies a JavaScript quickstart with a testing-oriented authentication flow. The setup requires a Google Cloud project, Gmail-enabled account and OAuth configuration. Account eligibility and existing configuration here have not been checked. [Gmail quickstart](https://developers.google.com/workspace/gmail/api/quickstart/js)

Gmail's broad read-only scope is classified as restricted. Google documents exceptions for personal and development/testing use, including explicitly listed testers, so a small test demonstration is not categorically blocked by public verification. A public rollout and server processing of restricted data introduce additional review requirements. Testing exceptions do not make every proposed data use acceptable automatically. [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes) · [Restricted-scope verification and exceptions](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)

My timebox: only attempt Gmail after the main dot interaction works; give setup 45 minutes, an internal cut rule rather than an estimate of Google's approval time. If the test message cannot be read by then, stop that branch. A clearly labelled sample email or user-pasted excerpt can demonstrate the interaction. It must not be described as a live Gmail integration.

## The right-sized Dot build

One expressive dot; drag/select a passage; one short grounded question; move to the evidence; leave a note; reopen it. For a restaurant-themed demo, a Book link can be the final handoff. Skip Gmail, email sending, full memory, autonomous booking and arbitrary website navigation until this sequence is delightful.

The minimum backend is one small proxy with a server-held model credential. The model chooses from supplied element IDs and returns a short answer plus quote; application code validates the quote and ID against the supplied page snapshot. It never executes model-generated code. If the call fails, the selected source and notes still work. Label an authored demo response if used.
