import { useCallback } from 'react';
import QRCode from 'qrcode';

export const useQRCode = () => {
  const generateQRCodeCanvas = useCallback(async (text, options = {}) => {
    try {
      const canvas = document.createElement('canvas');
      const defaultOptions = {
        width: 110.9,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M',
        ...options
      };

      await QRCode.toCanvas(canvas, text, defaultOptions);
      return canvas;
    } catch (error) {
      console.error('> QR Code Canvas生成失敗:', error);
      return null;
    }
  }, []);

  return {
    generateQRCodeCanvas
  };
};