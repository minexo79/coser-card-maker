import { useState, useCallback, useRef, useMemo } from 'react';
import { useQRCode } from './useQRCode';
import {
  CARD_CANVAS,
  CARD_IMAGE_AREA,
  CARD_QR_CODE,
  CARD_TEXT,
  CARD_UPLOAD,
  DEFAULT_BASE_IMAGE_LAYOUT
} from '../constants/cardLayout';

export const useCardMaker = () => {
  const [formData, setFormData] = useState({
    title: '',
    nickname: '',
    message: '',
    category: 'COSER',
    date: '',
    cosrole: '',
    imageOffsetX: 0
  });
  
  const [imageData, setImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { generateQRCodeCanvas } = useQRCode();
  const canvasRef = useRef(null);
  
  // 添加防抖和緩存相關的 refs
  const renderTimeoutRef = useRef(null);
  const lastRenderDataRef = useRef(null);
  const isRenderingRef = useRef(false);

  // 創建一個穩定的 formData 字符串用於比較
  const formDataString = useMemo(() => {
    return JSON.stringify({
      title: formData.title || '',
      nickname: formData.nickname || '',
      message: formData.message || '',
      category: formData.category || '',
      date: formData.date || '',
      cosrole: formData.cosrole || '',
      imageOffsetX: formData.imageOffsetX || 0,
      showQRCode: formData.showQRCode,
      websiteUrl: formData.websiteUrl || ''
    });
  }, [formData]);

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleImageUpload = useCallback((file) => {
    if (file) {
      const maxSize = CARD_UPLOAD.maxFileSizeBytes;
      if (file.size > maxSize) {
        alert('圖片檔案太大，請選擇小於 5MB 的圖片');
        return;
      }
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageData(e.target.result);
        }
      };
      
      reader.onerror = (error) => {
        console.error('讀取檔案時發生錯誤:', error);
        alert('圖片讀取失敗，請重試');
      };
      
      reader.readAsDataURL(file);
    }
  }, []);

  const formatDateToMMDD = useCallback((dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }, []);

  const createDefaultBaseImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_CANVAS.width;
    canvas.height = CARD_CANVAS.height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(
      DEFAULT_BASE_IMAGE_LAYOUT.background.x,
      DEFAULT_BASE_IMAGE_LAYOUT.background.y,
      DEFAULT_BASE_IMAGE_LAYOUT.background.width,
      DEFAULT_BASE_IMAGE_LAYOUT.background.height
    );

    ctx.strokeStyle = '#4682b4';
    ctx.lineWidth = DEFAULT_BASE_IMAGE_LAYOUT.outerBorder.lineWidth;
    ctx.strokeRect(
      DEFAULT_BASE_IMAGE_LAYOUT.outerBorder.x,
      DEFAULT_BASE_IMAGE_LAYOUT.outerBorder.y,
      DEFAULT_BASE_IMAGE_LAYOUT.outerBorder.width,
      DEFAULT_BASE_IMAGE_LAYOUT.outerBorder.height
    );

    ctx.fillStyle = 'rgba(250, 250, 250, 0.8)';
    ctx.fillRect(
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.height
    );
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.lineWidth;
    ctx.strokeRect(
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.leftPanel.height
    );

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.height
    );
    ctx.strokeStyle = '#969696';
    ctx.lineWidth = DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.lineWidth;
    ctx.strokeRect(
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.imagePanel.height
    );

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.height
    );
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = DEFAULT_BASE_IMAGE_LAYOUT.namePanel.lineWidth;
    ctx.strokeRect(
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.namePanel.height
    );

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.height
    );
    ctx.strokeRect(
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.x,
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.y,
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.width,
      DEFAULT_BASE_IMAGE_LAYOUT.messagePanel.height
    );

    return canvas.toDataURL();
  }, []);

  // 修改 renderCanvas，添加防重複渲染邏輯
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current) return null;
    
    // 檢查是否正在渲染中
    if (isRenderingRef.current) {
      console.log('Canvas正在渲染中，跳過此次請求');
      return null;
    }
    
    // 創建當前數據的快照用於比較
    const currentDataSnapshot = formDataString + (imageData || '');
    
    // 如果數據沒有變化，跳過渲染
    if (lastRenderDataRef.current === currentDataSnapshot) {
      console.log('數據未變化，跳過渲染');
      return null;
    }
    
    // 設置渲染標記
    isRenderingRef.current = true;
    lastRenderDataRef.current = currentDataSnapshot;
    
    setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      canvas.width = CARD_CANVAS.width;
      canvas.height = CARD_CANVAS.height;
      
      // 載入底圖
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve) => {
        baseImg.onload = resolve;
        baseImg.onerror = () => {
          baseImg.src = createDefaultBaseImage();
          baseImg.onload = resolve;
        };
        baseImg.src = '/img/card_base_1p.png';
      });
      
      // 繪製底圖
      ctx.drawImage(baseImg, 0, 0, CARD_CANVAS.width, CARD_CANVAS.height);
      
      // 繪製用戶圖片
      if (imageData) {
        const userImg = new Image();
        await new Promise((resolve) => {
          userImg.onload = resolve;
          userImg.onerror = resolve;
          userImg.src = imageData;
        });
        
        if (userImg.complete && userImg.naturalWidth > 0) {
          const imgAspect = userImg.naturalWidth / userImg.naturalHeight;
          const areaAspect = CARD_IMAGE_AREA.width / CARD_IMAGE_AREA.height;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspect > areaAspect) {
            drawHeight = CARD_IMAGE_AREA.height;
            drawWidth = drawHeight * imgAspect;
            const offsetPixels = (drawWidth - CARD_IMAGE_AREA.width) * formData.imageOffsetX / 100;
            drawX = CARD_IMAGE_AREA.x - (drawWidth - CARD_IMAGE_AREA.width) / 2 + offsetPixels;
            drawY = CARD_IMAGE_AREA.y;
          } else {
            drawWidth = CARD_IMAGE_AREA.width;
            drawHeight = drawWidth / imgAspect;
            drawX = CARD_IMAGE_AREA.x;
            drawY = CARD_IMAGE_AREA.y - (drawHeight - CARD_IMAGE_AREA.height) / 2;
          }
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(CARD_IMAGE_AREA.x, CARD_IMAGE_AREA.y, CARD_IMAGE_AREA.width, CARD_IMAGE_AREA.height);
          ctx.clip();
          
          ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        }
      }
      
      // 繪製QR Code
      if (formData.showQRCode && formData.websiteUrl) {
        try {
          const qrCanvas = await generateQRCodeCanvas(formData.websiteUrl, {
            width: CARD_QR_CODE.size - CARD_QR_CODE.contentPadding,
            margin: 0,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          if (qrCanvas) {
            const qrSize = CARD_QR_CODE.size - CARD_QR_CODE.contentPadding;
            const qrX = CARD_CANVAS.width - qrSize;
            const qrY = CARD_CANVAS.height - qrSize;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(
              qrX - CARD_QR_CODE.backgroundPadding,
              qrY - CARD_QR_CODE.backgroundPadding,
              qrSize,
              qrSize
            );
          
            
            ctx.drawImage(
              qrCanvas,
              qrX,
              qrY,
              qrSize - CARD_QR_CODE.contentPadding,
              qrSize - CARD_QR_CODE.contentPadding
            );
          }
        } catch (qrError) {
          console.error('QR Code繪製失敗:', qrError);
        }
      }

      // 繪製文字
      ctx.fillStyle = '#303030';
      
      // 標題支持以空格或手動換行分行，並根據行數垂直居中顯示
      if (formData.title) {
        ctx.font = ` ${CARD_TEXT.title.fontSize}px ${CARD_TEXT.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleLines = formData.title
          .split(/\r?\n/)
          .flatMap((line) => {
            if (!line) {
              return [''];
            }

            return line
              .split(/ +/)
              .filter((segment) => segment.length > 0);
          });
        const lineHeight = CARD_TEXT.title.lineHeight;
        const centerY = CARD_TEXT.title.centerY;
        const startY = centerY - ((titleLines.length - 1) * lineHeight) / 2;

        titleLines.forEach((line, index) => {
          ctx.fillText(line, CARD_TEXT.title.x, startY + lineHeight * index);
        });
      }

      if (formData.nickname) {
        ctx.font = ` ${CARD_TEXT.nickname.fontSize}px ${CARD_TEXT.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formData.nickname, CARD_TEXT.nickname.x, CARD_TEXT.nickname.y);
      }
      
      if (formData.category) {
        ctx.font = ` ${CARD_TEXT.category.fontSize}px ${CARD_TEXT.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formData.category, CARD_TEXT.category.x, CARD_TEXT.category.y);
      }
      
      // 貼合使用者的輸入訊息，進行自動換行處理
      if (formData.message) {
        ctx.font = ` ${CARD_TEXT.message.fontSize}px ${CARD_TEXT.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const maxWidth = CARD_TEXT.message.maxWidth;
        const lineHeight = CARD_TEXT.message.lineHeight;
        const startY = CARD_TEXT.message.startY;
        const messageX = CARD_TEXT.message.x;
        const inputLines = formData.message.split(/\r?\n/);
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

      if (formData.date || formData.cosrole) {
        ctx.fillStyle = 'white';
        ctx.font = ` ${CARD_TEXT.dateRole.fontSize}px ${CARD_TEXT.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const dateText = formData.date ? formatDateToMMDD(formData.date) : '';
        const roleText = formData.cosrole || '';
        let displayText = '';
        
        if (dateText && roleText) {
          displayText = `${dateText} ${roleText}`;
        } else if (dateText) {
          displayText = dateText;
        } else if (roleText) {
          displayText = roleText;
        }
        
        if (displayText) {
          ctx.fillText(displayText, CARD_TEXT.dateRole.x, CARD_TEXT.dateRole.y);
        }
      }
      
      ctx.fillStyle = '#2c3e50';

      return canvas.toDataURL();
      
    } catch (error) {
      console.error('渲染Canvas時發生錯誤:', error);
      return null;
    } finally {
      setIsLoading(false);
      // 清除渲染標記
      isRenderingRef.current = false;
    }
  }, [formDataString, imageData, createDefaultBaseImage, generateQRCodeCanvas, formatDateToMMDD, formData]);

  // 創建防抖版本的 renderCanvas
  const debouncedRenderCanvas = useCallback(() => {
    // 清除之前的計時器
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    // 設置新的計時器
    renderTimeoutRef.current = setTimeout(() => {
      renderCanvas();
    }, 300); // 300ms 防抖延遲
  }, [renderCanvas]);

  const downloadCard = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = CARD_CANVAS.downloadWidth;
      tempCanvas.height = CARD_CANVAS.downloadHeight;
      
      const originalCanvas = canvasRef.current;
      canvasRef.current = tempCanvas;
      
      await renderCanvas();
      
      const link = document.createElement('a');
      link.download = `card-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png', 1.0);
      link.click();
      
      canvasRef.current = originalCanvas;
      
    } catch (error) {
      console.error('下載失敗:', error);
      alert('下載失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  }, [renderCanvas]);

  return {
    formData,
    imageData,
    isLoading,
    showModal,
    canvasRef,
    updateFormData,
    formatDateToMMDD,
    handleImageUpload,
    renderCanvas: debouncedRenderCanvas, // 返回防抖版本
    downloadCard,
    setShowModal
  };
};