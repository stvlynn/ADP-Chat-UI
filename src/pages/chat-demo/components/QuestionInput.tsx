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
    <div className="question-input">
      <div className="question-input__container">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="请输入您的问题..."
          className="question-input__textarea"
          rows={1}
        />
        <button 
          onClick={handleSend}
          disabled={!question.trim()}
          className="question-input__send-button"
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default QuestionInput;