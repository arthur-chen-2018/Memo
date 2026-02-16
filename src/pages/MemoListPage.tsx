import { useState, useCallback } from 'react';
import { Button, Title, FlexBox, BusyIndicator } from '@ui5/webcomponents-react';
import AppShellBar from '@/components/AppShellBar';
import MemoFilterBar from '@/components/MemoFilterBar';
import MemoTable from '@/components/MemoTable';
import NewMemoPanel from '@/components/NewMemoPanel';
import { useAppContext } from '@/context/AppContext';
import { memoService } from '@/services';
import type { Memo } from '@/types';
import './MemoListPage.css';

import '@ui5/webcomponents-icons/dist/add.js';

export default function MemoListPage() {
  const { memos, loading, refreshMemos } = useAppContext();
  const [filteredMemos, setFilteredMemos] = useState<Memo[] | null>(null);
  const [newMemoOpen, setNewMemoOpen] = useState(false);

  const handleFilter = useCallback(async (filters: Record<string, string>) => {
    const hasFilters = Object.values(filters).some(v => v);
    if (!hasFilters) {
      setFilteredMemos(null);
      return;
    }
    const result = await memoService.getMemos(filters);
    setFilteredMemos(result);
  }, []);

  const handleClear = useCallback(() => {
    setFilteredMemos(null);
  }, []);

  const handleMemoCreated = useCallback(() => {
    setNewMemoOpen(false);
    refreshMemos();
  }, [refreshMemos]);

  const displayMemos = filteredMemos ?? memos;

  return (
    <div className="memo-list-page">
      <AppShellBar />
      <div className="memo-list-content">
        <FlexBox justifyContent="SpaceBetween" alignItems="Center" className="memo-list-header">
          <Title level="H3">Notification Memos</Title>
          <Button icon="add" design="Emphasized" onClick={() => setNewMemoOpen(true)}>
            New Memo
          </Button>
        </FlexBox>
        <MemoFilterBar onFilter={handleFilter} onClear={handleClear} />
        <BusyIndicator active={loading} delay={200}>
          <MemoTable memos={displayMemos} />
        </BusyIndicator>
      </div>
      {newMemoOpen && (
        <NewMemoPanel
          onClose={() => setNewMemoOpen(false)}
          onCreated={handleMemoCreated}
        />
      )}
    </div>
  );
}
