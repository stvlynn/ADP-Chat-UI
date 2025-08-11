import React from 'react';

interface CommonHeaderProps {
  title?: string;
  subtitle?: string;
}

const CommonHeader: React.FC<CommonHeaderProps> = ({
  title = '智能助手',
  subtitle = '为您提供智能问答服务'
}) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
};

export default CommonHeader;