/**
 * 客製化卡片模板定義
 * 包含天數，開始日期，基礎圖片路徑，以及是否複寫原有設定檔
 */

export const OEM_CARD_TEMPLATES = {
    fgzc01: {
        dayCount: 2,
        startDate: "2026-05-23",
        overWriteCanvas: {
            baseImagePath: "./img/card_base_2p_fgz.png",
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
        }
    }
};