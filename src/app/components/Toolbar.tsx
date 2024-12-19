import { BaseEditor, Editor, Element as SlateElement, Text, Transforms } from 'slate';
import { useSlate, ReactEditor } from 'slate-react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlignLeft, AlignCenter, AlignRight, AlignJustify, Download } from 'lucide-react';
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';

type CustomText = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  text: string;
};

type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'code-block';
  align?: 'left' | 'center' | 'right' | 'justify';
  children: CustomText[];
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const EditorToolbar = () => {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editor = useSlate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowHeadingMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFormat = (format: keyof Omit<CustomText, 'text'>) => {
    const isActive = isFormatActive(editor, format);
    Editor.addMark(editor, format, !isActive);
  };

  const toggleBlock = (format: CustomElement['type']) => {
    const isActive = isBlockActive(editor, format);
    const isList = ['bulleted-list', 'numbered-list'].includes(format);

    Transforms.unwrapNodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && ['bulleted-list', 'numbered-list'].includes(n.type),
      split: true,
    });

    const newProperties: Partial<SlateElement> = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };

    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
      const block = { type: format, children: [] };
      Transforms.wrapNodes(editor, block);
    }
  };

  const isBlockActive = (editor: Editor, format: string) => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
      })
    );

    return !!match;
  };

  const isFormatActive = (editor: Editor, format: keyof Omit<CustomText, 'text'>) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  const getCurrentHeading = () => {
    if (isBlockActive(editor, 'heading-one')) return 'H1';
    if (isBlockActive(editor, 'heading-two')) return 'H2';
    if (isBlockActive(editor, 'heading-three')) return 'H3';
    return 'Normal';
  };

  const toggleAlign = (alignment: NonNullable<CustomElement['align']>) => {
    Transforms.setNodes(editor, {
      align: isAlignActive(alignment) ? undefined : alignment,
    });
  };

  const isAlignActive = (alignment: NonNullable<CustomElement['align']>) => {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.align === alignment,
      })
    );
    return !!match;
  };

  const serializeToDocx = (nodes: any[]): any[] => {
    return nodes.map(node => {
      if (Text.isText(node)) {
        return new TextRun({
          text: node.text,
          bold: node.bold,
          italics: node.italic,
          strike: node.strike,
          underline: node.underline ? { type: 'single' } : undefined,
        });
      }

      const children = serializeToDocx(node.children);
      const alignmentMap = {
        'left': AlignmentType.LEFT,
        'center': AlignmentType.CENTER,
        'right': AlignmentType.RIGHT,
        'justify': AlignmentType.JUSTIFIED
      } as const;

      const alignment = node.align ? 
        alignmentMap[node.align as keyof typeof alignmentMap] : 
        AlignmentType.LEFT;

      switch (node.type) {
        case 'heading-one':
          return new Paragraph({
            children,
            heading: HeadingLevel.HEADING_1,
            alignment,
          });
        case 'heading-two':
          return new Paragraph({
            children,
            heading: HeadingLevel.HEADING_2,
            alignment,
          });
        case 'heading-three':
          return new Paragraph({
            children,
            heading: HeadingLevel.HEADING_3,
            alignment,
          });
        case 'bulleted-list':
          return children.map(child => new Paragraph({
            children: [child],
            bullet: {
              level: 0
            },
            alignment,
          }));
        case 'numbered-list':
          return children.map((child, i) => new Paragraph({
            children: [child],
            numbering: {
              reference: 'default-numbering',
              level: 0,
            },
            alignment,
          }));
        default:
          return new Paragraph({
            children,
            alignment,
          });
      }
    }).flat();
  };

  const handleDocxExport = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: serializeToDocx(editor.children)
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'document.docx');
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 border-b border-border">
      {/* Text Formatting */}
      <button
        className={`px-3 py-1 rounded text-black ${
          isFormatActive(editor, 'bold') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormat('bold');
        }}
      >
        B
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isFormatActive(editor, 'italic') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormat('italic');
        }}
      >
        <i>I</i>
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isFormatActive(editor, 'underline') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormat('underline');
        }}
      >
        <span className="underline">U</span>
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isFormatActive(editor, 'strike') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormat('strike');
        }}
      >
        <span className="line-through">S</span>
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isFormatActive(editor, 'code') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleFormat('code');
        }}
      >
        {'</>'}
      </button>

      {/* Block Formatting */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="px-3 py-1 rounded text-black bg-button hover:bg-button-hover flex items-center gap-1"
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
        >
          {getCurrentHeading()}
          <ChevronDown className="w-4 h-4" />
        </button>
        
        {showHeadingMenu && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-border rounded-md shadow-lg z-10">
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 text-black"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('paragraph');
                setShowHeadingMenu(false);
              }}
            >
              Normal
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 text-black"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('heading-one');
                setShowHeadingMenu(false);
              }}
            >
              Heading 1
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 text-black"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('heading-two');
                setShowHeadingMenu(false);
              }}
            >
              Heading 2
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 text-black"
              onMouseDown={(e) => {
                e.preventDefault();
                toggleBlock('heading-three');
                setShowHeadingMenu(false);
              }}
            >
              Heading 3
            </button>
          </div>
        )}
      </div>
      <button
        className={`px-3 py-1 rounded text-black ${
          isBlockActive(editor, 'bulleted-list') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock('bulleted-list');
        }}
      >
        •
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isBlockActive(editor, 'numbered-list') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock('numbered-list');
        }}
      >
        1.
      </button>

      {/* Add divider */}
      <div className="h-6 w-px bg-border mx-1" />

      {/* Alignment buttons */}
      <button
        className={`px-3 py-1 rounded text-black ${
          isAlignActive('left') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleAlign('left');
        }}
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isAlignActive('center') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleAlign('center');
        }}
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isAlignActive('right') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleAlign('right');
        }}
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        className={`px-3 py-1 rounded text-black ${
          isAlignActive('justify') ? 'bg-button-active' : 'bg-button hover:bg-button-hover'
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleAlign('justify');
        }}
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      {/* Export button */}
      <button
        className="px-3 py-1 rounded text-black bg-button hover:bg-button-hover flex items-center gap-1"
        onClick={handleDocxExport}
        title="Export as Word Document"
      >
        <Download className="w-4 h-4" />
        Export DOCX
      </button>
    </div>
  );
};

export default EditorToolbar;