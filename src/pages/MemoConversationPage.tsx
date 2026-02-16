import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import {
  ObjectPage,
  ObjectPageSection,
  ObjectPageHeader,
  ObjectPageTitle,
  ObjectStatus,
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  MessageStrip,
  TabContainer,
  Tab,
  Dialog,
  Select,
  Option,
  Button,
  Bar,
  FlexBox,
  BusyIndicator,
  Label,
} from '@ui5/webcomponents-react';
import AppShellBar from '@/components/AppShellBar';
import MemoSideNav from '@/components/MemoSideNav';
import MessagesTab from '@/components/conversation/MessagesTab';
import AttachmentsTab from '@/components/conversation/AttachmentsTab';
import MemoDetailsTab from '@/components/conversation/MemoDetailsTab';
import NewMemoPanel from '@/components/NewMemoPanel';
import AttachmentViewer from '@/components/AttachmentViewer';
import { useAppContext } from '@/context/AppContext';
import { memoService, messageService, attachmentService } from '@/services';
import { getActivityLogForMemo } from '@/data/mockData';
import type { Memo, Message, Attachment, ActivityLogEntry, MemoStatus } from '@/types';
import { VALID_STATUS_TRANSITIONS, STATUS_VALUE_STATE } from '@/types';
import './MemoConversationPage.css';

import '@ui5/webcomponents-icons/dist/response.js';
import '@ui5/webcomponents-icons/dist/attachment.js';
import '@ui5/webcomponents-icons/dist/status-positive.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';

