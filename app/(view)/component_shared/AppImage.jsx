'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { fontFamily } from './Font';

function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

function isStaticImport(v) {
  return v && typeof v === 'object' && ('src' in v || 'default' in v);
}

function normalizeRatio(ratio) {
  if (!ratio) return undefined;
  if (typeof ratio === 'number') return `${ratio} / 1`;
  if (typeof ratio === 'string') return ratio;
  return undefined;
}

/**
 * AppImage
 *
 * Props utama:
 * - src, alt
 * - width/height atau fill
 * - mode: 'image' | 'background' (default 'image')
 * - fallbackSrc: string
 * - skeleton: boolean (default true)
 * - ratio: CSS aspect-ratio, contoh: '16/9' atau 1.0 (1/1)
 * - rounded: number | 'sm'|'md'|'lg'|'xl'|'2xl'|'full'
 * - fit: 'cover'|'contain'|'fill'|'none'|'scale-down'
 * - position: CSS object-position / background-position
 */
export default function AppImage({
  src,
  alt = '',
  decorative = false,

  mode = 'image', // image | background
  fallbackSrc,

  width,
  height,
  fill,

  sizes,
  priority = false,
  quality,
  loading,
  unoptimized,

  placeholder,
  blurDataURL,

  skeleton = true,

  ratio,
  fit = 'cover',
  position = 'center',

  rounded = 'lg',
  bordered = false,

  className,
  wrapperClassName,
  style,
  wrapperStyle,

  onLoad,
  onError,

  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const resolvedAlt = decorative ? '' : alt;
  const ariaHidden = decorative ? true : undefined;

  const resolvedSrc = useMemo(() => {
    if (!failed) return src;
    if (fallbackSrc) return fallbackSrc;
    return src;
  }, [src, failed, fallbackSrc]);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const radius = useMemo(() => {
    if (typeof rounded === 'number') return `${rounded}px`;
    const map = { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 };
    return `${map[rounded] ?? 16}px`;
  }, [rounded]);

  const aspectRatio = useMemo(() => normalizeRatio(ratio), [ratio]);

  const usesFill = useMemo(() => {
    if (typeof fill === 'boolean') return fill;
    return !(width && height);
  }, [fill, width, height]);

  const mergedWrapperStyle = useMemo(() => {
    const base = {
      position: 'relative',
      width: usesFill ? '100%' : undefined,
      borderRadius: radius,
      overflow: 'hidden',
      ...(bordered ? { border: '1px solid rgba(229,231,235,0.9)' } : null),
      ...(aspectRatio ? { aspectRatio } : null),
      ...(wrapperStyle || {}),
    };

    // kalau fill & tidak ada ratio/height, kasih minHeight biar tidak 0
    if (usesFill && !aspectRatio && !base.height && !base.minHeight) {
      base.minHeight = 120;
    }

    return base;
  }, [usesFill, radius, bordered, aspectRatio, wrapperStyle]);

  const mergedImgStyle = useMemo(() => {
    return {
      objectFit: fit,
      objectPosition: position,
      ...(style || {}),
    };
  }, [fit, position, style]);

  const handleLoad = (e) => {
    setLoaded(true);
    if (typeof onLoad === 'function') onLoad(e);
  };

  const handleError = (e) => {
    setFailed(true);
    if (typeof onError === 'function') onError(e);
  };

  // MODE: background (untuk dekoratif, hindari jadi kandidat LCP)
  if (mode === 'background') {
    const bgUrl = typeof resolvedSrc === 'string' ? resolvedSrc : isStaticImport(resolvedSrc) ? resolvedSrc.src : '';

    return (
      <div
        className={cx('sp-image-wrap', wrapperClassName)}
        style={{
          ...mergedWrapperStyle,
          backgroundImage: bgUrl ? `url('${bgUrl}')` : undefined,
          backgroundSize: fit === 'contain' ? 'contain' : 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: position,
          fontFamily,
        }}
        aria-hidden={ariaHidden}
        {...rest}
      >
        {skeleton && !loaded ? <div className='sp-image-skel' /> : null}
        <img
          src={bgUrl}
          alt=''
          style={{ display: 'none' }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
        <style
          jsx
          global
        >{`
          .sp-image-skel {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.04);
            animation: spPulse 1.2s ease-in-out infinite;
          }
          @keyframes spPulse {
            0% {
              opacity: 0.55;
            }
            50% {
              opacity: 0.25;
            }
            100% {
              opacity: 0.55;
            }
          }
        `}</style>
      </div>
    );
  }

  // MODE: image (next/image)
  return (
    <div
      className={cx('sp-image-wrap', wrapperClassName)}
      style={mergedWrapperStyle}
    >
      {skeleton && !loaded ? <div className='sp-image-skel' /> : null}

      <Image
        {...rest}
        src={resolvedSrc}
        alt={resolvedAlt}
        aria-hidden={ariaHidden}
        fill={usesFill}
        width={usesFill ? undefined : width}
        height={usesFill ? undefined : height}
        sizes={sizes ?? (usesFill ? '100vw' : undefined)}
        priority={priority}
        quality={quality}
        loading={loading ?? (priority ? 'eager' : 'lazy')}
        unoptimized={unoptimized}
        placeholder={placeholder ?? (blurDataURL ? 'blur' : 'empty')}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={cx('sp-image', className)}
        style={mergedImgStyle}
      />

      <style
        jsx
        global
      >{`
        .sp-image-wrap {
          font-family: ${fontFamily} !important;
        }
        .sp-image-skel {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.04);
          animation: spPulse 1.2s ease-in-out infinite;
          z-index: 0;
        }
        .sp-image {
          z-index: 1;
        }
        @keyframes spPulse {
          0% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.25;
          }
          100% {
            opacity: 0.55;
          }
        }
      `}</style>
    </div>
  );
}

export function AppBgImage(props) {
  return (
    <AppImage
      mode='background'
      decorative
      {...props}
    />
  );
}
