import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { MESSAGE_TYPE, ACCESS_TYPE } from '../../../constants/static';
import clientData from '../utils/ClientData';
import sseManager from '../../../manage/sse';
import eventHub from '../../../manage/utils/EventHub';
import { scrollToBottom } from '../../../utils/util';
import ReferenceComponent from './ReferenceComponent';
import TokensBoardBrief from './TokensBoardBrief';
import MarkdownRenderer from './MarkdownRenderer';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface Message {
  record_id?: string;
  request_id?: string;
  content: string;
  is_from_self: boolean;
  timestamp: number;
  is_final?: boolean;
  is_loading?: boolean;
  loading_message?: boolean;
  from_avatar?: string;
  agent_thought?: any;
  references?: any[];
  tokens_msg?: any;
}

interface ClientChatProps {
  onSend: (question: string) => void;
}

const ClientChat: React.FC<ClientChatProps> = ({ onSend }) => {
  const [msgList, setMsgList] = useState<Message[]>([]);
  const [robotName, setRobotName] = useState('');
  const [chatBoxHeight, setChatBoxHeight] = useState('100%');
  const [jsScrolling, setJsScrolling] = useState(false);
  const [userScrolling, setUserScrolling] = useState(false);
  const [collapsedPanels, setCollapsedPanels] = useState<{[key: string]: boolean}>({});
  const componentId = useRef(`client-chat-${Date.now()}`);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      // Height is now managed by CSS flexbox
    };

    window.addEventListener('resize', handleResize);

    const cachedConfig = ACCESS_TYPE === 'ws' 
      ? clientData.getConfigInfo() 
      : sseManager.getConfigInfo();
    
    if (cachedConfig) {
      setRobotName(cachedConfig.name);
    }

    const handleMsgContentChange = (res: any) => {
      console.log('🎨 handleMsgContentChange called:', res);
      const { chatsContent, type } = res;
      renderMsgList(chatsContent, type);
    };

    eventHub.registerComponent(componentId.current);
    eventHub.on('client_msgContentChange', handleMsgContentChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      eventHub.offComponentEvents(componentId.current);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (msgList.length > 0 && msgList[msgList.length - 1].is_final === false && !jsScrolling) {
        setUserScrolling(true);
      } else {
        setJsScrolling(false);
      }
    };

    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [msgList, jsScrolling]);

  const renderMsgList = (data: Message[], type: string) => {
    console.log('🎨 renderMsgList called with:', { data, type, dataLength: data.length });
    const noScrollEvt = [MESSAGE_TYPE.HISTORY, MESSAGE_TYPE.STOP, MESSAGE_TYPE.WORKBENCH_HISTORY, MESSAGE_TYPE.FEEDBACK];
    const list = data.map(el => ({ ...el, showPop: true }));
    
    console.log('🎨 Setting msgList to:', list);
    setMsgList(list);

    setTimeout(() => {
      const chatContainer = chatContainerRef.current;
      if (!chatContainer) return;

      if (!userScrolling && !noScrollEvt.includes(type)) {
        setJsScrolling(true);
        scrollToBottom(chatContainer, chatContainer.scrollHeight);
      }
      
      if (msgList.length > 0 && msgList[msgList.length - 1].is_final === true) {
        setUserScrolling(false);
      }
    }, 100);
  };

  const formatTimestamp = (timestamp: number) => {
    return moment(timestamp).format('MM-DD HH:mm');
  };

  const renderMessage = (item: Message, index: number) => {
    const showTimestamp = index === 0 || 
      (index !== 0 && item.timestamp && 
       (Number(item.timestamp) - Number(msgList[index - 1].timestamp)) > 300);

    return (
      <div key={index} className="message-container">
        {showTimestamp && (
          <div className="message-timestamp">
            {formatTimestamp(item.timestamp)}
          </div>
        )}
        
        {item.is_from_self ? (
          <div className="message-user">
            <div className="message-user-content">
              {item.is_loading && (
                <div className="loading-message">
                  <LoadingSpinner size="20" speed="1.0" className="inline" />
                  <span>发送中...</span>
                </div>
              )}
              <MarkdownRenderer content={item.content} />
            </div>
          </div>
        ) : (
          <div className="message-bot">
            <img 
              className="message-bot-avatar" 
              src={item.from_avatar || 'https://qbot-1251316161.cos.ap-nanjing.myqcloud.com/avatar.png'} 
              alt="AI Assistant" 
            />
            <div className="message-bot-content">
              {item.loading_message && (
                <div className="loading-message">
                  <LoadingSpinner size="25" speed="0.8" className="inline" />
                  <span>正在思考中</span>
                </div>
              )}

              {item.content && (
                <div className="message-bot-text">
                  <MarkdownRenderer content={item.content} />
                </div>
              )}

              {(item.tokens_msg || (item.agent_thought && item.agent_thought.procedures && item.agent_thought.procedures.length > 0)) && (
                <div className="runtime-panel">
                  <div 
                    className="runtime-panel-header" 
                    onClick={() => {
                      const panelKey = `${item.record_id || item.request_id || index}`;
                      setCollapsedPanels(prev => ({
                        ...prev,
                        [panelKey]: !prev[panelKey]
                      }));
                    }}
                  >
                    <i className={`ri-arrow-${collapsedPanels[`${item.record_id || item.request_id || index}`] ? 'right' : 'down'}-s-line runtime-arrow`}></i>
                    <span className="runtime-title">运行状态</span>
                  </div>
                  {!collapsedPanels[`${item.record_id || item.request_id || index}`] && (
                    <div className="runtime-panel-content">
                      {item.agent_thought && item.agent_thought.procedures && item.agent_thought.procedures.length > 0 && (
                        <div className="thought-process">
                          <div className="thought-process-title">思考过程:</div>
                          {item.agent_thought.procedures.map((thought: any, thoughtIndex: number) => (
                            <div key={thoughtIndex} className="thought-item">
                              <div className="thought-item-title">{thought.title}</div>
                              <div className="thought-item-content">{thought.display_content || thought.debugging?.content}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.tokens_msg && (
                        <TokensBoardBrief tokensData={item.tokens_msg} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {item.references && item.references.length > 0 && (
                <ReferenceComponent referencesList={item.references} />
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={chatContainerRef}
      className="chat-messages-container"
    >
      {msgList.map((item, index) => renderMessage(item, index))}
    </div>
  );
};

export default ClientChat;