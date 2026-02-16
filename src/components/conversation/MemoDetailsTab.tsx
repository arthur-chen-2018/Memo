import { Panel, AnalyticalTable, FlexBox } from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import type { Memo, ActivityLogEntry } from '@/types';

interface MemoDetailsTabProps {
  memo: Memo;
  activityLog: ActivityLogEntry[];
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <FlexBox style={{ padding: '0.375rem 0', gap: '1rem' }}>
      <span style={{ minWidth: '180px', color: 'var(--sapNeutralColor)', fontWeight: 600 }}>{label}</span>
      <span>{value}</span>
    </FlexBox>
  );
}

export default function MemoDetailsTab({ memo, activityLog }: MemoDetailsTabProps) {
  const activityColumns = useMemo(() => [
    { Header: 'Timestamp', accessor: 'timestamp', width: 160 },
    { Header: 'Action', accessor: 'action', width: 160 },
    { Header: 'Performed By', accessor: 'performedBy', width: 200 },
    { Header: 'Details', accessor: 'details', width: 350 },
  ], []);

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Panel headerText="HV API Fields" collapsed={false}>
        <div style={{ padding: '0.5rem 1rem' }}>
          <DetailRow label="Job Number" value={memo.jobNumber} />
          <DetailRow label="Stream Number" value={memo.streamNumber} />
          <DetailRow label="Serial Number" value={memo.serialNumber} />
          <DetailRow label="Originator" value={memo.createdBy} />
        </div>
      </Panel>

      <Panel headerText="SAP Mapping" collapsed={false}>
        <div style={{ padding: '0.5rem 1rem' }}>
          <DetailRow label="Notification Number" value={memo.notificationNumber} />
          <DetailRow label="Task Number" value={memo.taskNumber} />
          <DetailRow label="Code Group" value="Memos" />
          <DetailRow label="Code" value={memo.memoType} />
        </div>
      </Panel>

      <Panel headerText="Activity Log" collapsed={false}>
        <div style={{ padding: '0.5rem' }}>
          <AnalyticalTable
            columns={activityColumns}
            data={activityLog}
            rowHeight={40}
            headerRowHeight={40}
            selectionMode="None"
            filterable={false}
            sortable={false}
            visibleRows={Math.max(activityLog.length, 3)}
            scaleWidthMode="Grow"
          />
        </div>
      </Panel>
    </div>
  );
}
