'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface BrandImageProps {
  /** Image URLs to try in order, e.g. [uploaded logo from Settings, built-in logo] */
  sources: Array<string | null | undefined>;
  alt: string;
  className?: string;
  /** Shown when every source fails, e.g. the bank's initial */
  fallback?: React.ReactNode;
}

/**
 * Logo image that never shows as broken: if an uploaded image's URL is dead
 * (deleted file, paused storage), it moves on to the next source, and finally
 * renders `fallback`.
 */
export default function BrandImage({ sources, alt, className, fallback = null }: BrandImageProps) {
  const candidates = useMemo(
    () => [...new Set(sources.filter((s): s is string => typeof s === 'string' && s.trim() !== ''))],
    // Re-evaluate when the list of URLs changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sources.join('|')]
  );
  const [index, setIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // A new list (e.g. settings finished loading) starts again from the first source
  useEffect(() => setIndex(0), [candidates]);

  // On server-rendered pages an image can fail before React attaches onError,
  // so also check whether the current image already failed
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth !== 0) return;
    // A zero width can also be a size-less SVG that loaded fine, so confirm with a probe
    let active = true;
    const probe = new Image();
    probe.onerror = () => { if (active) setIndex(i => i + 1); };
    probe.src = img.currentSrc || img.src;
    return () => { active = false; };
  }, [index, candidates]);

  if (index >= candidates.length) return <>{fallback}</>;

  return (
    <img
      ref={imgRef}
      key={candidates[index]}
      src={candidates[index]}
      alt={alt}
      className={className}
      onError={() => setIndex(i => i + 1)}
    />
  );
}
