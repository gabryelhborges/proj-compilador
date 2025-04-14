import React from 'react';

const NúmerosLinha = ({ refNúmerosLinha, númerosLinha }) => {
  return (
    <div className="line-numbers" ref={refNúmerosLinha}>
      <pre>{númerosLinha}</pre>
    </div>
  );
};

export default NúmerosLinha;