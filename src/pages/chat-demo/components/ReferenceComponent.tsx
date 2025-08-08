import React from 'react';

interface Reference {
  id: string;
  name: string;
  url?: string;
  type?: number;
}

interface ReferenceComponentProps {
  referencesList: Reference[];
}

const ReferenceComponent: React.FC<ReferenceComponentProps> = ({ referencesList }) => {
  const handleOpenReference = (reference: Reference) => {
    if (reference.url) {
      window.open(reference.url, '_blank');
    }
  };

  return (
    <div className="reference-component">
      <div className="reference-component__title">参考来源：</div>
      <div className="reference-component__list">
        {referencesList.map((reference) => (
          <div 
            key={reference.id} 
            className="reference-component__item"
            onClick={() => handleOpenReference(reference)}
          >
            <span className="reference-component__item-id">{reference.id}.</span>
            <span className="reference-component__item-name">{reference.name}</span>
            {reference.url && (
              <span className="reference-component__item-link">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferenceComponent;