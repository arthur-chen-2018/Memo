import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Memo, MemoStatus, NewMemoData } from '@/types';
import { memoService } from '@/services';

interface AppContextType {
  memos: Memo[];
  loading: boolean;
  unreadCount: number;
  errorCount: number;
  refreshMemos: () => Promise<void>;
  updateMemoStatus: (id: string, status: MemoStatus) => Promise<void>;
  markAsRead: (id: string) => void;
  addMemo: (data: NewMemoData) => Promise<Memo>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCount] = useState(2); // from mock error logs

  const refreshMemos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await memoService.getMemos();
      setMemos(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMemos();
  }, [refreshMemos]);

  const unreadCount = memos.reduce((sum, m) => sum + m.unreadCount, 0);

  const updateMemoStatus = useCallback(async (id: string, status: MemoStatus) => {
    await memoService.updateMemoStatus(id, status);
    await refreshMemos();
  }, [refreshMemos]);

  const markAsRead = useCallback((id: string) => {
    setMemos(prev => prev.map(m =>
      m.id === id ? { ...m, unreadCount: 0 } : m
    ));
  }, []);

  const addMemo = useCallback(async (data: NewMemoData) => {
    const newMemo = await memoService.createMemo(data);
    await refreshMemos();
    return newMemo;
  }, [refreshMemos]);

  return (
    <AppContext.Provider value={{
      memos,
      loading,
      unreadCount,
      errorCount,
      refreshMemos,
      updateMemoStatus,
      markAsRead,
      addMemo,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
