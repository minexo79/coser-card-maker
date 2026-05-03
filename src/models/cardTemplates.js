/**
 * 卡片模板統一定義
 * 包含所有支援的卡片模板配置，每個模板定義了畫布尺寸、圖片槽和文字位置
 */

export const CARD_TEMPLATES = {
  '1p': {
    // 底圖來源
    baseImagePath: './img/card_base_1p.png',
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
        height: 532.7,
        dateRole: {
          fontSize: 26,
          x: 390.3,
          y: 616.4,
          width: 439.5,
          height: 52.6
        }
      }
    ],
    titleImage: {
      fontSize: 36,
      x: 30.8,
      y: 31,
      width: 324.4,
      height: 204.5,
    },
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      nickname: {
        fontSize: 36,
        x: 30.8,
        y: 323.2,
        width: 324.4,
        height: 129.1
      },
      category: {
        fontSize: 36,
        x: 30.8,
        y: 539.9,
        width: 324.4,
        height: 129.1
      },
      message: {
        fontSize: 30,
        x: 864.8,
        y: 31,
        width: 324.4,
        height: 341.8,
        lineHeight: 42
      }
    }
  },
  '2p': {
    // 底圖來源
    baseImagePath: './img/card_base_2p.png',
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
        height: 532.7,
        dateRole: {
          fontSize: 26,
          x: 390.3,
          y: 616.4,
          width: 439.5,
          height: 52.6
        }
      },
      {
        key: 'd2',
        label: '第二天',
        x: 867.5,
        y: 83.6,
        width: 439.5,
        height: 532.7,
        dateRole: {
          fontSize: 26,
          x: 867.5,
          y: 616.4,
          width: 439.5,
          height: 52.6
        }
      }
    ],
    titleImage: {
      fontSize: 36,
      x: 33.6,
      y: 31,
      width: 324.4,
      height: 204.5,
    },
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      nickname: {
        fontSize: 36,
        x: 33.6,
        y: 323.2,
        width: 324.4,
        height: 129.1
      },
      category: {
        fontSize: 36,
        x: 33.6,
        y: 539.9,
        width: 324.4,
        height: 129.1
      },
      message: {
        fontSize: 30,
        x: 1342,
        y: 83.6,
        width: 324.4,
        height: 289.2,
        lineHeight: 42
      }
    }
  },
  '3p': {
    // 底圖來源
    baseImagePath: './img/card_base_3p.png',
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
        height: 456.7,
        dateRole: {
          fontSize: 26,
          x: 38.8,
          y: 757.6,
          width: 439.5,
          height: 52.6
        }
      },
      {
        key: 'd2',
        label: '第二天',
        x: 513.3,
        y: 300.8,
        width: 439.5,
        height: 456.7,
        dateRole: {
          fontSize: 26,
          x: 513.3,
          y: 757.6,
          width: 439.5,
          height: 52.6
        }
      },
      {
        key: 'd3',
        label: '第三天',
        x: 991.7,
        y: 300.8,
        width: 439.5,
        height: 456.7,
        dateRole: {
          fontSize: 26,
          x: 991.7,
          y: 757.6,
          width: 439.5,
          height: 52.6
        }
      }
    ],
    titleImage: {
      fontSize: 36,
      x: 38.8,
      y: 39.8,
      width: 324.4,
      height: 181.7,
    },
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      nickname: {
        fontSize: 36,
        x: 394.8,
        y: 92.4,
        width: 324.4,
        height: 129.1,
      },
      category: {
        fontSize: 36,
        x: 750.8,
        y: 92.4,
        width: 324.4,
        height: 129.1,
      },
      message: {
        fontSize: 26,
        x: 1106.8,
        y: 92.4,
        width: 324.4,
        height: 129.1,
        lineHeight: 38
      }
    }
  },
  '4p': {
    // 底圖來源
    baseImagePath: './img/card_base_4p.png',
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
        height: 456.7,
        dateRole: {
          fontSize: 26,
          x: 32.5,
          y: 757.6,
          width: 380,
          height: 52.6
        }
      },
      {
        key: 'd2',
        label: '第二天',
        x: 447.5,
        y: 300.8,
        width: 380,
        height: 456.7,
        dateRole: {
          fontSize: 26,
          x: 447.5,
          y: 757.6,
          width: 380,
          height: 52.6
        }
      },
      {
        key: 'd3',
        label: '第三天',
        x: 862.5,
        y: 300.8,
        width: 380,
        height: 456.7,
        dateRole: {
          fontSize: 26,
          x: 862.5,
          y: 757.6,
          width: 380,
          height: 52.6
        }
      },
      {
        key: 'd4',
        label: '第四天',
        x: 1277.5,
        y: 300.8,
        width: 380,
        height: 456.7,
        dateRole: {
          fontSize: 26,
          x: 1277.5,
          y: 757.6,
          width: 380,
          height: 52.6
        }
      }
    ],
    titleImage: {
      fontSize: 36,
      x: 32.5,
      y: 39.8,
      width: 324.4,
      height: 181.7,
    },
    // 文字位置配置
    textPositions: {
      fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
      nickname: {
        fontSize: 36,
        x: 391.9,
        y: 92.4,
        width: 324.4,
        height: 129.1,
      },
      category: {
        fontSize: 36,
        x: 751.2,
        y: 92.4,
        width: 324.4,
        height: 129.1,
      },
      message: {
        fontSize: 26,
        x: 1333.1,
        y: 92.4,
        width: 324.4,
        height: 129.1,
        lineHeight: 38
      }
    }
  }
};
