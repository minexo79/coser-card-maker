import { useState, useCallback, useRef, useMemo } from 'react';
import { useQRCode } from './useQRCode';
import { CARD_TEMPLATES, ASPECT_RATIOS, DEFAULT_ASPECT_RATIO } from '../models/cardTemplates.js';

// return YYYY-MM-DD format string for today, used as default date value in date input.
const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse day keys (for example d1, d2, d10) into numeric indexes.
const getDayIndexFromKey = (dayKey) => {
  const match = /^d(\d+)$/i.exec(dayKey || '');
  if (!match) return Number.POSITIVE_INFINITY;
  return Number.parseInt(match[1], 10);
};

// Build template lookup by day count so future templates can plug in directly.
const buildTemplateConfig = () => {
  const entries = Object.entries(CARD_TEMPLATES)
    .map(([key, template]) => ({
      key,
      template,
      slotCount: template?.imageSlots?.length || 0
    }))
    .filter((entry) => entry.slotCount > 0)
    .sort((a, b) => a.slotCount - b.slotCount);

  const templateByDayCount = {};
  entries.forEach((entry) => {
    templateByDayCount[entry.slotCount] = entry.template;
  });

  const supportedDayCounts = Object.keys(templateByDayCount)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  return {
    entries,
    templateByDayCount,
    supportedDayCounts
  };
};

// Build per-day state objects from dynamic day keys.
const createStateByDayKeys = (dayKeys, valueFactory) => {
  return dayKeys.reduce((acc, dayKey) => {
    acc[dayKey] = valueFactory(dayKey);
    return acc;
  }, {});
};

