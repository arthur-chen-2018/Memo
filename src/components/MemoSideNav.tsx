import { List, ListItemStandard, ObjectStatus, FlexBox } from '@ui5/webcomponents-react';
import { useNavigate } from 'react-router';
import type { Memo } from '@/types';
import { STATUS_VALUE_STATE } from '@/types';
import './MemoSideNav.css';

interface MemoSideNavProps {
  memos: Memo[];
  activeMemoId: string;
}

export default function MemoSideNav({ memos, activeMemoId }: MemoSideNavProps) {
  const navigate = useNavigate();

  return (
    <div className="memo-sidenav">
      <div className="memo-sidenav-header">Work Order Memos</div>
      <List
        onItemClick={(e: any) => {
          const memoId = e.detail.item.dataset.memoId;
          if (memoId) navigate(`/memo/${memoId}`);
        }}
      >
        {memos.map(memo => (
          <ListItemStandard
            key={memo.id}
            data-memo-id={memo.id}
            description={`${memo.memoType} · ${memo.lastUpdated}`}
            className={`memo-sidenav-item ${memo.id === activeMemoId ? 'memo-sidenav-item-active' : ''} ${memo.unreadCount > 0 ? 'memo-sidenav-item-unread' : ''}`}
            additionalText={memo.status}
            additionalTextState={STATUS_VALUE_STATE[memo.status] as any}
          >
            Task {memo.taskNumber} · {memo.streamNumber}
          </ListItemStandard>
        ))}
      </List>
    </div>
  );
}
