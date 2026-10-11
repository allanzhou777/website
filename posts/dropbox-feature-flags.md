# Parallel Feature-Flag Evaluation: 60 ms to 3 ms at p99

*October 2026*

At Dropbox, I worked on moving feature-flag evaluation from a legacy in-house system to [GrowthBook](https://www.growthbook.io/). On paper, the move could take p99 from roughly 60 ms to 3 ms. That was the forecast from early measurements and sample flags—not a finished production result—and I want to keep that distinction clear.

Feature flags are easy to describe badly. They sound like booleans: turn a feature on or off. In practice, a flag is often a small rule engine sitting on the request path. By the time a page loads, it may need to answer several questions about the person looking at it before it can decide what to render.

Take a made-up flag named `ff_logo_top_left_premium`. It might choose a logo treatment using country, language, plan tier, and accessibility settings. A different flag might decide whether to show an AI-search control in Dash, based on AI eligibility and subscription state. Each flag needs its own set of attributes. Those attributes can come from different services, caches, or databases, and they do not all return at the same speed.

<figure class="post-visual">
  <img src="images/feature-flag attributes.png" alt="Diagram of one page request fanning out to several attribute sources, which feed multiple independent feature-flag evaluations that complete at different times.">
  <figcaption>Different flags need different attributes. A slow lookup should only hold up the flag that actually needs it.</figcaption>
</figure>

The important dependency is inside a flag: `ff_logo_top_left_premium` cannot finish until it has country, language, plan, and accessibility information. But there is no reason to make an unrelated flag wait on a slow plan-tier lookup if it only needs language and country.

That was the scheduling problem I was trying to fix. The new design treated attribute fetching and flag evaluation as asynchronous work. Start the independent pieces early, keep each flag tied to the attributes it really needs, and return its value as soon as that smaller dependency set is complete. “Run the flags in parallel” is close, but not quite right. The useful unit of parallelism is the graph of attribute lookups, rules, and flag values.

## Why I cared about p99

Feature flags run where product decisions are made, so a slow tail can turn into page-load delay. The legacy p99 was around 60 ms. The 3 ms figure came from early reports and representative flags in the candidate setup after removing unnecessary waiting. It was an estimate for migration planning, not a number I would present as a measured post-rollout outcome.

The comparison mattered because average latency would have hidden the thing I was trying to improve. p99 is the slowest one percent of normal requests—the part that users occasionally feel as a page that inexplicably hesitates. The plan was to cut that tail by about 20×, then validate it against the same request boundary under real traffic.

## A separate PII project

This was my third Dropbox project. An earlier one was a script to reduce PII in feature-flag configuration. PII means **personally identifiable information**. A raw email address inside a targeting rule is the simplest example: someone wants to see a flag immediately, so they add a one-person rule and move on.

That shortcut is more common than it should be. The configuration had broad visibility, and a raw email in a rule is still sensitive even if other identifiers are hashed. I wrote the cleanup around that problem: find the bad patterns, replace or remove the direct identifiers, and get people to update the flags they owned. It became a Sev-2 because privacy failures deserve urgency at a company trusted with people's files.

<figure class="post-visual">
  <img src="images/18 acks.png" alt="A cropped response showing 18 acknowledgements on a separate incident thread.">
  <figcaption>A response thread from the PII work, cropped to exclude the underlying configuration.</figcaption>
</figure>

I liked working on this team because the scope was real. Nearly every Dropbox team uses feature flags to ship, roll back, and learn from changes. A small decision in the flag platform can land in front of a lot of users. One project was about shaving unnecessary waiting out of that path; the other was about making sure the rules inside it were safe to publish and operate. Both made the same point: feature flags are not a side detail. They are production infrastructure.