export const useCardMaker = () => {
  // Build template config once and reuse it across renders.
  const templateConfig = useMemo(() => buildTemplateConfig(), []);
  const defaultDayCount = templateConfig.supportedDayCounts[0] || 1;

  // Collect all day keys from all templates to keep state shape consistent.
  const allDayKeys = useMemo(() => {
    const keys = new Set();
    templateConfig.entries.forEach((entry) => {
      (entry.template.imageSlots || []).forEach((slot) => {
        if (slot?.key) {
          keys.add(slot.key);
        }
      });
    });

    if (keys.size === 0) {
      keys.add('d1');
    }

    return Array.from(keys).sort((a, b) => getDayIndexFromKey(a) - getDayIndexFromKey(b));
  }, [templateConfig.entries]);

  const supportedDayCounts = templateConfig.supportedDayCounts;

  const [sharedFormData, setSharedFormData] = useState({
    title: '',
    nickname: '',
    message: '',
    category: 'COSER',
    showQRCode: true,
    websiteUrl: ''
  });

  const [dayDetails, setDayDetails] = useState(() =>
    createStateByDayKeys(allDayKeys, () => ({ date: '', cosrole: '' }))
  );

  const [imageDatas, setImageDatas] = useState(() =>
    createStateByDayKeys(allDayKeys, () => null)
  );

  const [imageOffsets, setImageOffsets] = useState(() =>
    createStateByDayKeys(allDayKeys, () => ({ x: 0, y: 0 }))
  );

  // Normalize user-selected day count to a supported template day count.
  const normalizeDayCount = useCallback(
    (requestedDayCount) => {
      if (supportedDayCounts.length === 0) return defaultDayCount;
      const value = Number.parseInt(requestedDayCount, 10);
      if (supportedDayCounts.includes(value)) return value;

      const fallback = [...supportedDayCounts]
        .reverse()
        .find((count) => count <= value);

      return fallback || supportedDayCounts[0];
    },
    [defaultDayCount, supportedDayCounts]
  );

  const [dayCount, setDayCountState] = useState(defaultDayCount);
  const setDayCount = useCallback(
    (requestedDayCount) => {
      setDayCountState(normalizeDayCount(requestedDayCount));
    },
    [normalizeDayCount]
  );

  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);

  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { generateQRCodeCanvas } = useQRCode();
  const canvasRef = useRef(null);
  
  // Refs for render debouncing and render lock.
  const renderTimeoutRef = useRef(null);
  const lastRenderDataRef = useRef(null);
  const isRenderingRef = useRef(false);

  const getCurrentTemplate = useCallback(() => {
    // Resolve template by day count. Fall back safely to default then 1p.
    return templateConfig.templateByDayCount[dayCount]
      || templateConfig.templateByDayCount[defaultDayCount]
      || CARD_TEMPLATES['1p'];
  }, [dayCount, defaultDayCount, templateConfig.templateByDayCount]);

  const addDaysToDate = useCallback((dateValue, days) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, []);

  const updateDayDetail = useCallback((dayKey, field, value) => {
    if (dayKey === 'd1' && field === 'date') {
      // Use d1 as start date and auto-fill later days as consecutive dates.
      setDayDetails((prev) => ({
        ...prev,
        ...allDayKeys.reduce((acc, key) => {
          const dayIndex = getDayIndexFromKey(key);
          const offsetDays = Number.isFinite(dayIndex) ? Math.max(dayIndex - 1, 0) : 0;
          acc[key] = {
            ...(prev[key] || {}),
            date: addDaysToDate(value, offsetDays)
          };
          return acc;
        }, {})
      }));
      return;
    }

    setDayDetails((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value
      }
    }));
  }, [addDaysToDate, allDayKeys]);

  // Stable serialized snapshot for render change detection.
  const formDataString = useMemo(() => {
    return JSON.stringify({
      title: sharedFormData.title || '',
      nickname: sharedFormData.nickname || '',
      message: sharedFormData.message || '',
      category: sharedFormData.category || '',
      showQRCode: sharedFormData.showQRCode,
      websiteUrl: sharedFormData.websiteUrl || '',
      dayCount,
      aspectRatio,
      dayDetails,
      imageDatas,
      imageOffsets
    });
  }, [sharedFormData, dayCount, aspectRatio, dayDetails, imageDatas, imageOffsets]);

  // Backward-compatible flat form data for legacy UI consumers.
  const formData = useMemo(() => {
    return {
      ...sharedFormData,
      date: dayDetails.d1?.date || '',
      cosrole: dayDetails.d1?.cosrole || ''
    };
  }, [sharedFormData, dayDetails]);

  const updateFormData = useCallback((field, value) => {
    if (field === 'date' || field === 'cosrole') {
      updateDayDetail('d1', field, value);
      return;
    }

    setSharedFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, [updateDayDetail]);

  // Update 2D offset for a day slot (values in template pixel space).
  const updateImageOffset = useCallback((dayKey, x, y) => {
    setImageOffsets((prev) => ({
      ...prev,
      [dayKey]: { x, y }
    }));
  }, []);

  const handleImageUpload = useCallback((file, dayKey = 'd1') => {
    if (file) {
      const maxSize = getCurrentTemplate().upload.maxFileSizeBytes;
      if (file.size > maxSize) {
        alert('Image is too large. Please upload a file smaller than 5MB.');
        return;
      }
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageDatas((prev) => ({
            ...prev,
            [dayKey]: e.target.result
          }));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Failed to read uploaded file:', error);
        alert('Failed to read image file. Please try again.');
      };
      
      reader.readAsDataURL(file);
    }
  }, [getCurrentTemplate]);

  const formatDateToMMDD = useCallback((dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }, []);

  // Stretch-fill transform: per-axis scale to map template coords → output canvas coords.
  const slotTransform = useMemo(() => {
    const template = getCurrentTemplate();
    const templateW = template?.canvas?.width || 0;
    const templateH = template?.canvas?.height || 0;
    if (!templateW || !templateH) return { scaleX: 1, scaleY: 1 };
    const ratioConfig = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS[DEFAULT_ASPECT_RATIO];
    const outputW = templateW;
    const outputH = Math.round(templateW * ratioConfig.heightRatio / ratioConfig.widthRatio);
    return { scaleX: outputW / templateW, scaleY: outputH / templateH };
  }, [aspectRatio, getCurrentTemplate]);

  // Render canvas with lock and cache checks to avoid duplicate work.
  // Pass { silent: true } to skip the loading indicator (e.g. after drag-end).
  const renderCanvas = useCallback(async ({ silent = false } = {}) => {
    if (!canvasRef.current) return null;

    // If canvas config is incomplete, fall back to 1p to avoid render failure.
    const template = getCurrentTemplate();
    const hasCanvasConfig = Number.isFinite(template?.canvas?.width) && Number.isFinite(template?.canvas?.height);
    const renderTemplate = hasCanvasConfig ? template : CARD_TEMPLATES['1p'];
    const imageSlots = renderTemplate.imageSlots || [];
    
    // Skip if another render is in progress.
    if (isRenderingRef.current) {
      console.log('Canvas is already rendering. Skip this request.');
      return null;
    }
    
    // Build snapshot for lightweight render dedupe.
    const currentDataSnapshot = formDataString;
    
    // Skip when data has not changed.
    if (lastRenderDataRef.current === currentDataSnapshot) {
      console.log('Render data unchanged. Skip render.');
      return null;
    }
    
    // Set render lock.
    isRenderingRef.current = true;
    lastRenderDataRef.current = currentDataSnapshot;
    
    if (!silent) setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;

      // Calculate output canvas size based on selected aspect ratio.
      const templateW = renderTemplate.canvas.width;
      const templateH = renderTemplate.canvas.height;
      const ratioConfig = ASPECT_RATIOS[aspectRatio] || ASPECT_RATIOS[DEFAULT_ASPECT_RATIO];
      const outputW = templateW;
      const outputH = Math.round(templateW * ratioConfig.heightRatio / ratioConfig.widthRatio);

      // Draw everything on an offscreen canvas first so the visible canvas
      // is only updated once (prevents blank-flash between clear and draw).
      const offscreen = document.createElement('canvas');
      offscreen.width = outputW;
      offscreen.height = outputH;
      const ctx = offscreen.getContext('2d');

      // Stretch-fill: independent X/Y scale, base image fills canvas exactly (no crop, allows distortion).
      const scaleX = outputW / templateW;
      const scaleY = outputH / templateH;
      const tx  = (x) => x * scaleX;
      const ty  = (y) => y * scaleY;
      const tsX = (w) => w * scaleX;
      const tsY = (h) => h * scaleY;
      const ts  = (s) => s * Math.min(scaleX, scaleY); // uniform scale for font sizes

      // Load base image.
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = () => {
          console.error('Base image failed to load. Check image asset path.');
          reject(new Error('Failed to load base image. Please try again later.'));
        };
        baseImg.src = renderTemplate.baseImagePath || '/img/card_base.png';
      });

      console.log('Base image loaded.');

      // Draw base image stretched to fill output canvas exactly (no bars, no crop).
      ctx.drawImage(baseImg, 0, 0, outputW, outputH);

      // Draw all user image slots based on current template.
      for (const imageSlot of imageSlots) {
        const dayKey = imageSlot?.key;
        const currentImageData = dayKey ? imageDatas[dayKey] : null;
        const rawOffset = dayKey ? (imageOffsets[dayKey] ?? { x: 0, y: 0 }) : { x: 0, y: 0 };
        const offsetX = (typeof rawOffset === 'object' ? rawOffset.x : rawOffset) * scaleX;
        const offsetY = (typeof rawOffset === 'object' ? rawOffset.y : 0) * scaleY;

        if (!currentImageData) {
          continue;
        }

        const userImg = new Image();
        await new Promise((resolve) => {
          userImg.onload = resolve;
          userImg.onerror = resolve;
          userImg.src = currentImageData;
        });

        if (userImg.complete && userImg.naturalWidth > 0) {
          const slotX = tx(imageSlot.x);
          const slotY = ty(imageSlot.y);
          const slotW = tsX(imageSlot.width);
          const slotH = tsY(imageSlot.height);
          const imgAspect = userImg.naturalWidth / userImg.naturalHeight;
          const areaAspect = slotW / slotH;

          let drawWidth, drawHeight;
          if (imgAspect > areaAspect) {
            drawHeight = slotH;
            drawWidth = slotH * imgAspect;
          } else {
            drawWidth = slotW;
            drawHeight = slotW / imgAspect;
          }

          // Center + apply 2D pan offset, then clamp so image always fills slot.
          let drawX = slotX - (drawWidth - slotW) / 2 + offsetX;
          let drawY = slotY - (drawHeight - slotH) / 2 + offsetY;
          drawX = Math.min(slotX, Math.max(slotX - (drawWidth - slotW), drawX));
          drawY = Math.min(slotY, Math.max(slotY - (drawHeight - slotH), drawY));

          ctx.save();
          ctx.beginPath();
          ctx.rect(slotX, slotY, slotW, slotH);
          ctx.clip();
          ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        }
      }
      
      // 繪製QR Code
      if (sharedFormData.showQRCode && sharedFormData.websiteUrl) {
        try {
          const qrNativeSize = ts(renderTemplate.qrCode.size - renderTemplate.qrCode.contentPadding);
          const qrCanvas = await generateQRCodeCanvas(sharedFormData.websiteUrl, {
            width: Math.round(qrNativeSize),
            margin: 0,
            color: { dark: '#000000', light: '#FFFFFF' }
          });

          if (qrCanvas) {
            const qrX = tx(renderTemplate.canvas.width - renderTemplate.qrCode.size);
            const qrY = ty(renderTemplate.canvas.height - renderTemplate.qrCode.size);
            const bgPad = ts(renderTemplate.qrCode.backgroundPadding);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(qrX - bgPad, qrY - bgPad, qrNativeSize + bgPad * 2, qrNativeSize + bgPad * 2);
            ctx.drawImage(qrCanvas, qrX, qrY, qrNativeSize, qrNativeSize);
          }
        } catch (qrError) {
          console.error('Failed to draw QR code:', qrError);
        }
      }

      // Draw text.
      ctx.fillStyle = '#303030';

      // Title: split by spaces/newlines and vertically center all lines.
      if (sharedFormData.title) {
        ctx.font = ` ${ts(renderTemplate.textPositions.title.fontSize)}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleLines = sharedFormData.title
          .split(/\r?\n/)
          .flatMap((line) => {
            if (!line) return [''];
            return line.split(/ +/).filter((s) => s.length > 0);
          });
        const lineHeight = ts(renderTemplate.textPositions.title.lineHeight);
        const centerY = ty(renderTemplate.textPositions.title.centerY);
        const startY = centerY - ((titleLines.length - 1) * lineHeight) / 2;

        titleLines.forEach((line, index) => {
          ctx.fillText(line, tx(renderTemplate.textPositions.title.x), startY + lineHeight * index);
        });
      }

      if (sharedFormData.nickname) {
        ctx.font = ` ${ts(renderTemplate.textPositions.nickname.fontSize)}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sharedFormData.nickname, tx(renderTemplate.textPositions.nickname.x), ty(renderTemplate.textPositions.nickname.y));
      }

      if (sharedFormData.category) {
        ctx.font = ` ${ts(renderTemplate.textPositions.category.fontSize)}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sharedFormData.category, tx(renderTemplate.textPositions.category.x), ty(renderTemplate.textPositions.category.y));
      }

      // Message: wrap by measured width while preserving line breaks.
      if (sharedFormData.message) {
        ctx.font = ` ${ts(renderTemplate.textPositions.message.fontSize)}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const maxWidth = ts(renderTemplate.textPositions.message.maxWidth);
        const lineHeight = ts(renderTemplate.textPositions.message.lineHeight);
        const startY = ty(renderTemplate.textPositions.message.startY);
        const messageX = tx(renderTemplate.textPositions.message.x);
        const inputLines = sharedFormData.message.split(/\r?\n/);
        const renderedLines = [];

        inputLines.forEach((inputLine) => {
          if (inputLine === '') {
            renderedLines.push('');
            return;
          }

          const characters = inputLine.split('');
          let line = '';

          for (let i = 0; i < characters.length; i++) {
            const testLine = line + characters[i];
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && line !== '') {
              renderedLines.push(line);
              line = characters[i];
            } else {
              line = testLine;
            }
          }

          if (line) {
            renderedLines.push(line);
          }
        });

        renderedLines.forEach((renderedLine, index) => {
          ctx.fillText(renderedLine, messageX, startY + lineHeight * index);
        });
      }

      ctx.fillStyle = 'white';
      ctx.font = ` ${ts(renderTemplate.textPositions.dateRole.fontSize)}px ${renderTemplate.textPositions.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      imageSlots.forEach((slot) => {
        const dayKey = slot?.key;
        const currentDayDetail = dayKey ? (dayDetails[dayKey] || { date: '', cosrole: '' }) : { date: '', cosrole: '' };

        if (!currentDayDetail.date && !currentDayDetail.cosrole) return;

        const dateText = currentDayDetail.date ? formatDateToMMDD(currentDayDetail.date) : '';
        const roleText = currentDayDetail.cosrole || '';
        let displayText = '';
        if (dateText && roleText) displayText = `${dateText} ${roleText}`;
        else if (dateText) displayText = dateText;
        else if (roleText) displayText = roleText;
        if (!displayText) return;

        const useTemplateSinglePosition = imageSlots.length === 1;
        const textX = useTemplateSinglePosition
          ? tx(renderTemplate.textPositions.dateRole.x)
          : tx(slot.x + slot.width / 2);
        const textY = useTemplateSinglePosition
          ? ty(renderTemplate.textPositions.dateRole.y)
          : ty(slot.y + slot.height) + ts(renderTemplate.textPositions.dateRole.fontSize);
        ctx.fillText(displayText, textX, textY);
      });

      ctx.fillStyle = '#2c3e50';

      // All drawing is done — atomically copy offscreen canvas to visible canvas.
      // This single drawImage call is synchronous, preventing any blank-frame flash.
      if (canvas.width !== outputW || canvas.height !== outputH) {
        canvas.width = outputW;
        canvas.height = outputH;
      }
      canvas.getContext('2d').drawImage(offscreen, 0, 0);

      return canvas.toDataURL();
      
    } catch (error) {
      console.error('Canvas render failed:', error);
      alert(error.message || 'Rendering failed. Please try again later.');
      return null;
    } finally {
      if (!silent) setIsLoading(false);
      // Release render lock.
      isRenderingRef.current = false;
    }
  }, [
    aspectRatio,
    dayDetails,
    formDataString,
    generateQRCodeCanvas,
    formatDateToMMDD,
    getCurrentTemplate,
    imageDatas,
    imageOffsets,
    sharedFormData
  ]);

  // Debounced wrapper around renderCanvas (with loading indicator).
  const debouncedRenderCanvas = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    renderTimeoutRef.current = setTimeout(() => {
      renderCanvas();
    }, 300);
  }, [renderCanvas]);

  // Immediate silent render — no loading flash, used after drag-end.
  const renderCanvasSilent = useCallback(() => {
    renderCanvas({ silent: true });
  }, [renderCanvas]);

  return {
    formData,
    imageDatas,
    imageOffsets,
    dayDetails,
    dayCount,
    supportedDayCounts,
    isLoading,
    showModal,
    canvasRef,
    getCurrentDateString,
    updateFormData,
    updateDayDetail,
    handleImageUpload,
    updateImageOffset,
    getCurrentTemplate,
    renderCanvas: debouncedRenderCanvas,
    renderCanvasSilent,
    setDayCount,
    setShowModal,
    aspectRatio,
    setAspectRatio,
    slotTransform
  };
};
