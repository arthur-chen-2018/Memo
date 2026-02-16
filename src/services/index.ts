import type { Memo, Message, Attachment, ErrorLog, MemoStatus, NewMemoData } from '@/types';
import {
  memos as mockMemos,
  messages as mockMessages,
  attachments as mockAttachments,
  errorLogs as mockErrors,
  getMemosForWorkOrder,
  getMessagesForMemo,
  getAttachmentsForMemo,
} from '@/data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let memosList = [...mockMemos];
let messagesList = [...mockMessages];
let attachmentsList = [...mockAttachments];
let errorsList = [...mockErrors];
let nextMemoId = 11;
let nextStreamNum = 52;
let nextMsgId = 6;

export const memoService = {
  async getMemos(filters?: Record<string, string>): Promise<Memo[]> {
    await delay(200);
    let result = [...memosList];
    if (filters) {
      if (filters.jobNumber) {
        result = result.filter(m => m.jobNumber.toLowerCase().includes(filters.jobNumber.toLowerCase()));
      }
      if (filters.workOrderNumber) {
        result = result.filter(m => m.workOrderNumber.includes(filters.workOrderNumber));
      }
      if (filters.notificationNumber) {
        result = result.filter(m => m.notificationNumber.includes(filters.notificationNumber));
      }
      if (filters.taskNumber) {
        result = result.filter(m => m.taskNumber.includes(filters.taskNumber));
      }
      if (filters.streamNumber) {
        result = result.filter(m => m.streamNumber.toLowerCase().includes(filters.streamNumber.toLowerCase()));
      }
      if (filters.status) {
        const statuses = filters.status.split(',');
        result = result.filter(m => statuses.includes(m.status));
      }
      if (filters.memoType) {
        result = result.filter(m => m.memoType === filters.memoType);
      }
    }
    return result;
  },

  async getMemoById(id: string): Promise<Memo | undefined> {
    await delay(100);
    return memosList.find(m => m.id === id);
  },

  async getMemosForWorkOrder(woNumber: string): Promise<Memo[]> {
    await delay(100);
    return memosList.filter(m => m.workOrderNumber === woNumber);
  },

  async createMemo(data: NewMemoData): Promise<Memo> {
    await delay(300);
    const newMemo: Memo = {
      id: String(nextMemoId++),
      jobNumber: data.jobNumber,
      workOrderNumber: data.workOrderNumber,
      notificationNumber: data.notificationNumber,
      taskNumber: '0010',
      streamNumber: `STR-${String(nextStreamNum++).padStart(4, '0')}`,
      serialNumber: `SN-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
      memoType: data.memoType,
      status: 'New',
      lastMessageFrom: 'VOC',
      lastUpdated: new Date().toLocaleString('en-AU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).replace(',', ''),
      messageCount: 1,
      unreadCount: 0,
      attachmentCount: data.attachments.length,
      hasFailedResponse: false,
      createdBy: 'VOC — Current User',
      createdDate: new Date().toLocaleDateString('en-AU'),
    };
    memosList = [newMemo, ...memosList];
    return newMemo;
  },

  async updateMemoStatus(id: string, status: MemoStatus): Promise<Memo> {
    await delay(200);
    const idx = memosList.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Memo not found');
    memosList[idx] = { ...memosList[idx], status };
    return memosList[idx];
  },
};

export const messageService = {
  async getMessages(memoId: string): Promise<Message[]> {
    await delay(150);
    return messagesList.filter(m => m.memoId === memoId);
  },

  async sendMessage(memoId: string, body: string, messageType: 'Reply' | 'Info Update' = 'Reply'): Promise<Message> {
    await delay(300);
    const newMsg: Message = {
      id: `msg-${nextMsgId++}`,
      memoId,
      sender: 'VOC',
      senderName: 'Current User',
      messageType,
      subject: messageType === 'Reply' ? 'Re: Response' : 'Info Update',
      body,
      timestamp: new Date().toLocaleString('en-AU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).replace(',', ''),
      attachments: [],
    };
    messagesList = [...messagesList, newMsg];

    // Update memo
    const memoIdx = memosList.findIndex(m => m.id === memoId);
    if (memoIdx !== -1) {
      memosList[memoIdx] = {
        ...memosList[memoIdx],
        messageCount: memosList[memoIdx].messageCount + 1,
        lastMessageFrom: 'VOC',
        lastUpdated: newMsg.timestamp,
      };
    }
    return newMsg;
  },
};

export const attachmentService = {
  async getAttachments(memoId: string): Promise<Attachment[]> {
    await delay(100);
    return attachmentsList.filter(a => a.memoId === memoId);
  },

  async uploadAttachment(memoId: string, file: File): Promise<Attachment> {
    await delay(500);
    const newAtt: Attachment = {
      id: `att-${Date.now()}`,
      memoId,
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      uploadedBy: 'VOC',
      uploadDate: new Date().toLocaleString('en-AU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false,
      }).replace(',', ''),
      url: URL.createObjectURL(file),
    };
    attachmentsList = [...attachmentsList, newAtt];
    return newAtt;
  },

  async deleteAttachment(id: string): Promise<void> {
    await delay(200);
    attachmentsList = attachmentsList.filter(a => a.id !== id);
  },
};

export const errorService = {
  async getErrors(filters?: Record<string, string>): Promise<ErrorLog[]> {
    await delay(200);
    let result = [...errorsList];
    if (filters) {
      if (filters.status) {
        result = result.filter(e => e.status === filters.status);
      }
      if (filters.errorType) {
        result = result.filter(e => e.errorType === filters.errorType);
      }
      if (filters.workOrderNumber) {
        result = result.filter(e => e.workOrderNumber.includes(filters.workOrderNumber));
      }
    }
    return result;
  },

  async retryError(id: string): Promise<ErrorLog> {
    await delay(500);
    const idx = errorsList.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Error not found');
    errorsList[idx] = {
      ...errorsList[idx],
      status: 'Retrying',
      retryHistory: [
        ...errorsList[idx].retryHistory,
        {
          timestamp: new Date().toLocaleString('en-AU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false,
          }).replace(',', ''),
          result: 'Retrying...',
        },
      ],
    };
    return errorsList[idx];
  },

  async resolveError(id: string): Promise<ErrorLog> {
    await delay(200);
    const idx = errorsList.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Error not found');
    errorsList[idx] = { ...errorsList[idx], status: 'Resolved' };
    return errorsList[idx];
  },
};
