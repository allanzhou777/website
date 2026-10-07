# A/B Tests Answer One Question

*May 2025*

Did this change cause a better outcome?

An A/B test answers that question by randomly showing the old experience to one group and the new experience to another. If the groups are large enough, randomization makes them comparable. The difference in their outcomes is then evidence about the change—not just a correlation.

<figure class="post-visual">
  <img src="images/ab-test-randomization.png" alt="Illustration of users being randomly split into two groups that see different page variants before their outcomes are compared.">
  <figcaption>Random assignment is the mechanism that makes the comparison meaningful.</figcaption>
</figure>

## The discipline

Before the test starts, decide three things:

1. **The metric:** what outcome matters—activation, conversion, retention, or something else?
2. **The decision threshold:** what improvement would be meaningful enough to act on?
3. **The sample size:** how many observations are needed to distinguish that improvement from noise?

Statistical significance is not the whole decision. A tiny effect can be statistically convincing and still not be worth the engineering or product cost. Conversely, a promising but uncertain effect may justify a larger follow-up experiment.

The important habit is simple: choose the question and decision rule before seeing the result. That keeps experimentation from turning into a search for a favorable number.
