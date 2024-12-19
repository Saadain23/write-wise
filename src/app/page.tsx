'use client';

import { useState, useMemo, useEffect } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import EditorToolbar from './components/Toolbar';

const defaultValue: Descendant[] = [{ 
  type: 'paragraph', 
  children: [{ text: '' }] 
}];

const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  if (leaf.strike) {
    children = <s>{children}</s>;
  }
  if (leaf.code) {
    children = <code className="bg-gray-100 rounded px-1">{children}</code>;
  }
  return <span {...attributes}>{children}</span>;
};

const Element = ({ attributes, children, element }: any) => {
  const getAlignClass = (align?: string) => {
    switch (align) {
      case 'left': return 'text-left';
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return '';
    }
  };

  const alignClass = getAlignClass(element.align);
  
  switch (element.type) {
    case 'heading-one':
      return <h1 {...attributes} className={`text-3xl font-bold my-4 ${alignClass}`}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes} className={`text-2xl font-bold my-3 ${alignClass}`}>{children}</h2>;
    case 'heading-three':
      return <h3 {...attributes} className={`text-xl font-bold my-2 ${alignClass}`}>{children}</h3>;
    case 'bulleted-list':
      return <ul {...attributes} className={`list-disc ml-4 ${alignClass}`}>{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes} className={`list-decimal ml-4 ${alignClass}`}>{children}</ol>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'code-block':
      return (
        <pre {...attributes} className={`bg-gray-100 p-2 rounded my-2 ${alignClass}`}>
          <code>{children}</code>
        </pre>
      );
    default:
      return <p {...attributes} className={`my-2 ${alignClass}`}>{children}</p>;
  }
};

export default function Home() {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  const [value, setValue] = useState<Descendant[]>(defaultValue);

  useEffect(() => {
    const savedContent = localStorage.getItem('journal-content');
    if (savedContent) {
      setValue(JSON.parse(savedContent));
    }
  }, []);

  const handleChange = (newValue: Descendant[]) => {
    setValue(newValue);
    localStorage.setItem('journal-content', JSON.stringify(newValue));
  };

  return (
    <div className="min-h-screen flex">
      {/* Main Editor Area */}
      <main className="flex-1 p-6 bg-background">
        <div className="h-full border border-border rounded-lg p-4 bg-surface">
          <Slate editor={editor} initialValue={value} onChange={handleChange}>
            <EditorToolbar />
            <Editable
              className="w-full h-[calc(100vh-12rem)] focus:outline-none text-black"
              placeholder="Start writing your journal entry..."
              renderLeaf={(props) => <Leaf {...props} />}
              renderElement={(props) => <Element {...props} />}
            />
          </Slate>
        </div>
      </main>

      {/* Chat Sidebar */}
      <aside className="w-96 border-l border-border bg-surface-secondary p-4">
        <div className="text-lg font-semibold text-black mb-4">Chat</div>
        <div className="h-[calc(100vh-8rem)] overflow-y-auto">
          {/* Chat content */}
        </div>
      </aside>
    </div>
  );
}
