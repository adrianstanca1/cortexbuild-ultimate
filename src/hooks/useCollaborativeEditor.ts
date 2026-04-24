import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "@/lib/api";

interface DocumentVersion {
  id: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
}

interface UseCollaborativeEditorResult {
  content: string;
  updateContent: (newContent: string) => void;
  versions: DocumentVersion[];
  saveVersion: () => Promise<void>;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  collaborators: string[];
  loading: boolean;
  error: Error | null;
}

/**
 * Collaborative document editor hook.
 *
 * **Current state**: Loads/saves via REST API. Real-time collaboration
 * (cursor positions, live cursors, operational transforms) is planned
 * but not yet wired to the WebSocket layer. When enabled, the hook
 * will switch from REST polling to WebSocket events.
 */
export function useCollaborativeEditor(
  documentId: string,
): UseCollaborativeEditorResult {
  const [content, setContent] = useState("");
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [collaborators] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load document content and version history
  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const doc = await apiGet<{
          content: string;
          versions: DocumentVersion[];
        }>(`/documents/${documentId}`);
        if (cancelled) return;
        setContent(doc.content ?? "");
        setVersions(doc.versions ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err : new Error("Failed to load document"),
        );
        console.error("[useCollaborativeEditor] Load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // WebSocket collaboration (placeholder — enable when backend supports it)
  useEffect(() => {
    if (!documentId || process.env.NODE_ENV === "test") return;

    // TODO: Connect to /ws/documents/:id when real-time collaboration is ready
    // const ws = new WebSocket(buildWebSocketUrl(`/documents/${documentId}`));
    // ws.onmessage = (event) => { ...handle cursor positions, remote edits... };
    // wsRef.current = ws;
    // return () => { ws.close(); wsRef.current = null; };

    return undefined;
  }, [documentId]);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    // Debounced auto-save can be added here
  }, []);

  const saveVersion = useCallback(async () => {
    if (!documentId || !content.trim()) return;
    try {
      const version: DocumentVersion = {
        id: crypto.randomUUID?.() ?? Date.now().toString(),
        content: content.substring(0, 200),
        userId: "current-user",
        userName: "You",
        timestamp: new Date().toISOString(),
      };

      await apiPost(`/documents/${documentId}/versions`, {
        content: version.content,
        fullContent: content,
      });

      setVersions((prev) => [version, ...prev]);
    } catch (err) {
      console.error("[useCollaborativeEditor] Save failed:", err);
      throw err instanceof Error
        ? err
        : new Error("Failed to save document version");
    }
  }, [documentId, content]);

  return {
    content,
    updateContent,
    versions,
    saveVersion,
    isEditing,
    setIsEditing,
    collaborators,
    loading,
    error,
  };
}
