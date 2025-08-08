export const ACCESS_TYPE = 'ws'; // ws or sse 标志链接方式
export const APP_KEY = 'YaZmSZMeEOfKgLmQcjRzkgldypJjeHZwuvuMNTDiZOJzsrOXeffEQIjdLZRizBEmiMePEGRBGOhbbENKKzbipdTmINQRKVVxgbusSutRhbuwbKhwvHnVhrFKNNKxnkJy'; // 体验机器人的appkey

// type: Q-问题，A-答案，H-历史消息，S-停止生成，C-结束会话，T-转接会话，R-参考来源，F-点赞/点踩回执
export const MESSAGE_TYPE = {
  QUESTION: 'Q',
  ANSWER: 'A',
  HISTORY: 'H',
  STOP: 'S',
  CLOSE: 'C',
  TRANSFER: 'T',
  REFERENCE: 'R',
  FEEDBACK: 'F',
  WORKBENCH_HISTORY: 'WH'
};