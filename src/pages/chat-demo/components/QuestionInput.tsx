import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';

interface QuestionInputProps {
  onSend: (question: string) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onSend }) => {
  const [question, setQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [question]);

  const handleSend = () => {
    if (question.trim()) {
      onSend(question.trim());
      setQuestion('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="input-wrapper">
      <textarea
        ref={textareaRef}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="请输入您的问题..."
        className="input-field"
        rows={1}
      />
      <button 
        onClick={handleSend}
        disabled={!question.trim()}
        className="send-button"
        title="发送消息"
      >
        <i className="ri-send-plane-fill send-icon"></i>
      </button>
    </div>
  );
};

export default QuestionInput;