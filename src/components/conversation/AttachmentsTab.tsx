import { AnalyticalTable, Button, FileUploader, FlexBox, Icon } from '@ui5/webcomponents-react';
import { useMemo } from 'react';
import type { Attachment } from '@/types';

import '@ui5/webcomponents-icons/dist/download.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/document.js';
import '@ui5/webcomponents-icons/dist/add.js';

interface AttachmentsTabProps {
  attachments: Attachment[];
  onAttachmentClick?: (attachment: Attachment, allAttachments: Attachment[]) => void;
  onUpload?: (files: File[]) => void;
  onDelete?: (id: string) => void;
}

export default function AttachmentsTab({ attachments, onAttachmentClick, onUpload, onDelete }: AttachmentsTabProps) {
  const columns = useMemo(() => [
    {
      Header: 'File',
      accessor: 'fileName',
      width: 250,
      Cell: ({ value, row }: any) => (
        <FlexBox
          alignItems="Center"
          style={{ gap: '0.5rem', cursor: 'pointer' }}
          onClick={() => onAttachmentClick?.(row.original, attachments)}
        >
          <Icon name="document" />
          <span style={{ color: 'var(--sapLinkColor)' }}>{value}</span>
        </FlexBox>
      ),
    },
    {
      Header: 'Type',
      accessor: 'fileType',
      width: 120,
    },
    {
      Header: 'Size',
      accessor: 'fileSize',
      width: 100,
    },
    {
      Header: 'Uploaded By',
      accessor: 'uploadedBy',
      width: 140,
      Cell: ({ value }: any) => (
        <span style={{
          color: value === 'Homes Victoria' ? 'var(--sapInformationColor)' : 'var(--sapWarningColor)',
          fontWeight: 600,
        }}>
          {value}
        </span>
      ),
    },
    {
      Header: 'Upload Date',
      accessor: 'uploadDate',
      width: 160,
    },
    {
      Header: 'Actions',
      accessor: 'id',
      width: 120,
      disableSortBy: true,
      Cell: ({ row }: any) => (
        <FlexBox style={{ gap: '0.25rem' }}>
          <Button icon="download" design="Transparent" title="Download" />
          {row.original.uploadedBy === 'VOC' && (
            <Button
              icon="delete"
              design="Transparent"
              title="Delete"
              onClick={() => onDelete?.(row.original.id)}
            />
          )}
        </FlexBox>
      ),
    },
  ], [attachments, onAttachmentClick, onDelete]);

  return (
    <div style={{ padding: '1rem' }}>
      <FlexBox justifyContent="End" style={{ marginBottom: '1rem' }}>
        <FileUploader
          hideInput
          onChange={(e: any) => {
            const files = Array.from(e.detail?.files || []) as File[];
            onUpload?.(files);
          }}
        >
          <Button icon="add" design="Emphasized">Upload Attachment</Button>
        </FileUploader>
      </FlexBox>
      <AnalyticalTable
        columns={columns}
        data={attachments}
        rowHeight={44}
        headerRowHeight={44}
        selectionMode="None"
        filterable={false}
        sortable
        visibleRows={Math.max(attachments.length, 3)}
        scaleWidthMode="Grow"
      />
    </div>
  );
}
