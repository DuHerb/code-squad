import React from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  initialCode: string;
  language: string;
  onChange?: (value: string | undefined) => void;
}

export function CodeEditor({
  initialCode,
  language,
  onChange,
}: Readonly<CodeEditorProps>) {
  return (
    <Editor
      height='500px' // Default height, can be customized via props later
      defaultLanguage={language}
      defaultValue={initialCode}
      onChange={onChange}
      theme='vs-dark' // Default theme, can be customized
      options={{
        minimap: { enabled: false }, // Example option: disable minimap
        fontSize: 14,
      }}
    />
  );
}
