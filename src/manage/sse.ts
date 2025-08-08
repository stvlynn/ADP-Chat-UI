import { fetchEventSource } from '@microsoft/fetch-event-source';
import { v4 as uuidv4 } from 'uuid';
import eventHub from './utils/EventHub';
import { MESSAGE_TYPE, APP_KEY } from '../constants/static';
import { arrayUnique } from '../utils/util';

function safeEmit(event: string, ...args: any[]) {
  try {
    eventHub.emit(event, ...args);
  } catch (error) {
    console.error(`Error emitting event '${event}':`, error);
  }
}

const origin = process.env.SSE_BASE_URL || 'https://wss.lke.cloud.tencent.com';
const path = '/v1/qbot/chat/sse';
const sseUrl = origin + path;

interface Cache {
  session_id: string;
  configInfo: any;
  chatsContent: any[];
  systemEvents: any[];
  transferInfo: {
    transferStatus: boolean;
    transferAvatar: string;
  };
}

class SSEManager {
  private cache: Cache = {
    session_id: '',
    configInfo: null,
    chatsContent: [],
    systemEvents: [],
    transferInfo: {
      transferStatus: false,
      transferAvatar: ''
    }
  };
  private timeoutTasks: { [key: string]: NodeJS.Timeout } = {};
  private msgSendTimeout = 2 * 60 * 1000;
  private sseController: AbortController | null = null;

  constructor() {
    this.init();
  }

  init() {
    this.queryConfigInfo();
  }

  // Try to read initial bot config from various sources (window/localStorage)
  private readInitialBotInfo(): any | null {
    try {
      const w: any = window as any;
      const fromWindow = w.qbotConfig || w.__QBOT_INIT__ || null;
      if (fromWindow) {
        console.log('【sse】Initial bot config found in window:', fromWindow);
        return fromWindow;
      }
      const fromStorageRaw = localStorage.getItem('qbot_config');
      if (fromStorageRaw) {
        const parsed = JSON.parse(fromStorageRaw);
        console.log('【sse】Initial bot config found in localStorage:', parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('【sse】Failed to read initial bot config:', e);
    }
    return null;
  }

  // Normalize possible backend payload shapes into the UI's expected config
  private normalizeBotInfo(input: any): any | null {
    if (!input) return null;
    // Some backends wrap data under data or payload
    const src = input.data || input.payload || input;
    if (!src || typeof src !== 'object') return null;

    // Accept multiple key variants
    const name = src.name || src.bot_name || src.title || '';
    const avatar = src.avatar || src.avatar_url || src.icon || '';
    const is_available =
      typeof src.is_available === 'boolean' ? src.is_available : (src.enable ?? true);
    const bot_biz_id = src.bot_biz_id || src.biz_id || src.app_id || src.botId || '';
    const extra = src.extra || {};

    const normalized: any = {
      name,
      avatar,
      is_available,
      bot_biz_id,
      ...extra
    };

    return normalized;
  }

  async queryConfigInfo() {
    try {
      const sessionId = uuidv4();
      this.cache.session_id = sessionId;

      // Defaults (fallback)
      const defaultInfo = {
        name: '测试机器人',
        avatar: 'https://qbot-1251316161.cos.ap-nanjing.myqcloud.com/avatar.png',
        is_available: true,
        bot_biz_id: '1664519736704069632'
      };

      // Try dynamic sources first
      const initial = this.readInitialBotInfo();
      const normalized = this.normalizeBotInfo(initial) || defaultInfo;

      this.cache.configInfo = { ...normalized, session_id: sessionId };
      try {
        localStorage.setItem('qbot_config', JSON.stringify(this.cache.configInfo));
      } catch {}
      console.log('【sse】Initialized config info:', this.cache.configInfo);
      safeEmit('client_configChange', this.cache.configInfo);
    } catch (e) {
      console.error('获取会话信息失败，请刷新页面重试！');
    }
  }

  getConfigInfo() {
    return this.cache.configInfo;
  }

  getChatsContent() {
    return this.cache.chatsContent || [];
  }

  getMsgById(msgId: string) {
    return this.cache.chatsContent.find((r) => r.record_id === msgId);
  }

  async getQASse(data: string, requestId: string) {
    const params = {
      request_id: requestId,
      content: data,
      bot_app_key: APP_KEY,
      visitor_biz_id: '1',
      session_id: this.cache.session_id,
      visitor_labels: []
    };

    this.sseController = new AbortController();

    try {
      await fetchEventSource(sseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params),
        openWhenHidden: true,
        signal: this.sseController.signal,
        onopen: async (response) => {
          console.log('【sse】Connection opened:', response);
        },
        onmessage: (rsp) => {
          console.log('【sse】Message from server:', rsp);
          const event = JSON.parse(rsp.data);
          
          // Some servers may push config/meta events early in the stream
          if (event && (event.type === 'config' || event.type === 'init' || event.type === 'session' || event.type === 'bot_info')) {
            try {
              const maybe = event.payload || event.data || event;
              const normalized = this.normalizeBotInfo(maybe);
              if (normalized) {
                this.cache.configInfo = {
                  ...this.cache.configInfo,
                  ...normalized,
                  session_id: this.cache.session_id
                };
                try {
                  localStorage.setItem('qbot_config', JSON.stringify(this.cache.configInfo));
                } catch {}
                console.log('【sse】Config updated from SSE event:', this.cache.configInfo);
                safeEmit('client_configChange', this.cache.configInfo);
              } else {
                console.log('【sse】Config-like event received but could not normalize:', maybe);
              }
            } catch (err) {
              console.warn('【sse】Failed to apply config from SSE event:', err);
            }
          }

          if (event.type === 'reply') {
            let data = event.payload;
            if (data.session_id !== this.cache.session_id) return;
            
            const findedMsg = this.getMsgById(data.record_id);
            if (findedMsg && findedMsg.is_final) return;
            
            this.assembleMsgContent(data, MESSAGE_TYPE.ANSWER);
          }

          if (event.type === 'error') {
            let rep = event.payload || event;
            if (rep && rep.error) {
              console.error(rep.error.message || '服务出错了！');
            } else {
              console.error('服务出错了！');
            }
          }
        },
        onerror: (error) => {
          console.error('【sse】Error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  }

  async sseSendMsg(msg: string) {
    if (!this.cache.configInfo || !this.cache.configInfo.session_id) {
      await this.queryConfigInfo();
    }

    const requestId = uuidv4();
    console.log('【sse】sseSendMsg', msg, requestId);

    const msgContent = {
      request_id: requestId,
      content: msg,
      is_from_self: true,
      timestamp: +new Date(),
      is_final: true,
      is_loading: true
    };

    this.assembleMsgContent(msgContent, MESSAGE_TYPE.QUESTION);

    this.timeoutTasks[msgContent.request_id] = setTimeout(() => {
      this.assembleMsgContent({
        ...msgContent,
        failed: true
      }, MESSAGE_TYPE.ANSWER);
    }, this.msgSendTimeout);

    this.getQASse(msg, requestId);
  }

  assembleMsgContent(msgList: any, type: string) {
    let newMsg = msgList;

    if (type === MESSAGE_TYPE.QUESTION) {
      this.cache.chatsContent.push(newMsg);
    } else if (type === MESSAGE_TYPE.ANSWER) {
      if (this.cache.chatsContent.length < 1) {
        this.cache.chatsContent.push(newMsg);
      } else {
        let currentList = this.cache.chatsContent;

        if (this.timeoutTasks[newMsg.request_id]) {
          clearTimeout(this.timeoutTasks[newMsg.request_id]);
        }

        for (let i = currentList.length - 1; i >= 0; i--) {
          const { transfer, quit, transferRobot } = currentList[i];
          const tmp = {
            ...newMsg,
            transfer,
            quit,
            transferRobot
          };

          if (newMsg.record_id === currentList[i].record_id) {
            currentList[i] = tmp;
            break;
          }

          if (newMsg.request_id && newMsg.request_id === currentList[i].request_id && newMsg.is_from_self) {
            newMsg.is_loading = false;
            currentList[i] = tmp;
            
            if (!newMsg.is_evil && !this.cache.transferInfo.transferStatus) {
              currentList.push({
                loading_message: true,
                is_from_self: false,
                content: '',
                from_avatar: this.cache.configInfo.avatar,
                timestamp: Number(currentList[i].timestamp)
              });
            }
            break;
          }

          if (Number(newMsg.timestamp) >= Number(currentList[i].timestamp)) {
            if (currentList[i].loading_message) {
              currentList[currentList.length - 1] = newMsg;
            } else {
              currentList.splice(i + 1, 0, newMsg);
            }
            break;
          }

          if (i === 0 && Number(newMsg.timestamp) < Number(currentList[i].timestamp)) {
            currentList.splice(0, 0, newMsg);
          }
        }
      }
    } else if (type === MESSAGE_TYPE.HISTORY) {
      let currentList = this.cache.chatsContent;
      msgList = msgList.map((r: any) => ({
        ...r,
        is_history: true,
        is_final: true
      }));

      if (currentList.length === 0) {
        this.cache.chatsContent = [].concat(msgList);
      } else {
        let oldMsgCurrent = currentList[0];
        let newMsgHistory = msgList[msgList.length - 1];

        if (Number(newMsgHistory.timestamp) < Number(oldMsgCurrent.timestamp)) {
          this.cache.chatsContent = [...msgList, ...this.cache.chatsContent];
        } else {
          msgList.reverse().forEach((msg: any) => {
            for (let i = 0; i < this.cache.chatsContent.length; i++) {
              if (msg.record_id === this.cache.chatsContent[i].record_id) {
                this.cache.chatsContent[i] = msg;
                break;
              } else if (Number(msg.timestamp) <= Number(this.cache.chatsContent[i].timestamp)) {
                this.cache.chatsContent.splice(i, 0, msg);
                break;
              } else if (i === this.cache.chatsContent.length - 1 && Number(msg.timestamp) > Number(this.cache.chatsContent[i].timestamp)) {
                this.cache.chatsContent.splice(i + 1, 0, msg);
              }
            }
          });
        }
      }
    }

    this.cache.chatsContent = arrayUnique(this.cache.chatsContent, 'record_id', 'timestamp');

    safeEmit('client_msgContentChange', {
      chatsContent: this.cache.chatsContent,
      type
    });
  }

  stopGeneration() {
    const ongoingMsg = this.cache.chatsContent.find((r) => r.is_final === false);
    if (!ongoingMsg) return;

    if (this.sseController) {
      this.sseController.abort();
    }

    const findedMsg = this.getMsgById(ongoingMsg.record_id);
    if (findedMsg) {
      findedMsg.is_final = true;
      findedMsg.content = findedMsg.content.concat(`<span class="stop-ws">| 已停止生成</span>`);
      
      safeEmit('client_msgContentChange', {
        chatsContent: this.cache.chatsContent,
        type: MESSAGE_TYPE.STOP
      });
    }
  }
}

export const sseManager = new SSEManager();
export default sseManager;