import React, { useEffect, useState, useRef } from 'react';
import { ACCESS_TYPE, MESSAGE_TYPE } from '../../constants/static';
import clientData from './utils/ClientData';
import sseManager from '../../manage/sse';
import eventHub from '../../manage/utils/EventHub';
import CommonHeader from './components/CommonHeader';
import ClientChat from './components/ClientChat';
import QuestionInput from './components/QuestionInput';

const ChatDemo: React.FC = () => {
  const componentId = useRef(`chat-demo-${Date.now()}`);

  useEffect(() => {
    console.log('【init message connect type------>】', ACCESS_TYPE);
    
    if (ACCESS_TYPE === 'ws') {
      clientData.init();
    } else {
      sseManager.init();
    }

    eventHub.registerComponent(componentId.current);

    const handleConfigChange = (res: any) => {
      console.log('Config changed:', res);
    };

    const handleMsgContentChange = (res: any) => {
      const { chatsContent, type } = res;
      console.log('Message content changed:', type, chatsContent.length);
    };

    eventHub.on('client_configChange', handleConfigChange);
    eventHub.on('client_msgContentChange', handleMsgContentChange);

    return () => {
      eventHub.offComponentEvents(componentId.current);
    };
  }, []);

  const handleSendQuestion = (question: string) => {
    console.log('🚀 onSendQuestion called with:', question);
    console.log('🚀 ACCESS_TYPE:', ACCESS_TYPE);
    console.log('🚀 clientData:', clientData);
    
    if (ACCESS_TYPE === 'ws') {
      console.log('🚀 Calling clientData.triggerSendMsg...');
      clientData.triggerSendMsg(question);
    } else {
      console.log('🚀 Calling sseManager.sseSendMsg...');
      sseManager.sseSendMsg(question);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <CommonHeader />
      </div>
      
      {/* Chat Messages Area - Takes remaining space */}
      <div className="chat-messages">
        <ClientChat onSend={handleSendQuestion} />
      </div>
      
      {/* Input Area - Fixed at bottom */}
      <div className="input-container">
        <QuestionInput onSend={handleSendQuestion} />
      </div>
    </div>
  );
};

export default ChatDemo;