import { useState, useCallback, useRef, useMemo } from 'react';
import { getCurrentDateString, getDayIndexFromKey } from './useTools.js';
import { CARD_TEMPLATES } from '../models/cardTemplates.js';
import { createImageLayerRenderer } from './useImageLayerRenderer.js';
import * as api from '../services/api.js';
import { resolveAssetUrl } from '../services/api.js';
import { buildCardPayload, applyCardPayload } from '../utils/cardPayload.js';

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

export const useCardMaker = ({ eventName = null } = {}) => {
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

  // 活動底圖（使用者上傳，涵蓋完整活動資訊，直接作為整張卡片的底圖）
  const [baseImageData, setBaseImageData] = useState(null);

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

  // 每日照片是否使用圓角（0 = 停用，>0 = 半徑）
  const [roundedCorners, setRoundedCorners] = useState(false);
  
  // Refs for render debouncing and render lock.
  const renderTimeoutRef  = useRef(null);
  const lastRenderDataRef = useRef(null);
  const isRenderingRef    = useRef(false);
  const imageLayerRef     = useRef(null);
  
  const baseImageCacheRef = useRef({
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

    // 回傳被 override 的模板，override 的內容會覆蓋 base template 的同名欄位
    let merged = baseTemplate;
    if (baseCanvasOverride) {
      merged = {
        ...merged,
        ...baseCanvasOverride
      };
    }

    // 使用者上傳的活動底圖優先：寫入 baseImagePath 讓儲存到伺服器的
    // overWriteCanvas 快照能還原同一張底圖。
    if (baseImageData) {
      merged = {
        ...merged,
        baseImagePath: baseImageData
      };
    }

    return merged;
  }, [dayCount, defaultDayCount, templateConfig.templateByDayCount, baseCanvasOverride, baseImageData]);

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
      baseImageData: baseImageData || '',
      nickname: sharedFormData.nickname || '',
      message: sharedFormData.message || '',
      category: sharedFormData.category || '',
      dayCount,
      dayDetails,
      imageDatas,
      imageOffsets,
      roundedCorners
    });
  }, [sharedFormData, baseImageData, dayCount, dayDetails, imageDatas, imageOffsets, roundedCorners]);

  // Backward-compatible flat form data for legacy UI consumers.
  const formData = useMemo(() => {
    // Keep old access paths: formData.date and formData.cosrole.
    return {
      ...sharedFormData,
      baseImageData
    };
  }, [sharedFormData, baseImageData]);

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

  const ensureApiToken = useCallback(() => {
    if (api.getToken()) return true;
    const token = window.prompt('請輸入後端 API Token：');
    if (!token) {
      alert('未設定 API Token，無法執行儲存操作。');
      return false;
    }
    api.setToken(token);
    return true;
  }, []);

  // 每日照片僅用於本機畫布顯示，不上傳後端，直接以 object URL 呈現。
  const handleImageUpload = useCallback((file, dayKey = 'd1') => {
    if (!file) return;

    const maxSize = getCurrentTemplate().upload.maxFileSizeBytes;
    if (file.size > maxSize) {
      alert('Image is too large. Please upload a file smaller than 5MB.');
      return;
    }

    setImageDatas((prev) => {
      const oldUrl = prev?.[dayKey];
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }
      return {
        ...prev,
        [dayKey]: URL.createObjectURL(file)
      };
    });
  }, [getCurrentTemplate]);

  const handleBaseImageUpload = useCallback((file) => {
    if (!file) return;

    const maxSize = getCurrentTemplate().upload.maxFileSizeBytes;
    if (file.size > maxSize) {
      alert('Image is too large. Please upload a file smaller than 5MB.');
      return;
    }

    api.uploadImage(file)
      .then((url) => setBaseImageData(url))
      .catch((error) => {
        console.error('Failed to upload base image:', error);
        alert(error.status === 401
          ? 'API Token 驗證失敗，請重新儲存。'
          : 'Image upload failed. Please try again.');
      });
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

    // getCurrentTemplate 已含 baseCanvasOverride（OEM 模板或載入卡片的版面快照）合併結果
    const template = getCurrentTemplate();

    const hasCanvasConfig = Number.isFinite(template?.canvas?.width) && Number.isFinite(template?.canvas?.height);
    const renderTemplate = hasCanvasConfig ? template : CARD_TEMPLATES['1p'];
    const imageSlots = renderTemplate.imageSlots || [];
    
    // Skip if another render is in progress.
    if (isRenderingRef.current) {
      console.log('Canvas is already rendering. Skip this request.');
      return null;
    }
        
    console.log(template);

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
      
      // 使用者上傳的活動底圖優先；否則使用模板內建底圖。
      // 相對路徑（/uploads/...）在此補上 BASE_URL，模板內建 ./img/... 維持原樣。
      const baseImageSrc = resolveAssetUrl(baseImageData || renderTemplate.baseImagePath || '/img/card_base.png');

      let baseImg = baseImageCacheRef.current.image;

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

      // 繪製底圖：上傳的活動底圖以等比 cover 方式鋪滿畫布；
      // 模板底圖則依原尺寸設定拉伸繪製。
      if (baseImageData) {
        const naturalWidth = baseImg.naturalWidth || 1;
        const naturalHeight = baseImg.naturalHeight || 1;
        const scale = Math.max(canvas.width / naturalWidth, canvas.height / naturalHeight);
        const drawWidth = naturalWidth * scale;
        const drawHeight = naturalHeight * scale;
        ctx.drawImage(
          baseImg,
          (canvas.width - drawWidth) / 2,
          (canvas.height - drawHeight) / 2,
          drawWidth,
          drawHeight
        );
      } else {
        ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
      }
      

      // Draw all user image slots based on current template.
      await imageLayerRenderer.render({
        canvas: imageLayerRef.current,
        renderTemplate,
        imageDatas,
        imageOffsets,
        // 使用者可切換每日照片是否使用圓角
        radius: roundedCorners ? 32 : 0
      });
    
      if (imageLayerRef.current) {
        ctx.drawImage(imageLayerRef.current, 0, 0);
      }

      // Draw text.
      if (renderTemplate.fontColor)
        ctx.fillStyle = renderTemplate.fontColor;
      else
        ctx.fillStyle = '#303030';
      
      // 暱稱
      if (sharedFormData.nickname) {
        ctx.font = ` ${renderTemplate.textPositions.nickname.fontSize}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const nicknameBox = getTextBoxCenter(renderTemplate.textPositions.nickname);
        ctx.fillText(sharedFormData.nickname, nicknameBox.x, nicknameBox.y);
      }
      
      // 身分: 文字輸入版本
      if (sharedFormData.category && renderTemplate.textPositions.category) {
        ctx.font = ` ${renderTemplate.textPositions.category.fontSize}px ${renderTemplate.textPositions.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const categoryBox = getTextBoxCenter(renderTemplate.textPositions.category);
        ctx.fillText(sharedFormData.category, categoryBox.x, categoryBox.y);
      }

      // 身分: 圈選版本 (用方框框起來)
      if (sharedFormData.category && renderTemplate.categorySelection) {
        const category = sharedFormData.category;
        const categoryConfig = renderTemplate.categorySelection[category];

        if (categoryConfig) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#ff0000';
          ctx.roundRect(
            categoryConfig.x,
            categoryConfig.y,
            categoryConfig.width,
            categoryConfig.height,
            5
          );
          ctx.stroke();
        }
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
      if (renderTemplate.fontColor)
        ctx.fillStyle = renderTemplate.fontColor;
      else
        ctx.fillStyle = '#303030';

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      imageSlots.forEach((slot) => {
        const dayKey = slot?.key;
        const currentDayDetail = dayKey ? (dayDetails[dayKey] || { date: '', cosrole: '' }) : { date: '', cosrole: '' };

        if (!slot.dateRole)
          return;

        if (!currentDayDetail.date && !currentDayDetail.cosrole) {
          return;
        }

        // TODO: 目前只顯示 cosrole，暫時不顯示日期，因為會和模板內建的日期有衝突。
        // const dateText = currentDayDetail.date ? formatDateToMMDD(currentDayDetail.date) : '';
        // const roleText = currentDayDetail.cosrole || '';
        // let displayText = '';

        // if (dateText && roleText) {
        //   displayText = `${dateText} ${roleText}`;
        // } else if (dateText) {
        //   displayText = dateText;
        // } else if (roleText) {
        //   displayText = roleText;
        // }

        const roleText = currentDayDetail.cosrole || '';
        let displayText = roleText;

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
    baseImageData,
    dayDetails,
    formDataString,
    formatDateToMMDD,
    getCurrentTemplate,
    imageDatas,
    imageOffsets,
    sharedFormData,
    imageLayerRenderer,
    roundedCorners
  ]);

  // Persist current card to the backend; resolves with the new card id.
  const saveCard = useCallback(async () => {
    if (!ensureApiToken()) return null;

    try {
      const payload = buildCardPayload({
        dayCount,
        eventName,
        dayDetails,
        overWriteCanvas: getCurrentTemplate()
      });
      const { id } = await api.saveCard(payload);
      return id;
    } catch (error) {
      console.error('Failed to save card:', error);
      alert(error.status === 401
        ? 'API Token 驗證失敗，請確認後重試。'
        : '儲存失敗，請稍後再試。');
      return null;
    }
  }, [ensureApiToken, getCurrentTemplate, eventName, dayCount, dayDetails]);

  // Restore UI state from a stored card. Resolves true on success.
  // payload 僅含版面快照（dayCount / startDate / overWriteCanvas / eventName），
  // 不還原使用者內容。
  const loadCard = useCallback(async (cardId) => {
    try {
      const record = await api.loadCard(cardId);
      const restored = applyCardPayload(record?.payload);

      // 還原卡片自帶的畫布覆寫設定（OEM 模板或儲存時的版面快照）
      setBaseCanvasOverride(restored.overWriteCanvas || null);

      if (restored.dayCount) {
        setDayCountState(normalizeDayCount(restored.dayCount));
      }
      return true;
    } catch (error) {
      console.error('Failed to load card:', error);
      alert(error.status === 404 ? '找不到指定的卡片 ID。' : '載入失敗，請稍後再試。');
      return false;
    }
  }, [normalizeDayCount]);

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
    handleBaseImageUpload,
    getCurrentTemplate,
    renderCanvas: debouncedRenderCanvas, // Return debounced version.
    saveCard,
    loadCard,
    setDayCount,
    setShowModal,
    setBaseCanvasOverride,
    roundedCorners,
    setRoundedCorners
  };
};
