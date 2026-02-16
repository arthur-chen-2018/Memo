import { useMemo } from 'react';
import { AnalyticalTable, ObjectStatus, Icon, FlexBox } from '@ui5/webcomponents-react';
import { useNavigate } from 'react-router';
import type { Memo } from '@/types';
import { STATUS_VALUE_STATE } from '@/types';
import { getOpenMemoCount } from '@/data/mockData';
import './MemoTable.css';

import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/message-warning.js';
import '@ui5/webcomponents-icons/dist/discussion.js';
import '@ui5/webcomponents-icons/dist/attachment.js';
import '@ui5/webcomponents-icons/dist/error.js';
import '@ui5/webcomponents-icons/dist/warning2.js';

interface MemoTableProps {
  memos: Memo[];
}

export default function MemoTable({ memos }: MemoTableProps) {
  const navigate = useNavigate();

  const columns = useMemo(() => [
    {
      Header: 'Job Number',
      accessor: 'jobNumber',
      width: 120,
    },
    {
      Header: 'Work Order',
      accessor: 'workOrderNumber',
      width: 130,
      Cell: ({ value, row }: any) => {
        const openCount = getOpenMemoCount(value);
        return (
          <FlexBox alignItems="Center" style={{ gap: '0.25rem' }}>
            <span>{value}</span>
            {openCount > 1 && (
              <Icon
                name="alert"
                className="memo-table-warning-icon"
                title={`This work order has ${openCount} open memo(s) requiring attention`}
              />
            )}
          </FlexBox>
        );
      },
    },
    {
      Header: 'Notification',
      accessor: 'notificationNumber',
      width: 120,
    },
    {
      Header: 'Task',
      accessor: 'taskNumber',
      width: 70,
    },
    {
      Header: 'Stream',
      accessor: 'streamNumber',
      width: 110,
    },
    {
      Header: 'Memo Type',
      accessor: 'memoType',
      width: 140,
    },
    {
      Header: 'Status',
      accessor: 'status',
      width: 170,
      Cell: ({ value }: any) => (
        <ObjectStatus
          state={STATUS_VALUE_STATE[value as keyof typeof STATUS_VALUE_STATE] as any}
          showDefaultIcon
        >
          {value}
        </ObjectStatus>
      ),
    },
    {
      Header: 'Last Message From',
      accessor: 'lastMessageFrom',
      width: 150,
      Cell: ({ value }: any) => (
        <span className={value === 'Homes Victoria' ? 'memo-table-org-hv' : 'memo-table-org-voc'}>
          {value}
        </span>
      ),
    },
    {
      Header: 'Last Updated',
      accessor: 'lastUpdated',
      width: 150,
    },
    {
      Header: 'Messages',
      accessor: 'messageCount',
      width: 110,
      Cell: ({ value, row }: any) => (
        <FlexBox alignItems="Center" style={{ gap: '0.25rem' }}>
          <Icon name="discussion" className="memo-table-chat-icon" />
          <span>{value}</span>
          {row.original.unreadCount > 0 && (
            <span className="memo-table-unread-badge">{row.original.unreadCount}</span>
          )}
          {row.original.hasFailedResponse && (
            <Icon
              name="error"
              className="memo-table-error-icon"
              title="Last response to HV failed — click to retry"
            />
          )}
        </FlexBox>
      ),
    },
    {
      Header: 'Attachments',
      accessor: 'attachmentCount',
      width: 110,
      Cell: ({ value }: any) => (
        <FlexBox alignItems="Center" style={{ gap: '0.25rem' }}>
          <Icon name="attachment" className="memo-table-attach-icon" />
          <span>{value}</span>
        </FlexBox>
      ),
    },
  ], []);

  const rowClassFn = (row: any) => {
    if (row?.original?.unreadCount > 0) return 'memo-table-row-unread';
    return '';
  };

  return (
    <AnalyticalTable
      columns={columns}
      data={memos}
      rowHeight={44}
      headerRowHeight={44}
      selectionMode="None"
      withRowHighlight={false}
      filterable={false}
      sortable
      groupable={false}
      visibleRows={15}
      scaleWidthMode="Grow"
      onRowClick={(e: any) => {
        const memoId = e.detail?.row?.original?.id;
        if (memoId) navigate(`/memo/${memoId}`);
      }}
      tableHooks={[
        (hooks: any) => {
          hooks.getRowProps.push((props: any, { row }: any) => {
            const cls = rowClassFn(row);
            return {
              ...props,
              className: `${props.className || ''} ${cls}`.trim(),
              style: {
                ...props.style,
                cursor: 'pointer',
              },
            };
          });
        },
      ]}
    />
  );
}
