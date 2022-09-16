import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { Updoot } from '../entities/Updoot';

export const createVoteStatusLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findBy({
        postId: In(keys.map((k) => k.postId)),
        userId: In(keys.map((k) => k.userId)),
      });

      console.log(updoots, 'updoots');

      const updootIdsToUpdoot: Record<string, Updoot> = {};

      updoots.forEach((updoot) => {
        updootIdsToUpdoot[`${updoot.userId} | ${updoot.postId}`] = updoot;
      });

      const data = keys.map(
        (key) => updootIdsToUpdoot[`${key.userId} | ${key.postId}`]
      );

      return data;
    }
  );
