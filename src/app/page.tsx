'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact, RenderLeafProps } from 'slate-react';
import { withHistory } from 'slate-history';
import EditorToolbar from './components/Toolbar';
import Chat from './components/Chat';

type CustomElement = {
  type: string;
  align?: string;
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
};

type LeafProps = RenderLeafProps & {
  leaf: CustomText;
};

type ElementProps = {
  attributes: React.HTMLAttributes<HTMLElement>;
  children: React.ReactNode;
  element: CustomElement;
};

const defaultValue: Descendant[] = [{ 
  type: 'paragraph', 
  children: [{ text: '' }] 
}];

const Leaf = ({ attributes, children, leaf }: LeafProps) => {
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

const Element = ({ attributes, children, element }: ElementProps) => {
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
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: React.MouseEvent<HTMLDivElement>) => {
    if (isResizing) {
      const width = document.body.clientWidth - mouseMoveEvent.clientX;
      setSidebarWidth(Math.min(Math.max(width, 280), 800));
    }
  }, [isResizing]);

  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const width = document.body.clientWidth - e.clientX;
      setSidebarWidth(Math.min(Math.max(width, 280), 800));
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [handleWindowMouseMove, stopResizing]);

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
    <div className="min-h-screen flex" onMouseMove={resize}>
      {/* Main Editor Area */}
      <main className="flex-1 p-6 bg-background">
        <div className="h-full border border-border rounded-lg p-4 bg-surface">
          <Slate editor={editor} initialValue={value} onChange={handleChange}>
            <EditorToolbar />
            <div className="overflow-y-auto h-[calc(100vh-12rem)]">
              <Editable
                className="w-full focus:outline-none text-black"
                placeholder="Start writing your journal entry..."
                renderLeaf={(props) => <Leaf {...props} />}
                renderElement={(props) => <Element {...props} />}
              />
            </div>
          </Slate>
        </div>
      </main>

      {/* Resize Handle */}
      <div
        className="w-1 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary"
        onMouseDown={startResizing}
      />

      {/* Chat Sidebar */}
      <aside 
        className="border-l border-border bg-surface-secondary p-4"
        style={{ width: sidebarWidth }}
      >
        <Chat editorContent={value} />
      </aside>
    </div>
  );
}
