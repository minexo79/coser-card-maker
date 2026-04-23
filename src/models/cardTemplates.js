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
      height: 700,
      downloadWidth: 1220,
      downloadHeight: 700
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
        y: 83.6,
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
        y: 387.75
      },
      category: {
        fontSize: 36,
        x: 193.1,
        y: 604.45
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
        y: 642.7
      }
    }
  },
  '2p': {
    // 底圖來源
    baseImagePath: '/img/card_base_2p.png',
    // 畫布配置
    canvas: {
      width: 1700,
      height: 700,
      downloadWidth: 1700,
      downloadHeight: 700
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
        x: 393,
        y: 83.6,
        width: 439.5,
        height: 532.7
      },
      {
        key: 'd2',
        label: '第二天',
        x: 867.5,
        y: 83.6,
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
        y: 387.75
      },
      category: {
        fontSize: 36,
        x: 193.1,
        y: 604.45
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
        y: 642.7
      }
    }
  },
  '3p': {
    // 底圖來源
    baseImagePath: '/img/card_base_3p.png',
    // 畫布配置
    canvas: {
      width: 1470,
      height: 850,
      downloadWidth: 1470,
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
    // 圖片槽定義
    imageSlots: [
      {
        key: 'd1',
        label: '第一天',
        x: 38.8,
        y: 300.8,
        width: 439.5,
        height: 456.7
      },
      {
        key: 'd2',
        label: '第二天',
        x: 513.3,
        y: 300.8,
        width: 439.5,
        height: 456.7
      },
      {
        key: 'd3',
        label: '第三天',
        x: 991.7,
        y: 300.8,
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
        centerY: 130.65,
        lineHeight: 38
      },
      nickname: {
        fontSize: 36,
        x: 557,
        y: 156.95,
      },
      category: {
        fontSize: 36,
        x: 913,
        y: 156.95,
      },
      message: {
        fontSize: 30,
        x: 1269,
        centerY: 156.95,
        lineHeight: 36
      },
      dateRole: {
        fontSize: 26,
        x: 172.5,
        y: 783.9
      }
    }
  },
  '4p': {
    // 底圖來源
    baseImagePath: '/img/card_base_4p.png',
    // 畫布配置
    canvas: {
      width: 1690,
      height: 850,
      downloadWidth: 1690,
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
    // 圖片槽定義
    imageSlots: [
      {
        key: 'd1',
        label: '第一天',
        x: 32.5,
        y: 300.8,
        width: 380,
        height: 456.7
      },
      {
        key: 'd2',
        label: '第二天',
        x: 447.5,
        y: 300.8,
        width: 380,
        height: 456.7
      },
      {
        key: 'd3',
        label: '第三天',
        x: 862.5,
        y: 300.8,
        width: 380,
        height: 456.7
      },
      {
        key: 'd4',
        label: '第四天',
        x: 1277.5,
        y: 300.8,
        width: 380,
        height: 456.7
      }
    ],
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      title: {
        fontSize: 36,
        x: 195,
        centerY: 130.65,
        lineHeight: 38
      },
      nickname: {
        fontSize: 36,
        x: 554.1,
        y: 156.95,
      },
      category: {
        fontSize: 36,
        x: 913.4,
        y: 156.95,
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
        y: 783.9
      }
    }
  }
};