export default function MemoConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { refreshMemos, markAsRead, updateMemoStatus: ctxUpdateStatus } = useAppContext();

  const [memo, setMemo] = useState<Memo | null>(null);
  const [woMemos, setWoMemos] = useState<Memo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memoAttachments, setMemoAttachments] = useState<Attachment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<MemoStatus | ''>('');
  const [newMemoOpen, setNewMemoOpen] = useState(false);

  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null);
  const [viewerAttachments, setViewerAttachments] = useState<Attachment[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [memoData, msgs, atts] = await Promise.all([
        memoService.getMemoById(id),
        messageService.getMessages(id),
        attachmentService.getAttachments(id),
      ]);
      if (memoData) {
        setMemo(memoData);
        markAsRead(id);
        const woData = await memoService.getMemosForWorkOrder(memoData.workOrderNumber);
        setWoMemos(woData);
      }
      setMessages(msgs);
      setMemoAttachments(atts);
      setActivityLog(getActivityLogForMemo(id));
    } finally {
      setLoading(false);
    }
  }, [id, markAsRead]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async () => {
    if (!memo || !newStatus) return;
    await ctxUpdateStatus(memo.id, newStatus);
    setStatusDialogOpen(false);
    setNewStatus('');
    loadData();
  };

  const openAttachmentViewer = (attachment: Attachment, allAttachments: Attachment[]) => {
    setViewerAttachment(attachment);
    setViewerAttachments(allAttachments);
  };

  if (loading || !memo) {
    return (
      <div className="memo-conversation-page">
        <AppShellBar />
        <BusyIndicator active delay={200} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }

  const openMemoCount = woMemos.filter(m => m.status !== 'Closed').length;
  const validTransitions = VALID_STATUS_TRANSITIONS[memo.status];

  return (
    <div className="memo-conversation-page">
      <AppShellBar />
      <div className="memo-conversation-body">
        <MemoSideNav memos={woMemos} activeMemoId={memo.id} />
        <div className="memo-conversation-main">
          {openMemoCount > 1 && (
            <MessageStrip design="Critical" hideCloseButton style={{ margin: '0.5rem 1rem 0' }}>
              This work order has {openMemoCount} open memo(s) requiring attention.
            </MessageStrip>
          )}

          <ObjectPage
            titleArea={
              <ObjectPageTitle
                header={`WO ${memo.workOrderNumber} / Task ${memo.taskNumber}`}
                subHeader={`Notification ${memo.notificationNumber} · ${memo.jobNumber}`}
                actionsBar={
                  <Toolbar>
                    <ToolbarButton
                      text="Reply"
                      design="Emphasized"
                      icon="response"
                    />
                    <ToolbarButton
                      text="Add Attachment"
                      icon="attachment"
                    />
                    <ToolbarButton
                      text="Change Status"
                      icon="status-positive"
                      onClick={() => {
                        setNewStatus('');
                        setStatusDialogOpen(true);
                      }}
                    />
                    <ToolbarButton
                      text="New Memo"
                      icon="add"
                      onClick={() => setNewMemoOpen(true)}
                    />
                  </Toolbar>
                }
              />
            }
            headerArea={
              <ObjectPageHeader>
                <FlexBox wrap="Wrap" style={{ gap: '1.5rem' }}>
                  <div className="memo-attr">
                    <Label>Status</Label>
                    <ObjectStatus
                      state={STATUS_VALUE_STATE[memo.status] as any}
                      showDefaultIcon
                    >
                      {memo.status}
                    </ObjectStatus>
                  </div>
                  <div className="memo-attr">
                    <Label>Memo Type</Label>
                    <span>{memo.memoType}</span>
                  </div>
                  <div className="memo-attr">
                    <Label>Job Number</Label>
                    <span>{memo.jobNumber}</span>
                  </div>
                  <div className="memo-attr">
                    <Label>Stream Number</Label>
                    <span>{memo.streamNumber}</span>
                  </div>
                  <div className="memo-attr">
                    <Label>Serial Number</Label>
                    <span>{memo.serialNumber}</span>
                  </div>
                  <div className="memo-attr">
                    <Label>Created By</Label>
                    <span>{memo.createdBy}</span>
                  </div>
                  <div className="memo-attr">
                    <Label>Created Date</Label>
                    <span>{memo.createdDate}</span>
                  </div>
                  <div className="memo-attr">
                    <Label>Last Updated</Label>
                    <span>{memo.lastUpdated}</span>
                  </div>
                </FlexBox>
              </ObjectPageHeader>
            }
          >
            <ObjectPageSection id="content" titleText="Content" hideTitleText>
              <TabContainer>
                <Tab text={`Messages (${messages.length})`}>
                  <MessagesTab
                    memoId={memo.id}
                    messages={messages}
                    onMessagesChange={loadData}
                    onAttachmentClick={openAttachmentViewer}
                  />
                </Tab>
                <Tab text={`Attachments (${memoAttachments.length})`}>
                  <AttachmentsTab
                    attachments={memoAttachments}
                    onAttachmentClick={openAttachmentViewer}
                    onUpload={async (files) => {
                      for (const file of files) {
                        await attachmentService.uploadAttachment(memo.id, file);
                      }
                      loadData();
                    }}
                    onDelete={async (attId) => {
                      await attachmentService.deleteAttachment(attId);
                      loadData();
                    }}
                  />
                </Tab>
                <Tab text="Details">
                  <MemoDetailsTab memo={memo} activityLog={activityLog} />
                </Tab>
              </TabContainer>
            </ObjectPageSection>
          </ObjectPage>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        headerText="Change Memo Status"
        footer={
          <Bar
            design="Footer"
            endContent={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button design="Transparent" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                <Button
                  design="Emphasized"
                  onClick={handleStatusChange}
                  disabled={!newStatus}
                >
                  Confirm
                </Button>
              </FlexBox>
            }
          />
        }
        onClose={() => setStatusDialogOpen(false)}
      >
        <div style={{ padding: '1rem', minWidth: '320px' }}>
          <Label showColon style={{ display: 'block', marginBottom: '0.5rem' }}>New Status</Label>
          {validTransitions.length === 0 ? (
            <MessageStrip design="Information" hideCloseButton>
              Contact admin to reopen a closed memo.
            </MessageStrip>
          ) : (
            <Select
              style={{ width: '100%' }}
              onChange={(e: any) => setNewStatus(e.detail.selectedOption.value as MemoStatus)}
            >
              <Option value="">Select status...</Option>
              {validTransitions.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
          )}
        </div>
      </Dialog>

      {/* New Memo Panel */}
      {newMemoOpen && (
        <NewMemoPanel
          onClose={() => setNewMemoOpen(false)}
          onCreated={() => {
            setNewMemoOpen(false);
            refreshMemos();
            loadData();
          }}
          prefillWorkOrder={memo.workOrderNumber}
        />
      )}

      {/* Attachment Viewer */}
      {viewerAttachment && (
        <AttachmentViewer
          attachment={viewerAttachment}
          attachments={viewerAttachments}
          onClose={() => setViewerAttachment(null)}
          onNavigate={(att) => setViewerAttachment(att)}
        />
      )}
    </div>
  );
}
