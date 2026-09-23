import os
from argparse import ArgumentParser
import torch
from pathlib import Path
from tqdm import tqdm

from .networks import VLM
from .dataset import Dataset
from .tools import get_config

parser = ArgumentParser()
parser.add_argument('--config', type=str, default='mapinpaint/config.yaml', help="training configuration")
parser.add_argument('--seed', type=int, default=42, help='manual seed')
parser.add_argument('--wandb', action='store_true', help='use wandb for logging')

args = parser.parse_args()
config = get_config(args.config)

vlm = VLM()
train_dataset = Dataset(data_path=config['train_data_path'],
                        image_shape=config['image_shape'],
                        data_aug=True)

data_path = ["dataset\maps_train_annotated","dataset\maps_eval_annotated"]

for dp in data_path:
    for rot in [0, 90, 180, 270]:
        for x in tqdm(os.listdir(f"{dp}/part_annotated")):
            partial_img, partial_img_raw = train_dataset.crop_img(os.path.join(f"{dp}/part_annotated", x), img_type='belief', rotation=rot)
            embeddings = vlm.forward(partial_img)
            # print(embeddings.shape)
            filename = Path(x).stem
            filepath = f"{dp}/emb2"
            torch.save(embeddings, os.path.join(filepath, filename + '_' + str(rot) + '.pt'))