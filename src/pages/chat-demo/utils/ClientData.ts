import { v4 as uuidv4 } from 'uuid';
import socketManager from '../../../manage/utils/Socket';
import eventHub from '../../../manage/utils/EventHub';
import { MESSAGE_TYPE } from '../../../constants/static';
import { generateRequestId, arrayUnique } from '../../../utils/util';

function safeEmit(event: string, ...args: any[]) {
  try {
    eventHub.emit(event, ...args);
  } catch (error) {
    console.error(`Error emitting event '${event}':`, error);
  }
}

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

class ClientData {
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

  constructor() {
    this.init();
  }

  init() {
    this.queryConfigInfo();
    this.listenReplyMsg();
    this.listenReference();
    this.listenTokenStat();
    this.listenThought();
  }

  // Try to read initial bot config from various sources (window/localStorage)
  private readInitialBotInfo(): any | null {
    try {
      const w: any = window as any;
      const fromWindow = w.qbotConfig || w.__QBOT_INIT__ || null;
      if (fromWindow) {
        console.log('【clientData】Initial bot config found in window:', fromWindow);
        return fromWindow;
      }
      const fromStorageRaw = localStorage.getItem('qbot_config');
      if (fromStorageRaw) {
        const parsed = JSON.parse(fromStorageRaw);
        console.log('【clientData】Initial bot config found in localStorage:', parsed);
        return parsed;
      }
    } catch (e) {
      console.warn('【clientData】Failed to read initial bot config:', e);
    }
    return null;
  }

  // Normalize backend payload shapes into UI expected config
  private normalizeBotInfo(input: any): any | null {
    if (!input) return null;
    const src = input.data || input.payload || input;
    if (!src || typeof src !== 'object') return null;

    const name = src.name || src.bot_name || src.title || '';
    const avatar = src.avatar || src.avatar_url || src.icon || '';
    const is_available = typeof src.is_available === 'boolean' ? src.is_available : (src.enable ?? true);
    const bot_biz_id = src.bot_biz_id || src.biz_id || src.app_id || src.botId || '';
    const extra = src.extra || {};

    return {
      name,
      avatar,
      is_available,
      bot_biz_id,
      ...extra
    };
  }

  async queryConfigInfo() {
    try {
      const sessionInfo = await this.createSession();
      console.log('🔧 createsession, res', sessionInfo);
      console.log('🔧 Setting session_id to:', sessionInfo.data.session_id);
      
      if (sessionInfo.code === 0) {
        this.cache.session_id = sessionInfo.data.session_id;
        console.log('🔧 Session ID set successfully:', this.cache.session_id);
      } else {
        console.error('获取会话ID失败，请重试');
      }

      // Defaults (fallback)
      const defaultInfo = {
        name: '测试机器人',
        avatar: 'https://qbot-1251316161.cos.ap-nanjing.myqcloud.com/avatar.png',
        is_available: true,
        bot_biz_id: '1664519736704069632'
      };

      const initial = this.readInitialBotInfo();
      const normalized = this.normalizeBotInfo(initial) || defaultInfo;

      this.cache.configInfo = { ...normalized, session_id: sessionInfo.data.session_id };
      console.log('【clientData】Initialized config info:', this.cache.configInfo);
      safeEmit('client_configChange', this.cache.configInfo);
    } catch (e) {
      console.error('获取会话信息失败，请刷新页面重试！');
    }
  }

  async createSession() {
    const session_id = uuidv4();
    return { code: 0, data: { session_id } };
  }

  getConfigInfo() {
    return this.cache.configInfo;
  }

  async triggerSendMsg(msg: string) {
    console.log('🔥 clientData.triggerSendMsg called with:', msg);
    console.log('🔥 cache.configInfo:', this.cache.configInfo);
    
    if (!this.cache.configInfo || !this.cache.configInfo.session_id) {
      console.log('🔥 No config info, calling queryConfigInfo...');
      await this.queryConfigInfo();
    }

    const requestId = generateRequestId();

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

    console.log('🔥 About to emit socket message:', {
      request_id: requestId,
      session_id: this.cache.configInfo ? this.cache.configInfo.session_id : 0,
      content: msg
    });
    
    socketManager.emit('send', {
      request_id: requestId,
      session_id: this.cache.configInfo ? this.cache.configInfo.session_id : 0,
      content: msg
    });
    
    console.log('🔥 Socket message emitted successfully');
  }

