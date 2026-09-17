const imageCache = new Map<string, HTMLImageElement>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0,
  rotation = 0,
  opacity = 1
) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

  // Compute fitted dimensions
  const imgAspect = img.naturalWidth / (img.naturalHeight || 1);
  const targetAspect = w / h;
  let renderW = w;
  let renderH = h;

  if (imgAspect > targetAspect) {
    renderH = w / imgAspect;
  } else {
    renderW = h * imgAspect;
  }

  renderW *= scale;
  renderH *= scale;

  const centerX = x + w / 2 + offsetX;
  const centerY = y + h / 2 + offsetY;

  ctx.translate(centerX, centerY);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
  ctx.restore();
}

/**
 * Removes solid white or detected background from an image on the client side,
 * returning a transparent PNG data URL with smooth antialiased edges.
 */
export function removeImageBackground(
  imageSrc: string,
  tolerance: number = 32
): Promise<string> {
  return new Promise((resolve) => {
    // If it's an SVG data URI, check if it's already vector transparent
    if (imageSrc.startsWith('data:image/svg+xml')) {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample corners and perimeter to estimate background color
        const samples: [number, number, number][] = [];
        const w = canvas.width;
        const h = canvas.height;

        const checkPoints = [
          [0, 0],
          [w - 1, 0],
          [0, h - 1],
          [w - 1, h - 1],
          [Math.floor(w / 2), 0],
          [0, Math.floor(h / 2)],
          [w - 1, Math.floor(h / 2)],
          [Math.floor(w / 2), h - 1],
        ];

        for (const [px, py] of checkPoints) {
          const idx = (py * w + px) * 4;
          if (data[idx + 3] > 40) {
            samples.push([data[idx], data[idx + 1], data[idx + 2]]);
          }
        }

        let bgR = 255;
        let bgG = 255;
        let bgB = 255;

        if (samples.length > 0) {
          bgR = samples.reduce((acc, s) => acc + s[0], 0) / samples.length;
          bgG = samples.reduce((acc, s) => acc + s[1], 0) / samples.length;
          bgB = samples.reduce((acc, s) => acc + s[2], 0) / samples.length;
        }

        const tol = Math.max(16, tolerance);
        const feather = 24;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          // Euclidean color distance from detected background
          const distToBg = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );

          // Distance from pure white (#FFFFFF)
          const distToWhite = Math.sqrt(
            Math.pow(r - 255, 2) + Math.pow(g - 255, 2) + Math.pow(b - 255, 2)
          );

          const effectiveDist = Math.min(distToBg, distToWhite);

          if (effectiveDist < tol) {
            data[i + 3] = 0;
          } else if (effectiveDist < tol + feather) {
            const factor = (effectiveDist - tol) / feather;
            data[i + 3] = Math.round(a * factor);
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Canvas background removal failed:', err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
