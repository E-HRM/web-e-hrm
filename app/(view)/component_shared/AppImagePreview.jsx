'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'antd';
import clsx from 'classnames';
import { fontFamily } from './Font';

function mergePreview(preview) {
  if (preview === false) return false;
  if (preview === true || preview == null) return { zIndex: 1600 };
  if (typeof preview === 'object') return { zIndex: 1600, ...preview };
  return preview;
}

function AppImagePreviewBase({
  src,
  alt = 'Image',
  fallback = '/image-not-found.png',

  width,
  height,

  fit = 'contain', // contain | cover
  rounded = 12, // number (px) atau 'full'

  preview = true,
  placeholder,

  className,
  style,
  imgStyle,

  onError,
  ...props
}) {
  const [localSrc, setLocalSrc] = useState(src || '');

  useEffect(() => {
    setLocalSrc(src || '');
  }, [src]);

  const resolvedRadius = useMemo(() => {
    if (rounded === 'full') return 9999;
    if (typeof rounded === 'number') return rounded;
    return 12;
  }, [rounded]);

  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

  const mergedImgStyle = useMemo(
    () => ({
      borderRadius: resolvedRadius,
      objectFit: fit,
      ...(imgStyle || {}),
    }),
    [resolvedRadius, fit, imgStyle]
  );

  const handleError = (e) => {
    setLocalSrc(fallback);
    onError?.(e);
  };

  return (
    <>
      <Image
        {...props}
        src={localSrc || fallback}
        alt={alt}
        width={width}
        height={height}
        fallback={fallback}
        preview={mergePreview(preview)}
        placeholder={placeholder}
        className={clsx('sp-image', className)}
        style={mergedStyle}
        imgStyle={mergedImgStyle}
        onError={handleError}
      />
      <style
        jsx
        global
      >{`
        .sp-image,
        .sp-image * {
          font-family: ${fontFamily} !important;
        }
        .sp-image .ant-image-img {
          background: #f8fafc;
        }
      `}</style>
    </>
  );
}

function AppImagePreviewGroup({ preview = true, style, children, ...props }) {
  const mergedStyle = useMemo(() => ({ fontFamily, ...(style || {}) }), [style]);

  return (
    <div style={mergedStyle}>
      <Image.PreviewGroup
        {...props}
        preview={mergePreview(preview)}
      >
        {children}
      </Image.PreviewGroup>
    </div>
  );
}

const AppImagePreview = Object.assign(AppImagePreviewBase, {
  PreviewGroup: AppImagePreviewGroup,
});

export default AppImagePreview;
