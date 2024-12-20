'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import DocumentUpload from './DocumentUpload';
import { Descendant } from 'slate';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatProps {
  editorContent: Descendant[];
}

export default function Chat({ editorContent }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [vectorStore, setVectorStore] = useState<MemoryVectorStore | null>(null);

  const systemMessage = new SystemMessage(
    `You are an expert writing assistant, specializing in professional journalism, content creation and digital media.
    Your role is to help media professionals, craft compelling content while maintaining journalistic and editorial standards.

    You provide expertice on the following :
    - Professional writing and editing
    - Journalistic best practices
    - SEO optimization
    - Content strategy
    - Digital media formats
    - Headlines and subheadings
    - Style guide adherence

    Format Guidelines:
    - Use clear, professional language
    - Provide structured, actionable feedback
    - Include specific examples when relevant
    - Use markdown formatting for clarity
    - Break down complex suggestions into digestible points

    NEVER:
    - Generate false information or unverified facts
    - Compromise journalistic integrity
    - Suggest clickbait or misleading content
    - Violate copyright or plagiarism rules
    - Recommend unethical practices
    `
  );
  
  const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getPlainText = (nodes: Descendant[]): string => {
    return nodes
      .map(node => {
        if ('children' in node) {
          return getPlainText(node.children);
        }
        return 'text' in node ? node.text : '';
      })
      .join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let context = '';
      if (vectorStore) {
        const results = await vectorStore.similaritySearch(input, 3);
        context = results.map(doc => doc.pageContent).join('\n\n');
      }

      const currentText = getPlainText(editorContent);
      const editorContext = currentText.trim() 
        ? `\nCurrent article content:\n${currentText}`
        : '';

      const contextualSystemMessage = new SystemMessage(
        `${systemMessage.content}
         ${context ? `\nRelevant context:\n${context}` : ''}
         ${editorContext}`
      );

      const response = await chatModel.invoke([
        contextualSystemMessage,
        ...messages.map(msg => 
          msg.role === 'user' 
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
        ),
        new HumanMessage(input)
      ]);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content as string,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with AI Assistant title and Document Upload */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold text-black">AI Assistant</div>
        <DocumentUpload onVectorStoreUpdate={setVectorStore} />
      </div>
      
      {/* Messages Container */}
      <div className="h-[calc(100vh-12rem)] overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown 
                  className="prose prose-sm max-w-none [&>*]:text-black [&_strong]:text-black"
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                <div className="text-sm">{message.content}</div>
              )}
              <div className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2 mt-auto pb-8">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:border-primary text-black placeholder:text-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
