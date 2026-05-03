import { useState, useCallback, useRef, useMemo } from 'react';
import { useQRCode } from './useQRCode';
import { CARD_TEMPLATES } from '../models/cardTemplates.js';

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
  // for specific event update and preset-based base image override
  const [baseImageOverride, setBaseImageOverride] = useState(null);
  
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
    showQRCode: false,
    websiteUrl: ''
  });

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { generateQRCodeCanvas } = useQRCode();
  const canvasRef = useRef(null);
  
  // Refs for render debouncing and render lock.
  const renderTimeoutRef = useRef(null);
  const lastRenderDataRef = useRef(null);
  const isRenderingRef = useRef(false);

  const getCurrentTemplate = useCallback(() => {
    const baseTemplate =
      templateConfig.templateByDayCount[dayCount]
      || templateConfig.templateByDayCount[defaultDayCount]
      || CARD_TEMPLATES['1p'];

    // if no base image override, return the template directly
    if (!baseImageOverride) return baseTemplate;

    return {
      ...baseTemplate,
      baseImagePath: baseImageOverride
    };
  }, [dayCount, defaultDayCount, templateConfig.templateByDayCount, baseImageOverride]);

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
      showQRCode: sharedFormData.showQRCode,
      websiteUrl: sharedFormData.websiteUrl || '',
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
      titleImageData,
      date: dayDetails.d1?.date || '',
      cosrole: dayDetails.d1?.cosrole || '',
      imageOffsetX: imageOffsets.d1 ?? 0
    };
  }, [sharedFormData, titleImageData, dayDetails, imageOffsets]);

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

  // Render canvas with lock and cache checks to avoid duplicate work.
  const renderCanvas = useCallback(async () => {
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
    
    setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = renderTemplate.canvas.width;
      canvas.height = renderTemplate.canvas.height;
      
      // Load base image.
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = () => {
          console.error('Base image failed to load. Check image asset path.');
          reject(new Error('Failed to load base image. Please try again later.'));
        };
        // Base image path is template-driven for extensibility.
        baseImg.src = renderTemplate.baseImagePath || '/img/card_base.png';
      });

      console.log('Base image loaded.');
      
      // Draw base image.
      ctx.drawImage(baseImg, 0, 0, renderTemplate.canvas.width, renderTemplate.canvas.height);
      
      // Draw all user image slots based on current template.
      for (const imageSlot of imageSlots) {
        const dayKey = imageSlot?.key;
        const currentImageData = dayKey ? imageDatas[dayKey] : null;
        const currentImageOffset = dayKey ? (imageOffsets[dayKey] ?? 0) : 0;

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
          const imgAspect = userImg.naturalWidth / userImg.naturalHeight;
          const areaAspect = imageSlot.width / imageSlot.height;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspect > areaAspect) {
            drawHeight = imageSlot.height;
            drawWidth = drawHeight * imgAspect;
            const offsetPixels = (drawWidth - imageSlot.width) * currentImageOffset / 100;
            drawX = imageSlot.x - (drawWidth - imageSlot.width) / 2 + offsetPixels;
            drawY = imageSlot.y;
          } else {
            drawWidth = imageSlot.width;
            drawHeight = drawWidth / imgAspect;
            drawX = imageSlot.x;
            drawY = imageSlot.y - (drawHeight - imageSlot.height) / 2;
          }
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(imageSlot.x, imageSlot.y, imageSlot.width, imageSlot.height);
          ctx.clip();
          
          ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        }
      }
      
      // 繪製QR Code
      if (sharedFormData.showQRCode && sharedFormData.websiteUrl) {
        try {
          const qrCanvas = await generateQRCodeCanvas(sharedFormData.websiteUrl, {
            width: renderTemplate.qrCode.size - renderTemplate.qrCode.contentPadding,
            margin: 0,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          if (qrCanvas) {
            const qrSize = renderTemplate.qrCode.size - renderTemplate.qrCode.contentPadding;
            const qrX = renderTemplate.canvas.width - qrSize;
            const qrY = renderTemplate.canvas.height - qrSize;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(
              qrX - renderTemplate.qrCode.backgroundPadding,
              qrY - renderTemplate.qrCode.backgroundPadding,
              qrSize,
              qrSize
            );
          
            
            ctx.drawImage(
              qrCanvas,
              qrX,
              qrY,
              qrSize - renderTemplate.qrCode.contentPadding,
              qrSize - renderTemplate.qrCode.contentPadding
            );
          }
        } catch (qrError) {
          console.error('Failed to draw QR code:', qrError);
        }
      }

      // Draw text.
      ctx.fillStyle = '#303030';

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
      
      if (titleImageData) {
        const titleImage = new Image();
        await new Promise((resolve) => {
          titleImage.onload = resolve;
          titleImage.onerror = resolve;
          titleImage.src = titleImageData;
        });

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

        // Get dateRole config from the image slot
        const slotDateRole = slot?.dateRole;
        if (!slotDateRole) {
          return;
        }

        ctx.font = ` ${slotDateRole.fontSize}px ${renderTemplate.textPositions.fontFamily}`;
        const dateRoleBox = getTextBoxCenter(slotDateRole);
        ctx.fillText(displayText, dateRoleBox.x, dateRoleBox.y);
      });
      
      ctx.fillStyle = '#2c3e50';

      return canvas.toDataURL();
      
    } catch (error) {
      console.error('Canvas render failed:', error);
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
    generateQRCodeCanvas,
    formatDateToMMDD,
    getCurrentTemplate,
    imageDatas,
    imageOffsets,
    sharedFormData,
    titleImageData
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
    }, 300); // 300ms delay
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
    handleTitleImageUpload,
    getCurrentTemplate,
    renderCanvas: debouncedRenderCanvas, // Return debounced version.
    setDayCount,
    setShowModal,
    setBaseImageOverride
  };
};
