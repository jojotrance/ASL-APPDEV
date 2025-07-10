import React, { useState } from 'react';

const FadeTransition = ({ children, onFadeOut }) => {
  const [fade, setFade] = useState(false);

  const triggerFade = () => {
    setFade(true);
    setTimeout(() => {
      if (onFadeOut) onFadeOut();
    }, 400); // match the CSS transition duration
  };

  return (
    <div
      className={`fade-transition${fade ? ' fade-out' : ''}`}
      style={{
        transition: 'opacity 0.4s',
        opacity: fade ? 0 : 1,
        height: '100%',
      }}
    >
      {children(triggerFade)}
    </div>
  );
};

export default FadeTransition;