  listenReplyMsg() {
    socketManager.on('reply', (data) => {
      console.log('📦 ClientData.listenReplyMsg received reply:', data);
      console.log('📦 Session check:', { dataSession: data.session_id, cacheSession: this.cache.session_id });
      
      if (data.session_id !== this.cache.session_id) return;
      
      const findedMsg = this.getMsgById(data.record_id);
      console.log('📦 Found message:', findedMsg);
      if (findedMsg && findedMsg.is_final) return;

      if (data.quote_infos && data.quote_infos.length > 0) {
        const quoteMock = data.quote_infos.reduce((acc: any[], curr: any) => {
          const existingItem = acc.find(item => item.position === curr.position);
          let res = {};
          
          if (findedMsg && findedMsg.references && findedMsg.references.length > 0) {
            res = findedMsg.references.find((i: any) => i.id === curr.index.toString());
          }
          
          if (existingItem) {
            existingItem.tag.push({ ...res, id: curr.index });
          } else {
            acc.push({
              tag: [{ ...res, id: curr.index }],
              position: curr.position
            });
          }
          return acc;
        }, []);

        data.quote_infos = quoteMock.sort((a: any, b: any) => b.position - a.position);

        data.quote_infos.forEach((item: any) => {
          const tagIds = item.tag.map((tag: any) => tag.id);
          const tagString = `[${tagIds.join(',')}](@ref)`;
          data.content = data.content.slice(0, item.position) + tagString + data.content.slice(item.position);
        });
      }

      this.assembleMsgContent(data, MESSAGE_TYPE.ANSWER);
    });
  }

  listenReference() {
    socketManager.on('reference', (data) => {
      const findedMsg = this.getMsgById(data.record_id);

      if (findedMsg) {
        findedMsg.references = data.references.filter((reference: any) => reference.type !== 1);
        safeEmit('client_msgContentChange', {
          chatsContent: this.cache.chatsContent,
          type: 'R'
        });
      }
    });
  }

  listenTokenStat() {
    socketManager.on('token_stat', (data) => {
      try {
        // Debug: trace raw token_stat payload
        console.log('[ClientData] token_stat received:', JSON.stringify(data));
      } catch (e) {
        console.log('[ClientData] token_stat received (non-serializable):', data);
      }
      safeEmit('token_state_change', data);
      
      if (data.session_id !== this.cache.session_id) return;
      
      let loadingMsg = this.cache.chatsContent.find((el) => el.loading_message);
      let loadingText = '思考中';
      
      if (loadingMsg) {
        if (data.procedures && data.procedures.length > 0) {
          loadingText = data.procedures[data.procedures.length - 1].title || '思考中';
        }
        
        let currentList = this.cache.chatsContent;
        currentList.forEach((el: any) => {
          if (el.loading_message) {
            el.text = loadingText;
            el.record_id = data.record_id;
            el.tokens_msg = data;
            
            if ((window as any).webimToken && (window as any).webimToken[0].pattern === 'standard') {
              el.is_final = false;
            }
          }
        });
        console.log('[ClientData] token_stat applied to loading message. record_id:', data.record_id);
        
        safeEmit('client_msgContentChange', {
          chatsContent: this.cache.chatsContent,
          type: MESSAGE_TYPE.ANSWER
        });
      } else {
        let findedMsg = this.cache.chatsContent.find(
          (el) => el.record_id === data.record_id
        );
        
        if (!findedMsg) return;
        findedMsg.tokens_msg = data;
        console.log('[ClientData] token_stat applied to existing message. record_id:', data.record_id);

        safeEmit('client_msgContentChange', {
          chatsContent: this.cache.chatsContent,
          type: MESSAGE_TYPE.ANSWER
        });
      }
    });
  }

