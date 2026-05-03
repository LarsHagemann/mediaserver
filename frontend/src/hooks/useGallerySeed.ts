import { useCallback, useEffect } from "react";
import {
  selectGallerySeed,
  setGallerySeed,
} from "../app/persistent.slice";
import { useAppDispatch, useAppSelector } from "../app/store";

const generateSeed = () => Math.random().toString(36).slice(2);

/**
 * Returns the current gallery random seed, generating and storing one on first
 * call. Also exposes `reseedGallery()` to replace the seed with a fresh value.
 */
export const useGallerySeed = () => {
  const dispatch = useAppDispatch();
  const seed = useAppSelector(selectGallerySeed);

  useEffect(() => {
    if (!seed) {
      dispatch(setGallerySeed(generateSeed()));
    }
  }, [seed, dispatch]);

  const reseedGallery = useCallback(() => {
    dispatch(setGallerySeed(generateSeed()));
  }, [dispatch]);

  return { seed: seed ?? "", reseedGallery };
};
