/**
 * 客製化卡片模板定義
 * 包含天數，開始日期，基礎圖片路徑，以及是否複寫原有設定檔
 */

export const OEM_CARD_TEMPLATES = {
    fgzc01: {
        displayName: "蜂格子 Cosplay 同樂會 Vol.1",
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
    },
    acgkfest: {
        displayName: "動漫紀元 次元巡航祭",
        dayCount: 2,
        startDate: "2026-05-30",
        overWriteCanvas: {
            baseImagePath: "./img/card_base_2p_acgkfest.jpg",
            fontColor: '#000000',
            // 畫布配置
            canvas: {
                width: 960,
                height: 540,
                downloadWidth: 960,
                downloadHeight: 540
            },
            // 圖片上傳限制
            upload: {
                maxFileSizeBytes: 5 * 1024 * 1024
            },
            // 圖片槽定義（2p 有兩個）
            imageSlots: [
                {
                    key: 'd1',
                    label: '第一天',
                    x: 306.1,
                    y: 20.2,
                    width: 284.2,
                    height: 416.2,
                    radius: 45
                },
                {
                    key: 'd2',
                    label: '第二天',
                    x: 648.7,
                    y: 20.2,
                    width: 284.2,
                    height: 416.2,
                    radius: 45
                }
            ],
            titleImage: {
                fontSize: 30,
                x: 33.6,
                y: 31,
                width: 324.4,
                height: 204.5,
            },
            // 文字位置配置
            textPositions: {
                fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
                nickname: {
                    fontSize: 30,
                    x: 102.8,
                    y: 213.5,
                    width: 165.9,
                    height: 51.2
                },
                message: {
                    fontSize: 30,
                    x: 22.6,
                    y: 315.4,
                    width: 258.2,
                    height: 216.2,
                    lineHeight: 40
                }
            },
            // 身分選擇位置
            categorySelection: {
                'COSER': {
                    x: 42.4,
                    y: 142.8,
                    width: 71.2,
                    height: 40.2,
                },
                '攝影': {
                    x: 121.4,
                    y: 142.8,
                    width: 71.2,
                    height: 40.2,
                },
                '路人': {
                    x: 188.4,
                    y: 142.8,
                    width: 71.2,
                    height: 40.2,
                }
            }
        }
    }
};