# Making Feature Flags 20× Faster at Dropbox

*October 2026*

Feature flags are small decisions with a large blast radius. When someone opens a page, the product may need to evaluate many flags before it knows which experience to show. That puts flag evaluation directly on the request path.

At Dropbox, I worked on migrating evaluation from a legacy solution to GrowthBook. The visible outcome was a p99 reduction from **60 ms to 3 ms**—a 20× improvement in tail latency.

## The bottleneck was ordering

The old shape of the problem was effectively serial: evaluate flags in an order, then wait for the chain to finish. That creates head-of-line blocking. One slow evaluation near the front delays unrelated evaluations behind it, even if they are already ready to return.

The new approach treats the evaluations as independent work. Start them concurrently, then make each result available as soon as it completes. The request no longer waits for a slow early flag before it can use a fast later one.

## Why p99 matters

Average latency can hide the experience of the slowest requests. p99 asks a stricter question: how bad is the worst 1% of normal traffic? Moving that number from 60 ms to 3 ms removes a source of unpredictable delay from a path that runs every time a user lands on a page.

## The engineering lesson

Parallelism is not automatically a win. It works here because each evaluation can use the same request context and return independently while preserving the feature-flag contract. The job is to identify the true dependencies, run only independent work concurrently, and avoid letting an arbitrary ordering become part of the product's latency budget.

In this case, a migration was also a systems-design opportunity: reshape the work from a queue into a fan-out/fan-in problem, then stop waiting for results that do not depend on one another.
