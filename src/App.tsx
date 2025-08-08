import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ACCESS_TYPE } from './constants/static';
import ChatDemo from './pages/chat-demo/ChatDemo';
import LoadingSpinner from './components/LoadingSpinner';
import './styles/common.less';

const App: React.FC = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('【init msg-------ACCESS_TYPE---->】', ACCESS_TYPE);
      
      let webIMType = [5];
      (window as any).$initTypeKey = 5;
      (window as any).$initType = 'ChatDemo';

      let tokenGet = webIMType.map(type => {
        return new Promise(async (resolve) => {
          let demoToken = '';
          if (ACCESS_TYPE === 'ws') {
            try {
              console.log('Fetching token from /getDemoToken...');
              const response = await fetch('/getDemoToken');
              const res = await response.json();
              console.log('Token response:', res);
              if (res && res.data && res.data.apiResponse && res.data.apiResponse.Token) {
                demoToken = res.data.apiResponse.Token;
              }
            } catch (error) {
              console.error('获取token失败:', error);
            }
          }
          
          let result = {
            type: type,
            token: demoToken,
            access: ACCESS_TYPE
          };
          console.log('【init msg----------demoToken---->】', result);
          resolve(result);
        });
      });

      const tokens = await Promise.all(tokenGet);
      console.log('All tokens received:', tokens);
      
      // Ensure tokens are easily readable by other modules (no defineProperty side-effects)
      (window as any).webimToken = tokens;
      console.log('window.webimToken set:', (window as any).webimToken);

      console.log('Setting initialized to true');
      setInitialized(true);
    };

    initializeApp();
  }, []);

  if (!initialized) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="50" speed="0.7" className="large" />
        <div className="loading-text">正在初始化聊天界面...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ChatDemo />} />
          <Route path="/chat" element={<ChatDemo />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
