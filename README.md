# Semantic-Aware Predictive Mapping for Exploration and Navigation

Code accompanying **“Semantic-Aware Predictive Mapping for Exploration and Navigation”**, accepted at **IEEE TENCON 2026**.

**Authors:** Kenneth J. K. Ong and William W. J. Teo

**Project Page:** [https://ai-da-stc.github.io/semantic-aware-predictive-mapping-tencon/](https://ai-da-stc.github.io/semantic-aware-predictive-mapping-tencon/)  
**arXiv:** [https://arxiv.org/abs/2610.10382](https://arxiv.org/abs/2610.10382)

This repository contains the predictive map-inpainting implementation used to compare a **semantic-aware model** against a **geometry-only control**. The implementation builds on the predictive mapping / inpainting formulation used by CogniPlan.

> This README documents the `main` and `control` branches only. The GitHub Pages branch is intentionally excluded.

---

## Branches

The experiment is split across two branches:

| Branch | Model | Door semantic input |
|---|---|---:|
| [`main`](https://github.com/AI-DA-STC/semantic-aware-predictive-mapping-tencon/tree/main) | Semantic-aware model | Yes |
| [`control`](https://github.com/AI-DA-STC/semantic-aware-predictive-mapping-tencon/tree/control) | Geometry-only control | No |

### `main`: semantic-aware model

The generator receives the occupancy observation together with:

- the map-type one-hot vector,
- the unknown-space mask, and
- an explicit **door semantic mask**.

In `mapinpaint/networks.py`, the first convolution therefore uses:

```python
self.conv1 = gen_conv(input_dim + 5, cnum, 5, 1, 2)
```

and the input is formed as:

```python
torch.cat([image, onehot_expanded, door, mask], dim=1)
```

### `control`: geometry-only model

The control branch uses the same overall architecture and data pipeline, but the door semantic mask is **not supplied to the generator**.

Its first convolution uses:

```python
self.conv1 = gen_conv(input_dim + 4, cnum, 5, 1, 2)
```

with:

```python
torch.cat([image, onehot_expanded, mask], dim=1)
```

This is the primary code-level distinction between the current `main` and `control` branches.

---

## Repository Structure

```text
semantic-aware-predictive-mapping-tencon/
├── .gitignore
└── mapinpaint/
    ├── __init__.py
    ├── config.yaml
    ├── dataset.py
    ├── eval.py
    ├── evaluator.py
    ├── logger.py
    ├── networks.py
    ├── prepare_dataset.py
    ├── tools.py
    ├── train.py
    └── trainer.py
```

The `dataset/` and `checkpoints/` directories are intentionally excluded from version control.

---

## Dataset Layout

The dataset loader expects each dataset split to contain:

```text
dataset/
├── maps_train_2/
│   ├── full/
│   ├── part/
│   └── door/
└── maps_eval/
    ├── full/
    ├── part/
    └── door/
```

where:

- `full/` contains complete ground-truth occupancy maps;
- `part/` contains partial occupancy observations;
- `door/` contains the corresponding door annotations / semantic masks.

The partial-map filenames are used to associate each observation with its full map and door mask.

The current loader also assigns a map-type conditioning vector according to filenames containing:

```text
room
tunnel
outdoor
```

---

## Requirements

The current code imports the following main Python packages:

```text
torch
torchvision
numpy
Pillow
PyYAML
scipy
pandas
opencv-python
tensorboard
wandb
```

A CUDA-enabled PyTorch installation is required when:

```yaml
cuda: True
```

in `mapinpaint/config.yaml`.

---

## Configuration

Training parameters are defined in:

```text
mapinpaint/config.yaml
```

The currently committed configuration includes:

```yaml
train_data_path: ./dataset/maps_train_2
eval_data_path: ./dataset/maps_eval

batch_size: 1
warmup_iter: 10000
niter: 100000

lr: 0.0001
n_critic: 5

image_shape: [256, 256, 1]
```

Adjust these values as required for your dataset and hardware.

---

## Training

Clone the repository:

```bash
git clone https://github.com/AI-DA-STC/semantic-aware-predictive-mapping-tencon.git
cd semantic-aware-predictive-mapping-tencon
```

### Semantic-aware model

Use the `main` branch:

```bash
git checkout main
python -m mapinpaint.train --config mapinpaint/config.yaml
```

### Geometry-only control

Use the `control` branch:

```bash
git checkout control
python -m mapinpaint.train --config mapinpaint/config.yaml
```

Optional Weights & Biases logging can be enabled with:

```bash
python -m mapinpaint.train \
    --config mapinpaint/config.yaml \
    --wandb
```

Checkpoints and TensorBoard logs are written under:

```text
checkpoints/<expname>/
```

By default:

```text
checkpoints/wgan_inpainting_door/
```

---

## Evaluation

Evaluation utilities are provided in:

```text
mapinpaint/eval.py
mapinpaint/evaluator.py
```

The evaluator supports:

- L1 / MAE,
- Intersection over Union (IoU), and
- F1 score.

It also includes masked evaluation around annotated door regions.

The current evaluation scripts contain experiment-specific checkpoint/configuration assumptions. Before running them on a new machine, set the checkpoint path and evaluation dataset path to the model you want to evaluate.

---

## Method Summary

The model predicts unseen occupancy from a partially observed map.

The central comparison is whether explicit semantic information about doors changes the inferred geometry behind regions that are ambiguous from occupancy alone.

A door and a wall can occupy similar cells geometrically, while implying different spatial connectivity. The semantic-aware branch supplies that distinction explicitly; the control branch does not.

---

## CogniPlan

This implementation is based on the predictive mapping / map-inpainting framework used in **CogniPlan**:

> Y. Wang, H. He, J. Liang, Y. Cao, R. Chakraborty, and G. Sartoretti,  
> **“CogniPlan: Uncertainty-Guided Path Planning with Conditional Generative Layout Prediction,”** 2025.  
> https://arxiv.org/abs/2508.03027

Please also cite CogniPlan when using code derived from its predictive mapping implementation.

---

## Citation

If you use this repository or the associated work, please cite:

```bibtex
@inproceedings{ong2026semantic,
  title     = {Semantic-Aware Predictive Mapping for Exploration and Navigation},
  author    = {Ong, Kenneth J. K. and Teo, William W. J.},
  booktitle = {2026 IEEE Region 10 Conference (TENCON)},
  year      = {2026}
}
```

The DOI can be added once the final IEEE Xplore record is available.

---

## Notes on Reproducibility

The repository contains the model and training/evaluation code used for the semantic-aware and geometry-only control experiments.