  listenThought() {
    socketManager.on('thought', (data) => {
      if (data.session_id !== this.cache.session_id) return;
      
      let findedMsg = this.cache.chatsContent.find(
        (el) => el.record_id === data.record_id
      );
      
      if (!findedMsg) return;
      
      if (data && data.procedures && data.procedures.length > 0) {
        data.procedures.forEach((el: any) => {
          el.show_type = this.getShowType(el);
          
          if (this.getShowType(el) === 'search-reference') {
            let quote_infos = el.debugging && el.debugging.quote_infos;
            let references = el.debugging && el.debugging.references && 
              el.debugging.references.map((m: any) => ({ ...m, id: m.index }));
            el.debugging.references = references || [];

            let content = el.debugging && el.debugging.display_content;
            
            if (quote_infos && quote_infos.length > 0) {
              el.display_content = this.handeLittleTagsData(quote_infos, references, content);
            } else {
              el.display_content = content || '';
            }
          } else {
            let content = el.debugging && el.debugging.display_content;
            el.display_content = content || '';
          }
        });
      }
      
      findedMsg.agent_thought = data;

      safeEmit('client_msgContentChange', {
        chatsContent: this.cache.chatsContent,
        type: MESSAGE_TYPE.ANSWER
      });
    });
  }

  getShowType(item: any) {
    if (item.name === 'thought') {
      return 'md';
    } else if (item.status === 'success') {
      if (item.debugging && item.debugging.display_type === 1) {
        return 'search-reference';
      } else if (item.debugging && item.debugging.display_type === 2) {
        return 'knowledge-reference';
      } else {
        return 'json';
      }
    } else {
      return 'json';
    }
  }

  handeLittleTagsData(quote_infos: any[], references: any[], content: string) {
    let res = '';
    
    if (quote_infos && quote_infos.length > 0) {
      const quoteMock = quote_infos.reduce((acc: any[], curr: any) => {
        const existingItem = acc.find(item => item.position === curr.position);
        let res = {};
        
        if (references && references.length > 0) {
          res = references.find(i => i.id === curr.index.toString());
        }
        
        if (existingItem) {
          existingItem.tag.push({ ...res, id: curr.index });
        } else {
          acc.push({
            tag: [{ ...res, id: curr.index }],
            position: curr.position
          });
        }
        return acc;
      }, []);

      let sortQuote = quoteMock.sort((a, b) => b.position - a.position);
      
      sortQuote.forEach((item: any) => {
        const tagIds = item.tag.map((tag: any) => tag.id);
        const tagString = `[${tagIds.join(',')}](@ref)`;
        res = content.slice(0, item.position) + tagString + content.slice(item.position);
      });

      return res;
    } else {
      return content;
    }
  }

  assembleMsgContent(msgList: any, type: string) {
    console.log('📦 ClientData.assembleMsgContent called:', { msgList, type, currentLength: this.cache.chatsContent.length });
    let newMsg = msgList;

    if (type === MESSAGE_TYPE.QUESTION) {
      this.cache.chatsContent.push(newMsg);
      console.log('📦 Added question message, total messages:', this.cache.chatsContent.length);
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
          let tmp = {
            ...newMsg,
            transfer,
            quit,
            transferRobot
          };

          if (currentList[i].tokens_msg) {
            tmp = { ...tmp, tokens_msg: currentList[i].tokens_msg };
          }

          if (currentList[i].agent_thought) {
            tmp = { ...tmp, agent_thought: currentList[i].agent_thought };
          }

          if (currentList[i].references) {
            tmp = { ...tmp, references: currentList[i].references };
          }

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

    console.log('📦 Emitting client_msgContentChange event:', {
      chatsContent: this.cache.chatsContent,
      type,
      finalLength: this.cache.chatsContent.length
    });

    safeEmit('client_msgContentChange', {
      chatsContent: this.cache.chatsContent,
      type
    });
  }

  getChatsContent() {
    return this.cache.chatsContent || [];
  }

  getMsgById(msgId: string) {
    return this.cache.chatsContent.find((r) => r.record_id === msgId);
  }

  stopGeneration() {
    const ongoingMsg = this.cache.chatsContent.find((r) => r.is_final === false);
    if (!ongoingMsg) return;

    socketManager.emit('stop_generation', {
      record_id: ongoingMsg.record_id
    });

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

  destroy() {
    Object.keys(this.timeoutTasks).forEach((key: string) => {
      clearTimeout(this.timeoutTasks[key]);
    });
  }
}

export const clientData = new ClientData();
export default clientData;