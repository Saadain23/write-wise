'use client';

import { useState } from 'react';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

interface Props {
  onVectorStoreUpdate: (store: MemoryVectorStore) => void;
}

export default function DocumentUpload({ onVectorStoreUpdate }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const processDocument = async (text: string) => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.createDocuments([text]);
    const vectorStore = await MemoryVectorStore.fromDocuments(
      chunks,
      new OpenAIEmbeddings({
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
      })
    );
    onVectorStoreUpdate(vectorStore);
  };

  const handleUrlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const url = new FormData(e.currentTarget).get('url') as string;
    
    try {
      const response = await fetch('/api/load-url', {
        method: 'POST',
        body: JSON.stringify({ url }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load URL');
      }
      const { text } = await response.json();
      await processDocument(text);
      setShowUrlInput(false);
    } catch (error) {
      console.error('Error loading URL:', error);
      alert(error instanceof Error ? error.message : 'Failed to load URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowUrlInput(true)}
        className="bg-primary text-white px-4 py-2 rounded-lg"
      >
        Add Context
      </button>

      {showUrlInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-gray-900">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add URL Context</h3>
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <input
                type="url"
                name="url"
                placeholder="Enter URL..."
                className="w-full rounded-lg border px-4 py-2 text-gray-900"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary text-white px-4 py-2 rounded-lg"
                >
                  {isLoading ? 'Loading...' : 'Load URL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}