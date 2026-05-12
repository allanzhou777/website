# How Adversarial Attacks Work

*May 2026*

Neural networks are remarkably good at classifying images. They're also remarkably easy to fool.

An **adversarial example** is an input that has been slightly modified — often imperceptibly to a human — so that a neural network misclassifies it with high confidence. The modification isn't random noise; it's carefully computed to exploit the model's decision boundary.

---

## The Basic Idea

Suppose you have an image of a panda. Normally you compute the gradient of the loss with respect to the model's *weights* during training. In an adversarial attack, you instead compute the gradient with respect to the *input pixels*, then take a small step in the direction that increases the loss. The image barely changes visually, but the model now sees something entirely different.

This is the **Fast Gradient Sign Method (FGSM)**, introduced by Goodfellow et al. in 2014:

```
x_adv = x + ε · sign(∇_x L(f(x), y))
```

ε controls the perturbation magnitude. Small ε keeps the attack subtle; larger ε starts to look like visible noise.

## Why Does This Happen?

Neural networks learn high-dimensional, highly non-linear decision boundaries. Tiny, structured perturbations can cross those boundaries. Unlike humans — who rely on shape, context, and semantics — networks latch onto texture and pixel statistics, making them brittle in ways that don't match our intuitions.

## Stronger Attacks

FGSM is a one-step attack. **Projected Gradient Descent (PGD)** iterates: take many small FGSM steps, projecting back into an ε-ball around the original image after each step. This finds much stronger adversarial examples because it explores the local loss landscape more thoroughly.

## Defenses

The most effective defense is **adversarial training**: include adversarial examples in your training data so the model learns to classify them correctly. The tradeoff is a slight drop in accuracy on clean inputs — but it's the most robust approach we have.

I spent over a year on a project building a robust adversarial ResNet18 transfer model for classifying medical images — COVID-19 radiography, breast ultrasounds, and brain tumors. The core challenge was that adversarial robustness in the medical domain matters more than in most settings: a fooled classifier isn't just wrong, it's potentially dangerous.
