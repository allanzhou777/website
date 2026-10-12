# Replicating Deep Compression: Benchmarking Inference, Storage, and Latency

*October 2026*

I wanted to see whether I actually understood the model-compression pipeline from Han, Mao, and Dally's 2016 paper, [Deep Compression](https://arxiv.org/abs/1510.00149). The paper is famous for a striking claim: compress AlexNet by 35× and VGG-16 by 49× without reported accuracy loss. I first found it while looking for a final-project topic in my energy-efficient computing class.

The paper's result is on ImageNet-scale models. My first experiment is LeNet-300-100 on MNIST, run locally on CPU. It tests whether I can reproduce the mechanics and separate a storage win from an inference win.

The code and the complete machine-readable result are in [this repository](https://github.com/allanzhou777/deep-compression-replication). This post contains the whole result, too.

## What is being compressed?

Neural-network weights are usually stored as 32-bit floating-point numbers. Floating point gives a model fine-grained precision, but it is expensive to store at scale. Deep Compression reduces that cost in three ways:

1. **Pruning** removes connections whose weights are too small to meaningfully affect the output.
2. **Weight sharing** replaces many distinct surviving values with a small learned codebook of representative values.
3. **Huffman coding** stores common codes in fewer bits than rare ones.

These are distinct techniques, not three names for quantization. Pruning removes connections. Weight sharing reduces the number of bits needed to describe the connections that remain. Huffman coding losslessly packs that already-compressed representation.

The paper's [Figure 1](https://arxiv.org/html/1510.00149v5#S1.F1) shows this three-stage pipeline. I did not copy the figure here; the diagram below is my own explanation of the second step, based on the paper's [weight-sharing figure](https://arxiv.org/html/1510.00149v5#S1.F3).

<figure class="post-visual post-visual--wide">
  <img src="images/deep-compression-weight-sharing.svg" alt="After pruning, surviving weights are clustered into representative centroids, then replaced by five-bit codebook indices. Pruned zeros stay separate from the nonzero codebook.">
  <figcaption>Weight sharing in this replication. A 5-bit index addresses one of 32 learned centroid values. The centroid locations follow the distribution of the surviving nonzero weights; pruning does not imply that there are categorically fewer centroids near zero.</figcaption>
</figure>

In my implementation, the zero weights removed by pruning stay in the sparse mask. K-means clusters only the remaining nonzero weights. With five bits, each layer gets up to 32 representative values. If the surviving values pile up around a region, the learned centroids tend to be closer together there; sparse tails usually receive fewer. This is not a hand-designed nonlinear scale. The clustering learns it from the layer's weights, then the centroids are fine-tuned.

<!-- Optional run figure: add a histogram of your own layer's nonzero weights and learned centroids here.
<figure class="post-visual">
  <img src="images/deep-compression-weight-histogram.png" alt="Histogram of nonzero weights and learned codebook centroids for one layer.">
  <figcaption>One layer after pruning and five-bit clustering.</figcaption>
</figure>
-->

## The experiment

I trained LeNet-300-100 on MNIST for 20 epochs. LeNet is a 7-layer model with roughly 60,000 parameters. I pruned 90% of the linear weights, fine-tuned for five epochs, clustered each layer's nonzero weights into a 5-bit codebook, and fine-tuned the codebook centroids for another five epochs.

One fairness issue showed up immediately. The compressed model receives ten extra epochs of training after the dense baseline. If I compared it only with the 20-epoch baseline, any accuracy difference could come from compression, but it could also come from extra optimization time. So I trained a dense control from the same 20-epoch checkpoint for the same two five-epoch phases. That gives the compressed path something honest to compare against.

This was one run: seed 0, MNIST, macOS arm64 CPU, PyTorch 2.14.1. Repeating it across seeds would make the accuracy claim more defensible. For now, it is evidence that this setup retained similar test accuracy after compression.

| Model | Test accuracy |
| --- | ---: |
| Dense model after 20 epochs | 98.00% |
| Dense control after the matched extra 10 epochs | 97.89% |
| Pruned model | 98.03% |
| Pruned + 5-bit shared weights | 97.99% |

The compressed model finished 0.10 percentage points above the matched dense control. I would not call that an improvement. It is small enough to be noise, and there is only one seed. The reasonable claim is that this particular 90%-sparse, 5-bit model did not pay a meaningful accuracy penalty.

The storage calculation was much more dramatic. The dense linear weights occupied 1,064,800 bytes. The project estimates 28,931.5 bytes for the sparse indices, Huffman-coded cluster assignments, and centroid tables: a **36.8×** reduction.

It lands in the same order of magnitude as the paper's 35× and 49× figures, but it is not a reproduction of them. MNIST and LeNet are not ImageNet and VGG-16, and the code estimates a custom compressed representation rather than a production-ready model format.

<!-- Optional run figure: add a storage-breakdown bar chart here.
<figure class="post-visual">
  <img src="images/deep-compression-storage-breakdown.png" alt="Dense storage compared with sparse indices, codebook indices, and centroids.">
  <figcaption>Where the estimated 36.8× storage reduction comes from.</figcaption>
</figure>
-->

## The part that surprised me: inference latency

I also benchmarked five ways to run the model. Every measurement used batch size one, 500 warm-up iterations, and 5,000 timed CPU iterations. With one already-resident input, this is model forward-pass inference latency: the time to produce one output from the model. It is not end-to-end serving latency, which can also include preprocessing, host-device transfers, batching, queues, and postprocessing.

| Execution path | Mean latency per batch |
| --- | ---: |
| Dense baseline | 0.0222 ms |
| Pruned weights through dense kernels | 0.0221 ms |
| Shared weights decoded on every forward | 0.3237 ms |
| Shared weights decoded once, then dense kernel | 0.0222 ms |
| Shared weights through `torch.sparse.mm` | 0.2212 ms |

The pruned dense model is essentially tied with the original. That makes sense in hindsight: PyTorch's normal dense linear layer still walks over every zero. Pruning changed the values, not the kernel.

The version that reconstructs shared weights every time was about 14.6× slower. It takes the compact codebook representation and expands it back into a dense tensor before every matrix multiply. That is exactly the wrong thing to do if the goal is low latency, but it is useful as a control because it exposes where the cost is coming from.

The generic sparse version was about 10× slower. Sparse matmul has to manage indices and irregular memory access. For a tiny batch-one matrix multiply, that bookkeeping costs more than the multiply-adds it saves. The materialized-dense version is the cleanest check: it uses the exact same shared centroid values, decodes them once before benchmarking, and runs at the baseline's speed. The compression changed storage, not the work done by the dense kernel.

<!-- Optional run figure: add a profiler trace or a simple timing chart here.
<figure class="post-visual">
  <img src="images/deep-compression-inference-breakdown.png" alt="Inference latency breakdown for dense, decoded, and sparse execution paths.">
  <figcaption>Decoding shared weights inside the forward pass dominates this small CPU benchmark.</figcaption>
</figure>
-->

This is the result I wanted from the project. Not a flattering number, but a specific answer. The model can be made much smaller without a visible accuracy hit in this run. My current runtime does not turn that smaller model into a faster one.

## What I would do next

The next step is not to keep tuning MNIST until the table looks better. I would repeat the run across seeds, serialize the custom format for real, and move to AlexNet or VGG-16 with ImageNet-compatible preprocessing. Only then does it make sense to put my numbers beside the paper's.

For inference, the more interesting follow-up is a different runtime: structured sparsity, a fused quantized kernel, or hardware that can use the representation without rebuilding a dense tensor first. Deep Compression is not a magic speedup. It is a reminder to ask what is actually scarce on the system: disk, memory bandwidth, cache capacity, or compute.

For this experiment, storage was scarce on paper. The CPU benchmark made it clear that the runtime was the real bottleneck.
