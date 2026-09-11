import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks';
import { setPageOrientation } from './slices/albumSlice';
import { resolvePageOrientation } from '@core/api/pageOrientation';
import type { PageOrientation } from '@core/api/pageOrientation';

export function useAlbumPageOrientation(): PageOrientation {
  const dispatch = useAppDispatch();
  const story = useAppSelector(state => state.album.currentAlbum?.story);
  const style = useAppSelector(state => state.album.currentAlbum?.style);
  const stored = useAppSelector(
    state => state.album.currentAlbum?.pageOrientation,
  );

  useEffect(() => {
    if (stored) return;
    if (!story && !style) return;

    let cancelled = false;
    void resolvePageOrientation({ story, style }).then(orientation => {
      if (!cancelled) dispatch(setPageOrientation(orientation));
    });

    return () => {
      cancelled = true;
    };
  }, [story, style, stored, dispatch]);

  return stored ?? 'vertical';
}
