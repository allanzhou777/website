# Parallel Feature-Flag Evaluation: 60 ms to 3 ms at p99

*October 2026*

At Dropbox, I worked on moving feature-flag evaluation from a legacy in-house system to [GrowthBook](https://www.growthbook.io/). On paper, the move could take p99 from roughly 60 ms to 3 ms. 

At the most basic level, feature flags sound like booleans: turn a feature on or off. In practice, a flag is often a small rule engine sitting on the request path. By the time a page loads, it may need to answer several questions about the person looking at it before it can decide what to render.

Take a theoretical flag named `ff_logo_top_left_premium`. It might choose a logo using country, language, plan tier, and accessibility settings. A different flag might decide whether to show an AI-search control in Dash, based on AI eligibility and subscription state. Each flag needs its own set of attributes. Those attributes can come from different services, caches, or databases, and they do not all return at the same speed.

<figure class="post-visual">
  <img src="images/feature-flag attributes.png" alt="Diagram of one page request fanning out to several attribute sources, which feed multiple independent feature-flag evaluations that complete at different times.">
  <figcaption>Different flags need different attributes. A slow lookup should only hold up the flag that actually needs it.</figcaption>
</figure>

The important dependency is inside a flag: `ff_logo_top_left_premium` cannot finish until it has country, language, plan, and accessibility information. But there is no reason to make an unrelated flag wait on a slow plan-tier lookup if it only needs language and country.

That was the scheduling problem I was trying to fix. The new design treated attribute fetching and flag evaluation as asynchronous work. Begin fetching all the attributes in the beginning, and once you have the attributes' values, keep each flag tied to only the attributes it really needs, and return its value as soon as that smaller dependency set is complete. 

Feature flags run where product decisions are made, so a slow tail can turn into page-load delay. The legacy p99 was around 60 ms. The 3 ms figure came from early reports from a another teammate after testing some initial feature flags. 

## A separate PII project

My second project was a script to reduce PII (Personally identifiable information) in feature-flag configuration. A raw email address inside a targeting rule is the simplest example: someone wants to see a flag immediately, so they add a one-person rule and move on. e.g. turn feature flag on if `email==jdoe@dropbox.com`

That shortcut is more common than it should be. The config file was public, unencrypted, and a raw email in a rule is still sensitive even if other identifiers are hashed. I wrote the cleanup around that problem: find the bad patterns, encrypt or replace or remove the PII, and get people to update the flags they owned. It became a SEV-2 because Dropbox of course is a storage company, and this sort of stuff is taken quite seriously.

<figure class="post-visual">
  <img src="images/18 acks.png" alt="A cropped response showing 18 acknowledgements on a separate incident thread.">
  <figcaption>18 Acks after I create the slack channel for the sev</figcaption>
</figure>

Overall, I enjoyed my work on this platform experimentation team. Nearly every Dropbox team uses feature flags to ship changes. A small decision in the flag platform can land in front of a lot of users (e.g. the CTO, when he mentioned my work on the SEV). One project was about shaving unnecessary waiting out of that path; the other was about making sure the rules inside it were safe to publish and operate. 
