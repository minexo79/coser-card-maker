import { useState, useCallback, useRef, useMemo } from 'react';
import { getCurrentDateString, getDayIndexFromKey } from './useTools.js';
import { CARD_TEMPLATES } from '../models/cardTemplates.js';
import { createImageLayerRenderer } from './useImageLayerRenderer.js';

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
    nickname: '',
    message: '',
    category: 'COSER'
  });

  // for specific event update and preset-based base image override
  const [baseCanvasOverride, setBaseCanvasOverride] = useState(null);

  const [titleImageData, setTitleImageData] = useState(null);

  const [dayDetails, setDayDetails] = useState(() =>
    createStateByDayKeys(allDayKeys, () => ({ date: '', cosrole: '' }))
  );

  const [imageDatas, setImageDatas] = useState(() =>
    createStateByDayKeys(allDayKeys, () => null)
  );

  const [imageOffsets, setImageOffsets] = useState(() =>
    createStateByDayKeys(allDayKeys, () => 0)
  );

  const [dayCount, setDayCountState] = useState(defaultDayCount);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const canvasRef = useRef(null);
  
  // Refs for render debouncing and render lock.
  const renderTimeoutRef  = useRef(null);
  const lastRenderDataRef = useRef(null);
  const isRenderingRef    = useRef(false);
  const imageLayerRef     = useRef(null);
  
  const baseImageCacheRef = useRef({
    src: null,
    image: null
  });

  const titleImageCacheRef = useRef({
    src: null,
    image: null
  });

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

  const setDayCount = useCallback(
    (requestedDayCount) => {
      setDayCountState(normalizeDayCount(requestedDayCount));
    },
    [normalizeDayCount]
  );

  const getCurrentTemplate = useCallback(() => {
    const baseTemplate =
      templateConfig.templateByDayCount[dayCount]
      || templateConfig.templateByDayCount[defaultDayCount]
      || CARD_TEMPLATES['1p'];

    return baseTemplate;
  }, [dayCount, defaultDayCount, templateConfig.templateByDayCount]);

  const addDaysToDate = useCallback((dateValue, days) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, []);

  const updateDayDetail = useCallback((dayKey, field, value) => {
    if (field === 'imageOffsetX') {
      setImageOffsets((prev) => ({
        ...prev,
        [dayKey]: value
      }));
      return;
    }

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
      titleImageData: titleImageData || '',
      nickname: sharedFormData.nickname || '',
      message: sharedFormData.message || '',
      category: sharedFormData.category || '',
      dayCount,
      dayDetails,
      imageDatas,
      imageOffsets
    });
  }, [sharedFormData, titleImageData, dayCount, dayDetails, imageDatas, imageOffsets]);

  // Backward-compatible flat form data for legacy UI consumers.
  const formData = useMemo(() => {
    // Keep old access paths: formData.date and formData.cosrole.
    return {
      ...sharedFormData,
      titleImageData
    };
  }, [sharedFormData, titleImageData]);

  const imageLayerRenderer = useMemo(() => {
    return createImageLayerRenderer();
  }, []);

  const updateFormData = useCallback((field, value) => {
    if (field === 'date' || field === 'cosrole') {
      updateDayDetail('d1', field, value);
      return;
    }

    if (field === 'imageOffsetX') {
      setImageOffsets((prev) => ({
        ...prev,
        d1: value
      }));
      return;
    }

    setSharedFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, [updateDayDetail]);

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

  const handleTitleImageUpload = useCallback((file) => {
    if (!file) {
      return;
    }

    const maxSize = getCurrentTemplate().upload.maxFileSizeBytes;
    if (file.size > maxSize) {
      alert('Image is too large. Please upload a file smaller than 5MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        setTitleImageData(e.target.result);
      }
    };

    reader.onerror = (error) => {
      console.error('Failed to read title image file:', error);
      alert('Failed to read image file. Please try again.');
    };

    reader.readAsDataURL(file);
  }, [getCurrentTemplate]);

  const formatDateToMMDD = useCallback((dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }, []);

  const getTextBoxCenter = (box) => {
    const width = box?.width ?? 0;
    const height = box?.height ?? 0;
    return {
      x: (box?.x ?? 0) + (width / 2),
      y: (box?.y ?? 0) + (height / 2),
      width,
      height
    };
  };

  // Render canvas with lock and cache checks to avoid duplicate work.
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current) return null;

    // If canvas config is incomplete, fall back to 1p to avoid render failure.
    // 2026.5.8 blackcat: use override if get the custom preset by oem. otherwise use default preset.
    var template = null;

    if (baseCanvasOverride)
    {
      template = baseCanvasOverride;
    }
    else
      template = getCurrentTemplate();

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
    
    setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
    
      canvas.width = renderTemplate.canvas.width;
      canvas.height = renderTemplate.canvas.height;
      
      const baseImageSrc = renderTemplate.baseImagePath || '/img/card_base.png';

      let baseImg = baseImageCacheRef.current.image;
      let titleImage = titleImageCacheRef.current.image;

      // 👉 如果圖片沒變，直接用 cache
      if (baseImageCacheRef.current.src === baseImageSrc && baseImg) {
        // skip loading
      } else {
        baseImg = new Image();
        baseImg.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
          baseImg.onload = resolve;
          baseImg.onerror = () => {
            console.error('> Base image failed to load.');
            reject(new Error('Failed to load base image.'));
          };
          baseImg.src = baseImageSrc;
        });

        // 👉 更新 cache
        baseImageCacheRef.current = {
          src: baseImageSrc,
          image: baseImg
        };

        console.log('> Base image changed');
      }
      
      // Draw base image.
      ctx.drawImage(baseImg, 0, 0, renderTemplate.canvas.width, renderTemplate.canvas.height);
      

      // Draw all user image slots based on current template.
      await imageLayerRenderer.render({
        canvas: imageLayerRef.current,
        renderTemplate,
        imageDatas,
        imageOffsets
      });
    
      if (imageLayerRef.current) {
        ctx.drawImage(imageLayerRef.current, 0, 0);
      }

      // Title Image 也跟 Base Image 一樣有 cache 機制，避免不必要的重複載入和渲染。
      if (titleImageData) {
        // Load title image with cache check.
        if (titleImageCacheRef.current.src === titleImageData && titleImage) {
          // skip loading
        } else {
          titleImage = new Image();
          titleImage.crossOrigin = 'anonymous';

          await new Promise((resolve, reject) => {
            titleImage.onload = resolve;
            titleImage.onerror = () => {
              console.error('> Title image failed to load.');
              reject(new Error('Failed to load title image.'));
            };
            titleImage.src = titleImageData;
          });

          // 👉 更新 cache
          titleImageCacheRef.current = {
            src: titleImageData,
            image: titleImage
          };

          console.log('> Title image changed');
        }

        if (titleImage.complete && titleImage.naturalWidth > 0 && titleImage.naturalHeight > 0) {
          const titleArea = renderTemplate.titleImage;
          const titleAspect = titleImage.naturalWidth / titleImage.naturalHeight;
          const areaAspect = titleArea.width / titleArea.height;

          let drawWidth = titleArea.width;
          let drawHeight = titleArea.height;
          let drawX = titleArea.x;
          let drawY = titleArea.y;

          // Keep the full title image visible and center it in the reserved box.
          if (titleAspect > areaAspect) {
            drawHeight = titleArea.width / titleAspect;
            drawY = titleArea.y + (titleArea.height - drawHeight) / 2;
          } else {
            drawWidth = titleArea.height * titleAspect;
            drawX = titleArea.x + (titleArea.width - drawWidth) / 2;
          }

          ctx.drawImage(titleImage, drawX, drawY, drawWidth, drawHeight);
        }
      }

      // Draw text.
      ctx.fillStyle = '#303030';
      
      // 暱稱
      if (sharedFormData.nickname) {
        ctx.font = ` ${renderTemplate.textPositions.nickname.fontSize}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const nicknameBox = getTextBoxCenter(renderTemplate.textPositions.nickname);
        ctx.fillText(sharedFormData.nickname, nicknameBox.x, nicknameBox.y);
      }
      
      // 身分
      if (sharedFormData.category) {
        ctx.font = ` ${renderTemplate.textPositions.category.fontSize}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const categoryBox = getTextBoxCenter(renderTemplate.textPositions.category);
        ctx.fillText(sharedFormData.category, categoryBox.x, categoryBox.y);
      }

      // 備註
      if (sharedFormData.message) {
        ctx.font = ` ${renderTemplate.textPositions.message.fontSize}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const messageBox = getTextBoxCenter(renderTemplate.textPositions.message);

        const messageLines = sharedFormData.message
          .split(/\r?\n/)
          .flatMap((line) => {
            if (!line) {
              return [''];
            }

            return line
              .split(/ +/)
              .filter((segment) => segment.length > 0);
          });
        const lineHeight = renderTemplate.textPositions.message.lineHeight;
        const startY = messageBox.y - ((messageLines.length - 1) * lineHeight) / 2;

        messageLines.forEach((line, index) => {
          ctx.fillText(line, messageBox.x, startY + lineHeight * index);
        });
      }
    

      // 出角資訊
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      imageSlots.forEach((slot) => {
        const dayKey = slot?.key;
        const currentDayDetail = dayKey ? (dayDetails[dayKey] || { date: '', cosrole: '' }) : { date: '', cosrole: '' };

        if (!currentDayDetail.date && !currentDayDetail.cosrole) {
          return;
        }

        const dateText = currentDayDetail.date ? formatDateToMMDD(currentDayDetail.date) : '';
        const roleText = currentDayDetail.cosrole || '';
        let displayText = '';

        if (dateText && roleText) {
          displayText = `${dateText} ${roleText}`;
        } else if (dateText) {
          displayText = dateText;
        } else if (roleText) {
          displayText = roleText;
        }

        if (!displayText) {
          return;
        }

        const textX = slot.dateRole.x + (slot.dateRole.width / 2);
        const textY = slot.dateRole.y + (slot.dateRole.height / 2);

        ctx.font = ` ${slot.dateRole.fontSize}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.fillText(displayText, textX, textY);
      });
    } catch (error) {
      console.error('> Canvas render failed:', error);
      alert(error.message || 'Rendering failed. Please try again later.');
      return null;
    } finally {
      setIsLoading(false);
      // Release render lock.
      isRenderingRef.current = false;
    }
  }, [
    dayDetails,
    formDataString,
    formatDateToMMDD,
    getCurrentTemplate,
    imageDatas,
    imageOffsets,
    sharedFormData,
    titleImageData,
    imageLayerRenderer
  ]);

  // Debounced wrapper around renderCanvas.
  const debouncedRenderCanvas = useCallback(() => {
    // Clear previous timer.
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Schedule delayed render.
    renderTimeoutRef.current = setTimeout(() => {
      renderCanvas();
    }, 100); // 300ms delay
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
    imageLayerRef,
    getCurrentDateString,
    updateFormData,
    updateDayDetail,
    handleImageUpload,
    handleTitleImageUpload,
    getCurrentTemplate,
    renderCanvas: debouncedRenderCanvas, // Return debounced version.
    setDayCount,
    setShowModal,
    setBaseCanvasOverride
  };
};
