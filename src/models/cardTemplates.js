/**
 * 卡片模板統一定義
 * 包含所有支援的卡片模板配置，每個模板定義了畫布尺寸、圖片槽和文字位置
 */

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
        centerY: 236.1,
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
        centerY: 236.1,
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
      width: 1470,
      height: 980,
      downloadWidth: 1470,
      downloadHeight: 980
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
        x: 38.8,
        y: 298.6,
        width: 439.5,
        height: 456.7
      },
      {
        key: 'd2',
        label: '第二天',
        x: 513.3,
        y: 298.6,
        width: 439.5,
        height: 456.7
      },
      {
        key: 'd3',
        label: '第三天',
        x: 991.7,
        y: 298.6,
        width: 439.5,
        height: 456.7
      }
    ],
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      title: {
        fontSize: 36,
        x: 201,
        centerY: 128.45,
        lineHeight: 38
      },
      nickname: {
        fontSize: 36,
        x: 557,
        y: 154.75,
      },
      category: {
        fontSize: 36,
        x: 913,
        y: 154.75,
      },
      message: {
        fontSize: 30,
        x: 1269,
        centerY: 154.75,
        lineHeight: 36
      },
      dateRole: {
        fontSize: 26,
        x: 258.55,
        y: 781.6
      }
    }
  },
  '4p': {
    // 底圖來源
    baseImagePath: '/img/card_base_4p.png',
    // 畫布配置
    canvas: {
      width: 1690,
      height: 980,
      downloadWidth: 1690,
      downloadHeight: 980
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
        x: 32.5,
        y: 294.5,
        width: 380,
        height: 456.7
      },
      {
        key: 'd2',
        label: '第二天',
        x: 447.5,
        y: 294.5,
        width: 380,
        height: 456.7
      },
      {
        key: 'd3',
        label: '第三天',
        x: 862.5,
        y: 294.5,
        width: 380,
        height: 456.7
      },
      {
        key: 'd4',
        label: '第四天',
        x: 1277.5,
        y: 294.5,
        width: 380,
        height: 456.7
      }
    ],
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      title: {
        fontSize: 36,
        x: 194.7,
        centerY: 124.35,
        lineHeight: 38
      },
      nickname: {
        fontSize: 36,
        x: 544.1,
        y: 150.65,
      },
      category: {
        fontSize: 36,
        x: 913.4,
        y: 150.65,
      },
      message: {
        fontSize: 30,
        x: 1495.3,
        centerY: 150.65,
        lineHeight: 36
      },
      dateRole: {
        fontSize: 26,
        x: 222.5,
        y: 777.6
      }
    }
  }
};
