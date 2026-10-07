# When the Image Looks the Same but the Model Changes Its Mind

*May 2026*

An adversarial attack changes an image to make a classifier wrong while keeping the change small enough that a person may not notice it. The key word is **optimized**: this is not ordinary random noise. The attacker uses the model's gradients to find the particular pixel changes that increase its loss.
<!--
<figure class="post-visual">
  <img src="images/adversarial-perturbation.png" alt="Illustration of a subtle structured image perturbation changing a model's decision path while leaving the image visually similar.">
  <figcaption>The perturbation is chosen to move the model across a decision boundary, not to make the image look different.</figcaption>
</figure> -->

## How the attack works

For a classifier *f*, image *x*, and correct label *y*, an attacker differentiates the loss with respect to **the pixels** rather than the model weights. FGSM takes one step in the loss-increasing direction:

```
x_adv = x + ε · sign(∇_x L(f(x), y))
```

The size and shape of the allowed change matter. An **L∞** bound limits the largest change to any pixel; an **L2** bound limits total perturbation energy. Multi-step attacks such as projected gradient descent are stronger because they repeatedly optimize the perturbation while staying inside that allowed region.

## How a model learns to resist it

Adversarial training puts those optimized examples into training. Instead of only learning “classify the original image,” the model learns “classify the hardest nearby image correctly too.” This usually improves resistance within the attack budget it was trained against, but it can cost clean-image accuracy and does not prove safety against every attack.

## What we tested

In [our original project](https://medium.com/@allanzhou777/leveraging-adversarial-attacks-on-resnet18-transfer-model-in-medical-dataset-classification-a96055414492), we fine-tuned every layer of ResNet-18 on COVID-19 radiographs, breast ultrasounds, and brain-tumor scans. We compared ordinary ImageNet initialization with initialization pre-trained for robustness, then evaluated L2, L∞, unconstrained, and random-smooth attacks.

The result was not “robust is always better.” The robust initialization was most consistently stronger on the brain-tumor task; breast-ultrasound results depended on the attack; COVID-radiography results were more mixed. That is the useful lesson: robustness is an empirical property of a model, data distribution, threat model, and attack budget—not a label a model earns once.

The work is promising, but the datasets and model were limited. It is evidence for a direction, not a clinical claim.
