export type MemoStatus = 'New' | 'Released' | 'In Progress' | 'Technically Complete' | 'Closed';
export type MemoType = 'Access Issue' | 'Additional Works' | 'Unavailability' | 'Other';
export type MessageType = 'Request' | 'Reply' | 'Rejection' | 'Info Update';
export type Organization = 'Homes Victoria' | 'VOC';
export type ErrorDirection = 'Inbound' | 'Outbound';
export type ErrorStatus = 'Unresolved' | 'Retrying' | 'Resolved';
export type Priority = 'Normal' | 'Urgent';

export interface Memo {
  id: string;
  jobNumber: string;
  workOrderNumber: string;
  notificationNumber: string;
  taskNumber: string;
  streamNumber: string;
  serialNumber: string;
  memoType: MemoType;
  status: MemoStatus;
  lastMessageFrom: Organization;
  lastUpdated: string;
  messageCount: number;
  unreadCount: number;
  attachmentCount: number;
  hasFailedResponse: boolean;
  createdBy: string;
  createdDate: string;
}

export interface Message {
  id: string;
  memoId: string;
  sender: Organization;
  senderName: string;
  messageType: MessageType;
  subject: string;
  body: string;
  timestamp: string;
  attachments: Attachment[];
  isDeliveryFailed?: boolean;
}

export interface Attachment {
  id: string;
  memoId: string;
  messageId?: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadedBy: Organization;
  uploadDate: string;
  url: string;
  thumbnailUrl?: string;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  direction: ErrorDirection;
  errorType: string;
  workOrderNumber: string;
  memoId: string;
  jobNumber: string;
  streamNumber: string;
  errorDetail: string;
  status: ErrorStatus;
  fullErrorMessage: string;
  originalPayload: string;
  retryHistory: RetryEntry[];
}

export interface RetryEntry {
  timestamp: string;
  result: string;
}

export interface ActivityLogEntry {
  id: string;
  memoId: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
}

export interface NewMemoData {
  workOrderNumber: string;
  jobNumber: string;
  notificationNumber: string;
  memoType: MemoType;
  priority: Priority;
  subject: string;
  message: string;
  attachments: File[];
}

export const VALID_STATUS_TRANSITIONS: Record<MemoStatus, MemoStatus[]> = {
  'New': ['Released', 'In Progress'],
  'Released': ['In Progress'],
  'In Progress': ['Technically Complete'],
  'Technically Complete': ['Closed', 'In Progress'],
  'Closed': [],
};

export const STATUS_VALUE_STATE: Record<MemoStatus, string> = {
  'New': 'Information',
  'Released': 'Positive',
  'In Progress': 'Warning',
  'Technically Complete': 'None',
  'Closed': 'None',
};
