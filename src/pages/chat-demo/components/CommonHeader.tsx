import React from 'react';

const CommonHeader: React.FC = () => {
  return (
    <div className="common-header">
      <div className="common-header__title">
        <span className="common-header__title-text">智能助手</span>
      </div>
      <div className="common-header__subtitle">
        <span className="common-header__subtitle-text">为您提供智能问答服务</span>
      </div>
    </div>
  );
};

export default CommonHeader;