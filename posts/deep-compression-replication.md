# Replicating Deep Compression

*October 2026*

I am reproducing the pipeline from Han, Mao, and Dally's 2016 paper, [Deep Compression](https://arxiv.org/abs/1510.00149): magnitude pruning, trained weight sharing, and Huffman coding.

The paper reports 35× compression for AlexNet and 49× for VGG-16 on ImageNet, without reported accuracy loss. Those are the targets to test—not results I am assuming.

The first stage uses LeNet-300-100 on MNIST to verify the mechanics: train a baseline, prune and fine-tune, quantize with trainable centroids, then Huffman-encode the sparse representation. That is a pipeline check, not a substitute for the paper's ImageNet experiments.

The final report will include the architecture, dataset, seed, baseline accuracy, compressed accuracy, raw size, compressed size, and exact environment. If the ImageNet result does not reproduce, I will report the gap and the most plausible sources of mismatch rather than relabel a smaller experiment as success.
