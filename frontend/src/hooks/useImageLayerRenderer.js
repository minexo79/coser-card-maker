export const createImageLayerRenderer = () => {
  const imageCache = new Map(); // optional cache（之後可以用）

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      if (!src) return resolve(null);

      // cache 命中
      if (imageCache.has(src)) {
        return resolve(imageCache.get(src));
      }

      const img = new Image();

      img.onload = () => {
        imageCache.set(src, img);
        resolve(img);
      };

      img.onerror = reject;
      img.src = src;
    });
  };

  const render = async ({
    canvas,
    renderTemplate,
    imageDatas,
    imageOffsets
  }) => {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    canvas.width = renderTemplate.canvas.width;
    canvas.height = renderTemplate.canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imageSlots = renderTemplate.imageSlots || [];

    for (const imageSlot of imageSlots) {
      const dayKey = imageSlot?.key;
      const currentImageData = dayKey ? imageDatas[dayKey] : null;
      const currentImageOffset = dayKey ? (imageOffsets[dayKey] ?? 0) : 0;

      if (!currentImageData) continue;

      const userImg = await loadImage(currentImageData);

      if (!userImg || userImg.naturalWidth === 0) continue;

      const imgAspect = userImg.naturalWidth / userImg.naturalHeight;
      const areaAspect = imageSlot.width / imageSlot.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > areaAspect) {
        drawHeight = imageSlot.height;
        drawWidth = drawHeight * imgAspect;

        const offsetPixels =
          ((drawWidth - imageSlot.width) * currentImageOffset) / 100;

        drawX =
          imageSlot.x - (drawWidth - imageSlot.width) / 2 + offsetPixels;
        drawY = imageSlot.y;
      } else {
        drawWidth = imageSlot.width;
        drawHeight = drawWidth / imgAspect;

        drawX = imageSlot.x;
        drawY =
          imageSlot.y - (drawHeight - imageSlot.height) / 2;
      }

      ctx.save();
      ctx.beginPath();

      if (imageSlot.radius)
        ctx.roundRect(
          imageSlot.x, 
          imageSlot.y, 
          imageSlot.width, 
          imageSlot.height, 
          imageSlot.radius
        ); // Create the rounded shape
      else 
        ctx.rect(
          imageSlot.x,
          imageSlot.y,
          imageSlot.width,
          imageSlot.height
        );
        
      ctx.clip();

      ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    }
  };

  return {
    render
  };
};