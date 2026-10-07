import os
import random
import time
import shutil
from argparse import ArgumentParser

import numpy as np
import torch
import torch.nn as nn
import torch.backends.cudnn as cudnn
import torchvision.utils as vutils
from torch.utils.tensorboard import SummaryWriter
import wandb

from .trainer import Trainer
from .evaluator import Evaluator
from .dataset import Dataset
from .tools import get_config
from .logger import get_logger

parser = ArgumentParser()
parser.add_argument('--config', type=str, default='mapinpaint/config.yaml', help="training configuration")
parser.add_argument('--seed', type=int, default=42, help='manual seed')
parser.add_argument('--wandb', action='store_true', help='use wandb for logging')


def main():
    args = parser.parse_args()
    config = get_config(args.config)

    # CUDA configuration
    cuda = config['cuda']
    if cuda:
        cudnn.benchmark = True

    # Configure checkpoint path
    checkpoint_path = os.path.join('./checkpoints', config['expname'])
    if not os.path.exists(checkpoint_path):
        os.makedirs(checkpoint_path)
    shutil.copy(args.config, os.path.join(checkpoint_path, os.path.basename(args.config)))
    writer = SummaryWriter(checkpoint_path)
    logger = get_logger(checkpoint_path)    # get logger and configure it at the first call
    # if args.wandb:
    #     wandb.init(project='CogniPlan Inpainting', config=config, name=config['expname'], entity='your_entity',
    #                resume='allow', id=None, notes=None)

    logger.info("Arguments: {}".format(args))
    # Set random seed
    if args.seed is None:
        args.seed = random.randint(1, 10000)
    logger.info("Random seed: {}".format(args.seed))
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    if cuda:
        torch.cuda.manual_seed_all(args.seed)

    # Log the configuration
    logger.info("Configuration: {}".format(config))

    try:
        logger.info("Training on: {}".format(config['train_data_path']))
        train_dataset = Dataset(data_path=config['train_data_path'],
                                image_shape=config['image_shape'],
                                data_aug=True)
        train_loader = torch.utils.data.DataLoader(dataset=train_dataset,
                                                   batch_size=config['batch_size'],
                                                   shuffle=True,
                                                   num_workers=config['num_workers'])

        eval_dataset = Dataset(data_path=config['eval_data_path'],
                               image_shape=config['image_shape'],
                               data_aug=False)
        eval_loader = torch.utils.data.DataLoader(dataset=eval_dataset,
                                                  batch_size=16,
                                                  shuffle=False,
                                                  num_workers=1)

        # Define the trainer and evaluator
        trainer = Trainer(config)
        evaluator = Evaluator(config, trainer.netG, cuda)

        if cuda:
            trainer = nn.parallel.DataParallel(trainer)
            trainer_module = trainer.module
        else:
            trainer_module = trainer

        t = []

        eval_metrics = {'mae': [], 'iou': [], 'f1': []}

        iterable_eval_loader = iter(eval_loader)
        for n in range(len(eval_loader)):
            gt_e, x_e, door_e, mask_e, map_onehot_e, _ = next(iterable_eval_loader)
            if cuda:
                x_e = x_e.cuda()
                door_e = door_e.cuda()
                mask_e = mask_e.cuda()
                gt_e = gt_e.cuda()
                map_onehot_e = map_onehot_e.cuda()
            start = time.time()
            metrics, res_e = evaluator.eval_step(x_e, door_e, mask_e, map_onehot_e, eval_dataset.image_raw_shape,
                                                gt_e, calc_metrics=False)
            t.append(time.time()-start)
            for k, vl in eval_metrics.items():
                vl.append(metrics[k])
            viz_max_out = config['viz_max_out']

            viz_images = torch.stack([x_e[:viz_max_out], res_e[:viz_max_out],
                                        gt_e[:viz_max_out]], dim=1)

            viz_images = viz_images.view(-1, *list(x_e.size())[1:])
            vutils.save_image(viz_images,
                                '%s/eval_%s.png' % (checkpoint_path, n),
                                nrow=3 * 4,
                                normalize=True)
        print("Inference time")
        print(sum(t)/len(t))
        wangb_eval_log = {}
        for k, vl in eval_metrics.items():
            v = np.mean(vl)
            # message += '%s: %.6f ' % (k, v)
            k = 'eval/' + k
            wangb_eval_log[k] = v
            writer.add_scalar(k, v)

    except Exception as e:  # for unexpected error logging
        logger.error("{}".format(e))
        raise e


if __name__ == '__main__':
    main()
