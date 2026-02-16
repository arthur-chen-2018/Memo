import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Title,
  FlexBox,
  FilterBar,
  FilterGroupItem,
  Input,
  Select,
  Option,
  AnalyticalTable,
  ObjectStatus,
  Button,
  Tag,
  Panel,
  BusyIndicator,
  MessageStrip,
} from '@ui5/webcomponents-react';
import { useNavigate } from 'react-router';
import AppShellBar from '@/components/AppShellBar';
import { errorService } from '@/services';
import type { ErrorLog } from '@/types';
import './ErrorMonitorPage.css';

import '@ui5/webcomponents-icons/dist/refresh.js';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';

const ERROR_STATUS_STATE: Record<string, string> = {
  'Unresolved': 'Negative',
  'Retrying': 'Critical',
  'Resolved': 'Positive',
};

export default function ErrorMonitorPage() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadErrors = useCallback(async (filters?: Record<string, string>) => {
    setLoading(true);
    try {
      const data = await errorService.getErrors(filters);
      setErrors(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  const handleFilter = (e: any) => {
    const filters: Record<string, string> = {};
    const form = e.target?.closest?.('ui5-filter-bar') ?? document;
    const inputs = form.querySelectorAll('ui5-input, ui5-select');
    inputs.forEach((input: any) => {
      const name = input.getAttribute('data-filter-name');
      const value = input.value;
      if (name && value) filters[name] = value;
    });
    loadErrors(filters);
  };

  const handleRetry = async (id: string) => {
    await errorService.retryError(id);
    loadErrors();
  };

  const handleResolve = async (id: string) => {
    await errorService.resolveError(id);
    loadErrors();
  };

  const columns = useMemo(() => [
    { Header: 'Error ID', accessor: 'id', width: 100 },
    { Header: 'Timestamp', accessor: 'timestamp', width: 160 },
    {
      Header: 'Direction',
      accessor: 'direction',
      width: 110,
      Cell: ({ value }: any) => (
        <Tag colorScheme={value === 'Inbound' ? '6' : '1'}>{value}</Tag>
      ),
    },
    { Header: 'Error Type', accessor: 'errorType', width: 140 },
    {
      Header: 'Work Order',
      accessor: 'workOrderNumber',
      width: 120,
      Cell: ({ value, row }: any) => (
        <span
          style={{ color: 'var(--sapLinkColor)', cursor: 'pointer' }}
          onClick={() => navigate(`/memo/${row.original.memoId}`)}
        >
          {value}
        </span>
      ),
    },
    { Header: 'Job Number', accessor: 'jobNumber', width: 120 },
    { Header: 'Stream', accessor: 'streamNumber', width: 110 },
    {
      Header: 'Error Detail',
      accessor: 'errorDetail',
      width: 250,
      Cell: ({ value }: any) => (
        <span title={value} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {value}
        </span>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      width: 130,
      Cell: ({ value }: any) => (
        <ObjectStatus state={ERROR_STATUS_STATE[value] as any} showDefaultIcon>
          {value}
        </ObjectStatus>
      ),
    },
    {
      Header: 'Actions',
      accessor: 'actions',
      width: 120,
      disableSortBy: true,
      Cell: ({ row }: any) => (
        <FlexBox style={{ gap: '0.25rem' }}>
          {row.original.status !== 'Resolved' && (
            <>
              <Button
                icon="refresh"
                design="Transparent"
                title="Retry"
                onClick={() => handleRetry(row.original.id)}
              />
              <Button
                icon="accept"
                design="Transparent"
                title="Mark as Resolved"
                onClick={() => handleResolve(row.original.id)}
              />
            </>
          )}
        </FlexBox>
      ),
    },
  ], [navigate]);

  const renderSubComponent = useCallback((row: any) => {
    const error = row.original as ErrorLog;
    return (
      <div className="error-expanded">
        <Panel headerText="Full Error Message" collapsed={false}>
          <div className="error-expanded-content">
            <MessageStrip design="Negative" hideCloseButton>
              {error.fullErrorMessage}
            </MessageStrip>
          </div>
        </Panel>
        <Panel headerText="Original Payload" collapsed>
          <div className="error-expanded-content">
            <pre className="error-payload">{error.originalPayload}</pre>
          </div>
        </Panel>
        <Panel headerText="Retry History" collapsed={error.retryHistory.length === 0}>
          <div className="error-expanded-content">
            {error.retryHistory.length === 0 ? (
              <span style={{ color: 'var(--sapNeutralColor)' }}>No retry attempts yet.</span>
            ) : (
              <ul className="error-retry-list">
                {error.retryHistory.map((entry, i) => (
                  <li key={i}>
                    <strong>{entry.timestamp}</strong> — {entry.result}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
        {error.status !== 'Resolved' && (
          <FlexBox style={{ gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <Button design="Emphasized" icon="refresh" onClick={() => handleRetry(error.id)}>
              Retry
            </Button>
            <Button design="Transparent" icon="accept" onClick={() => handleResolve(error.id)}>
              Mark as Resolved
            </Button>
          </FlexBox>
        )}
      </div>
    );
  }, []);

  return (
    <div className="error-monitor-page">
      <AppShellBar />
      <div className="error-monitor-content">
        <Title level="H3" style={{ marginBottom: '1rem' }}>Error Monitor</Title>
        <FilterBar onGo={handleFilter} onClear={() => loadErrors()} showGoOnFB showClearOnFB>
          <FilterGroupItem label="Error Type" filterKey="errorType">
            <Select data-filter-name="errorType">
              <Option value="">All Types</Option>
              <Option value="API Timeout">API Timeout</Option>
              <Option value="Validation Error">Validation Error</Option>
            </Select>
          </FilterGroupItem>
          <FilterGroupItem label="Status" filterKey="status">
            <Select data-filter-name="status">
              <Option value="">All Statuses</Option>
              <Option value="Unresolved">Unresolved</Option>
              <Option value="Retrying">Retrying</Option>
              <Option value="Resolved">Resolved</Option>
            </Select>
          </FilterGroupItem>
          <FilterGroupItem label="Work Order" filterKey="workOrderNumber">
            <Input data-filter-name="workOrderNumber" placeholder="e.g. 40001234" />
          </FilterGroupItem>
        </FilterBar>
        <BusyIndicator active={loading} delay={200}>
          <AnalyticalTable
            columns={columns}
            data={errors}
            rowHeight={44}
            headerRowHeight={44}
            selectionMode="None"
            filterable={false}
            sortable
            visibleRows={Math.max(errors.length, 5)}
            scaleWidthMode="Grow"
            renderRowSubComponent={renderSubComponent}
            subComponentsBehavior="Expandable"
          />
        </BusyIndicator>
      </div>
    </div>
  );
}
