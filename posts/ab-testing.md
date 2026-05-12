# How A/B Tests Work

*May 2026*

A/B testing is one of the most useful tools in a data-driven company's toolkit. The idea is simple: you want to know whether change X improves metric Y. Split your users into two groups — a **control** group (A) that sees the old experience, and a **treatment** group (B) that sees the new one — and measure.

---

## The Setup

The key ingredient is **randomization**. Users are randomly assigned to A or B, which (assuming a large enough sample) ensures the groups are comparable on everything except the treatment. Without randomization, you can't isolate cause and effect.

Once the experiment runs for a fixed window, you compare the metric of interest across groups. Common metrics: click-through rate, conversion, session length, revenue per user.

## When Does a Result Count?

You're looking for **statistical significance** — evidence that the observed difference isn't just noise. The standard threshold is p < 0.05, meaning a less than 5% chance of seeing a gap this large if there were truly no effect. But p-values alone don't tell the whole story: a tiny, statistically significant lift might not be worth shipping.

A more useful framing is **minimum detectable effect (MDE)**: before running the test, decide the smallest lift that would actually matter, then size your experiment so you have enough power to detect it.

## Practical Complications

A few things that make A/B testing hard in practice:

- **Novelty effects** — users behave differently just because something is new, not because it's better.
- **Network effects** — in social or sharing features, one user's assignment can affect another's experience, violating the independence assumption.
- **Multiple comparisons** — if you track many metrics or run many experiments simultaneously, false positives accumulate fast.

---

*Some content in this post draws from work I did during my internship at Dropbox. I'm in the process of getting approval to share those specifics — I'll update this post once I do.*
