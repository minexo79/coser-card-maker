export const CARD_CANVAS = {
  width: 1220,
  height: 850,
  downloadWidth: 1220,
  downloadHeight: 850
};

export const CARD_UPLOAD = {
  maxFileSizeBytes: 5 * 1024 * 1024
};

export const CARD_QR_CODE = {
  size: 152,
  contentPadding: 10,
  backgroundPadding: 5
};

export const DEFAULT_BASE_IMAGE_LAYOUT = {
  background: {
    x: 0,
    y: 0,
    width: 1000,
    height: 960
  },
  outerBorder: {
    x: 10,
    y: 10,
    width: 780,
    height: 780,
    lineWidth: 3
  },
  leftPanel: {
    x: 20,
    y: 60,
    width: 320,
    height: 720,
    lineWidth: 1
  },
  imagePanel: {
    x: 360,
    y: 60,
    width: 270,
    height: 610,
    lineWidth: 2
  },
  namePanel: {
    x: 20,
    y: 416,
    width: 320,
    height: 64,
    lineWidth: 1
  },
  messagePanel: {
    x: 20,
    y: 560,
    width: 320,
    height: 200
  }
};

export const CARD_IMAGE_AREA = {
  x: 390.3,
  y: 87.3,
  width: 439.5,
  height: 532.7
};

export const CARD_TEXT = {
  fontFamily: 'LINESeedTW, Arial, Helvetica, sans-serif',
  title: {
    fontSize: 36,
    x: 1027,
    centerY: 136.25,
    lineHeight: 38
  },
  nickname: {
    fontSize: 36,
    x: 1027,
    y: 391.35
  },
  category: {
    fontSize: 36,
    x: 1027,
    y: 608.05
  },
  message: {
    fontSize: 30,
    x: 193.1,
    startY: 364.7,
    maxWidth: 300,
    lineHeight: 36
  },
  dateRole: {
    fontSize: 26,
    x: 610.05,
    y: 646.3
  }
};