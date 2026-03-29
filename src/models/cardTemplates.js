/**
 * 卡片模板統一定義
 * 包含所有支援的卡片模板配置，每個模板定義了畫布尺寸、圖片槽和文字位置
 */

export const CARD_TEMPLATES = {
  '1p': {
    // 畫布配置
    canvas: {
      width: 1220,
      height: 850,
      downloadWidth: 1220,
      downloadHeight: 850
    },
    // 圖片上傳限制
    upload: {
      maxFileSizeBytes: 5 * 1024 * 1024
    },
    // QR 碼配置
    qrCode: {
      size: 152,
      contentPadding: 10,
      backgroundPadding: 5
    },
    // 圖片槽定義（1p 只有一個）
    imageSlots: [
      {
        key: 'd1',
        label: '第一天',
        x: 390.3,
        y: 91.5,
        width: 439.5,
        height: 532.7
      }
    ],
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      title: {
        fontSize: 36,
        x: 193.1,
        centerY: 131.15,
        lineHeight: 38
      },
      nickname: {
        fontSize: 36,
        x: 193.1,
        y: 395.55
      },
      category: {
        fontSize: 36,
        x: 193.1,
        y: 612.25
      },
      message: {
        fontSize: 30,
        x: 1027,
        startY: 110,
        maxWidth: 300,
        lineHeight: 36
      },
      dateRole: {
        fontSize: 26,
        x: 610.05,
        y: 650.5
      }
    }
  },
  '2p': {
    // 畫布配置
    canvas: {
      width: null, // 待 Phase 5 補充
      height: null,
      downloadWidth: null,
      downloadHeight: null
    },
    // 圖片上傳限制
    upload: {
      maxFileSizeBytes: 5 * 1024 * 1024
    },
    // QR 碼配置
    qrCode: {
      size: 152,
      contentPadding: 10,
      backgroundPadding: 5
    },
    // 圖片槽定義（2p 有兩個）
    imageSlots: [
      {
        key: 'd1',
        label: '第一天',
        x: null, // 待 Phase 5 補充
        y: null,
        width: null,
        height: null
      },
      {
        key: 'd2',
        label: '第二天',
        x: null, // 待 Phase 5 補充
        y: null,
        width: null,
        height: null
      }
    ],
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      title: {
        fontSize: 36,
        x: null, // 待 Phase 5 補充
        centerY: null,
        lineHeight: 38
      },
      nickname: {
        fontSize: 36,
        x: null, // 待 Phase 5 補充
        y: null
      },
      category: {
        fontSize: 36,
        x: null, // 待 Phase 5 補充
        y: null
      },
      message: {
        fontSize: 30,
        x: null, // 待 Phase 5 補充
        startY: null,
        maxWidth: 300,
        lineHeight: 36
      },
      dateRole: {
        fontSize: 26,
        x: null, // 待相應補充
        y: null
      }
    }
  }
};
