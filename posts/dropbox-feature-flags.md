# Parallel Feature-Flag Evaluation: 60 ms to 3 ms at p99

*October 2026*

A feature flag is a runtime decision: should this person see a particular product behavior, and if so, which version? It lets a team ship code separately from turning it on. A flag can gate a rollout, select an experiment variation, or tailor an experience to a user's context.

The interesting part is that the decision is rarely just `true` or `false`. Consider a hypothetical flag named `logo_top_left_premium`. Its rule could depend on a person's country, language, plan tier, and accessibility preference. Another flag—say, whether to show an AI-search control in Dash—might depend on AI eligibility and subscription state. Before a flag can be evaluated, every attribute required by its rule has to be available.

Those inputs can have different owners and response times. One slow attribute should only delay the flags that need it; it should not automatically hold up every other flag on the page.

<figure class="post-visual">
  <img src="images/feature-flag-dependencies.png" alt="Diagram of one page request fanning out to several attribute sources, which feed multiple independent feature-flag evaluations that complete at different times.">
  <figcaption>Flags have different dependency sets. Asynchronous evaluation lets a ready flag return without waiting for an unrelated, slower dependency.</figcaption>
</figure>

## The project

At Dropbox, I worked on migrating feature-flag evaluation from a legacy in-house solution to [GrowthBook](https://www.growthbook.io/), an open-source experimentation and feature-flag platform. The migration created an opportunity to reconsider the request-path architecture instead of treating the old evaluation order as fixed.

The legacy path had a p99 above 50 ms. For migration planning, the working comparison was a p99 reduction from roughly **60 ms to 3 ms**. That is a **prediction**, not a claim that we had already achieved a 3 ms production p99. The estimate came from the existing legacy tail-latency reports plus early measurements of representative flags in the candidate approach.

I am deliberately not reconstructing the exact legacy sequence here: I do not remember every detail well enough to publish it as fact. What mattered for the design was the observed long tail and an avoidable ordering problem in the work around it.

## The bottleneck: dependency-aware scheduling

For a given flag, its evaluation cannot begin until its own required attributes are ready. If `logo_top_left_premium` needs country, language, plan, and accessibility information, it has to wait for all four. That dependency is real.

What is not inherently required is waiting for unrelated flags. A slow plan-tier lookup should not block a flag whose only inputs are language and country. The new design treated eligible fetches and evaluations as asynchronous work: start independent work concurrently, preserve the dependencies within each flag, and make each result available as soon as its own dependency set is complete.

This is more precise than “evaluate feature flags in parallel.” The unit of parallelism is not only the flag. It is the dependency graph made up of attribute lookups, rules, and final flag values.

## Why the measurement focused on p99

Feature flags sit on a page-load path, so the worst normal requests matter more than a comfortable average. p99 asks about the slowest 1% of requests. The legacy p99 was already in the 50+ ms range; the 60 ms number was the planning baseline used for the migration comparison. The 3 ms number was the projected p99 from early reports and representative sample flags after removing unnecessary waiting.

The honest way to state the result is therefore: the new architecture had a projected p99 improvement of about 20×, pending production validation at scale. A complete final measurement would need the same request boundary, comparable traffic, and a production p99 after rollout.

## Related work: reducing PII in flag configuration

This was my third Dropbox project. A separate earlier project was a PII-reduction script for feature-flag configuration. PII means **personally identifiable information**: an email address used in a targeting rule is a simple example. That work was distinct from the latency migration, but it reinforced the same point: feature flags are production infrastructure, not just toggles, and their configuration deserves the same privacy and reliability review as the code they control.

<figure class="post-visual">
  <img src="images/SCR-20261010-ujww.png" alt="A cropped response showing 18 acknowledgements on a separate incident thread.">
  <figcaption>A separate response to the PII-reduction work. No sensitive configuration is shown here.</figcaption>
</figure>

## What I took away

The technical lesson was not merely “use async.” It was to identify the dependencies that are real, refuse to serialize the ones that are not, and make the measurement match the user-visible path. A platform migration can be more than a replacement: it can be a chance to remove old assumptions from the latency budget.
