/**
 * 卡片模板統一定義
 * 包含所有支援的卡片模板配置，每個模板定義了畫布尺寸、圖片槽和文字位置
 */

/**
 * 支援的輸出比例
 * 每個比例依模板寬度計算輸出高度，底圖居中，超出部分填背景色
 */
export const ASPECT_RATIOS = {
  '16:9': { label: '16:9', widthRatio: 16, heightRatio: 9 },
  '4:3':  { label: '4:3',  widthRatio: 4,  heightRatio: 3  }
};

export const DEFAULT_ASPECT_RATIO = '16:9';

export const CARD_TEMPLATES = {
  '1p': {
    // 底圖來源
    baseImagePath: '/img/card_base_1p.png',
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
    // 底圖來源
    baseImagePath: '/img/card_base_2p.png',
    // 畫布配置
    canvas: {
      width: 1700,
      height: 850,
      downloadWidth: 1700,
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
    // 圖片槽定義（2p 有兩個）
    imageSlots: [
      {
        key: 'd1',
        label: '第一天',
        x: 390.8,
        y: 87.3,
        width: 439.5,
        height: 532.7
      },
      {
        key: 'd2',
        label: '第二天',
        x: 865.3,
        y: 87.3,
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
        x: 1502,
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
  '3p': {
    // 底圖來源
    baseImagePath: '/img/card_base_3p.png',
    // 畫布配置
    canvas: {
      width: 1960,
      height: 860,
      downloadWidth: 1960,
      downloadHeight: 860
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
    // 圖片槽定義
    imageSlots: [
      {
        key: 'd1',
        label: '第一天',
        x: 394.3,
        y: 87.3,
        width: 367.2,
        height: 532.7
      },
      {
        key: 'd2',
        label: '第二天',
        x: 796.4,
        y: 87.3,
        width: 367.2,
        height: 532.7
      },
      {
        key: 'd3',
        label: '第三天',
        x: 1198.6,
        y: 87.3,
        width: 367.2,
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
        x: 1762.9,
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
  }
};
