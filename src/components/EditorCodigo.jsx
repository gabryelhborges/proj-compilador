import React from 'react';

const EditorCodigo = ({ refTextArea, código, setCódigo }) => {
  return (
    <textarea
      ref={refTextArea}
      value={código}
      onChange={(e) => setCódigo(e.target.value)}
      placeholder="Digite seu código aqui..."
      spellCheck="false"
    />
  );
};

export default EditorCodigo;