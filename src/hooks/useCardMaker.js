import { useState, useCallback, useRef, useMemo } from 'react';
import { useQRCode } from './useQRCode';

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
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('圖片檔案太大，請選擇小於 10MB 的圖片');
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
    canvas.width = 1000;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, 1000, 960);

    ctx.strokeStyle = '#4682b4';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 780, 780);

    ctx.fillStyle = 'rgba(250, 250, 250, 0.8)';
    ctx.fillRect(20, 60, 320, 720);
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 60, 320, 720);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(360, 60, 270, 610);
    ctx.strokeStyle = '#969696';
    ctx.lineWidth = 2;
    ctx.strokeRect(360, 60, 270, 610);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 416, 320, 64);
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 416, 320, 64);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 560, 320, 200);
    ctx.strokeRect(20, 560, 320, 200);

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
      
      canvas.width = 1000;
      canvas.height = 960;
      
      // 載入底圖
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        baseImg.onload = resolve;
        baseImg.onerror = () => {
          baseImg.src = createDefaultBaseImage();
          baseImg.onload = resolve;
        };
        baseImg.src = '/img/card_base.png';
      });
      
      // 繪製底圖
      ctx.drawImage(baseImg, 0, 0, 1000, 960);
      
      // 繪製用戶圖片
      if (imageData) {
        const userImg = new Image();
        await new Promise((resolve) => {
          userImg.onload = resolve;
          userImg.onerror = resolve;
          userImg.src = imageData;
        });
        
        if (userImg.complete && userImg.naturalWidth > 0) {
          const imgArea = {
            x: 515.7,
            y: 75.6,
            width: 439,
            height: 761
          };
          
          const imgAspect = userImg.naturalWidth / userImg.naturalHeight;
          const areaAspect = imgArea.width / imgArea.height;
          
          let drawWidth, drawHeight, drawX, drawY;
          
          if (imgAspect > areaAspect) {
            drawHeight = imgArea.height;
            drawWidth = drawHeight * imgAspect;
            const offsetPixels = (drawWidth - imgArea.width) * formData.imageOffsetX / 100;
            drawX = imgArea.x - (drawWidth - imgArea.width) / 2 + offsetPixels;
            drawY = imgArea.y;
          } else {
            drawWidth = imgArea.width;
            drawHeight = drawWidth / imgAspect;
            drawX = imgArea.x;
            drawY = imgArea.y - (drawHeight - imgArea.height) / 2;
          }
          
          ctx.save();
          ctx.beginPath();
          ctx.rect(imgArea.x, imgArea.y, imgArea.width, imgArea.height);
          ctx.clip();
          
          ctx.drawImage(userImg, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        }
      }
      
      // 繪製QR Code
      if (formData.showQRCode && formData.websiteUrl) {
        try {
          const qrCanvas = await generateQRCodeCanvas(formData.websiteUrl, {
            width: 110.9,
            margin: 0,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          if (qrCanvas) {
            const qrSize = 110.9;
            const qrX = 1000 - qrSize;
            const qrY = 960 - qrSize;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(qrX - 5, qrY - 5, qrSize + 5, qrSize + 5);
            
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 1;
            ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 5, qrSize + 5);
            
            ctx.drawImage(qrCanvas, qrX, qrY, qrSize - 5, qrSize - 5);
            
            ctx.fillStyle = '#666666';
            ctx.font = '10px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('掃碼訪問', qrX + qrSize/2, qrY + qrSize + 15);
          }
        } catch (qrError) {
          console.error('QR Code繪製失敗:', qrError);
        }
      }

      // 繪製文字
      ctx.fillStyle = '#2c3e50';
      
      if (formData.title) {
        ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formData.title, 261.1, 140.15);
      }

      if (formData.nickname) {
        ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formData.nickname, 261.1, 351.15);
      }
      
      if (formData.category) {
        ctx.font = 'bold 36px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(formData.category, 261.1, 562.15);
      }
      
      if (formData.message) {
        ctx.font = 'bold 26px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const maxWidth = 400;
        const lineHeight = 20;
        const words = formData.message.split('');
        let line = '';
        let y = 725;
        
        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i];
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, 261.1, y);
            line = words[i];
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 261.1, y);
      }

      if (formData.date || formData.cosrole) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial, Helvetica, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const dateText = formData.date ? formatDateToMMDD(formData.date) : '';
        const roleText = formData.cosrole || '';
        let displayText = '';
        
        if (dateText && roleText) {
          displayText = `${dateText} / ${roleText}`;
        } else if (dateText) {
          displayText = dateText;
        } else if (roleText) {
          displayText = roleText;
        }
        
        if (displayText) {
          ctx.fillText(displayText, 735.45, 49.3);
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
      tempCanvas.width = 1000;
      tempCanvas.height = 960;
      
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