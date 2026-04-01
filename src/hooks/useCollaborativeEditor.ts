import { useState, useEffect, useCallback } from 'react';

interface DocumentVersion {
  id: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export function useCollaborativeEditor(documentId: string) {
  const [content, setContent] = useState('');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>([]);

  // Load document
  useEffect(() => {
    // Simulate loading document
    setContent('# Project Document\n\nStart editing...');
    setVersions([
      {
        id: '1',
        content: 'Initial version',
        userId: 'user1',
        userName: 'Sarah Chen',
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [documentId]);

  // Simulate collaborators
  useEffect(() => {
    const interval = setInterval(() => {
      setCollaborators(prev => {
        if (prev.length < 3 && Math.random() > 0.7) {
          return [...prev, `User${Date.now()}`];
        }
        if (prev.length > 0 && Math.random() > 0.8) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    // Debounced save would go here
  }, []);

  const saveVersion = useCallback(() => {
    const newVersion: DocumentVersion = {
      id: Date.now().toString(),
      content: content.substring(0, 50) + '...',
      userId: 'current-user',
      userName: 'You',
      timestamp: new Date().toISOString(),
    };
    setVersions(prev => [newVersion, ...prev]);
  }, [content]);

  return {
    content,
    updateContent,
    versions,
    saveVersion,
    isEditing,
    setIsEditing,
    collaborators,
  };
}
