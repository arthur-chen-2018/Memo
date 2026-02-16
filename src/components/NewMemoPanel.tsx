import { useState, useRef } from 'react';
import {
  Bar,
  Button,
  Input,
  Select,
  Option,
  TextArea,
  FileUploader,
  Label,
  Toast,
  Title,
  FlexBox,
  MessageBox,
} from '@ui5/webcomponents-react';
import ValueState from '@ui5/webcomponents-base/dist/types/ValueState.js';
import { useAppContext } from '@/context/AppContext';
import type { MemoType, Priority, NewMemoData } from '@/types';
import './NewMemoPanel.css';

import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/delete.js';

interface NewMemoPanelProps {
  onClose: () => void;
  onCreated: () => void;
  prefillWorkOrder?: string;
}

interface FormErrors {
  memoType?: string;
  subject?: string;
  message?: string;
}

export default function NewMemoPanel({ onClose, onCreated, prefillWorkOrder }: NewMemoPanelProps) {
  const { addMemo } = useAppContext();
  const toastRef = useRef<any>(null);

  const [workOrderNumber, setWorkOrderNumber] = useState(prefillWorkOrder || '40001234');
  const [jobNumber] = useState('JOB-78901');
  const [notificationNumber] = useState('20004567');
  const [memoType, setMemoType] = useState<MemoType | ''>('');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showError, setShowError] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!memoType) newErrors.memoType = 'Memo Type is required';
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const data: NewMemoData = {
        workOrderNumber,
        jobNumber,
        notificationNumber,
        memoType: memoType as MemoType,
        priority,
        subject,
        message,
        attachments: files,
      };
      const newMemo = await addMemo(data);
      toastRef.current?.show();
      setTimeout(() => onCreated(), 1500);
    } catch {
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: any) => {
    const newFiles = Array.from(e.detail?.files || []) as File[];
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="new-memo-backdrop" onClick={onClose} />
      <div className="new-memo-panel">
        <Bar
          design="Header"
          startContent={<Title level="H5">New Memo</Title>}
          endContent={
            <Button icon="decline" design="Transparent" onClick={onClose} />
          }
        />
        <div className="new-memo-form">
          <div className="new-memo-field">
            <Label showColon>Job Number</Label>
            <Input value={jobNumber} readonly />
          </div>
          <div className="new-memo-field">
            <Label showColon>Work Order Number</Label>
            <Input
              value={workOrderNumber}
              onInput={(e: any) => setWorkOrderNumber(e.target.value)}
            />
          </div>
          <div className="new-memo-field">
            <Label showColon>Notification Number</Label>
            <Input value={notificationNumber} readonly />
          </div>
          <div className="new-memo-field">
            <Label showColon required>Memo Type</Label>
            <Select
              valueState={errors.memoType ? ValueState.Negative : ValueState.None}
              valueStateMessage={errors.memoType ? <span>{errors.memoType}</span> : undefined}
              onChange={(e: any) => {
                setMemoType(e.detail.selectedOption.value as MemoType);
                setErrors(prev => ({ ...prev, memoType: undefined }));
              }}
            >
              <Option value="">Select type...</Option>
              <Option value="Access Issue">Access Issue</Option>
              <Option value="Additional Works">Additional Works</Option>
              <Option value="Unavailability">Unavailability</Option>
              <Option value="Other">Other</Option>
            </Select>
          </div>
          <div className="new-memo-field">
            <Label showColon>Priority</Label>
            <Select onChange={(e: any) => setPriority(e.detail.selectedOption.value as Priority)}>
              <Option value="Normal">Normal</Option>
              <Option value="Urgent">Urgent</Option>
            </Select>
          </div>
          <div className="new-memo-field">
            <Label showColon required>Subject</Label>
            <Input
              value={subject}
              maxlength={40}
              valueState={errors.subject ? ValueState.Negative : ValueState.None}
              valueStateMessage={errors.subject ? <span>{errors.subject}</span> : undefined}
              onInput={(e: any) => {
                setSubject(e.target.value);
                setErrors(prev => ({ ...prev, subject: undefined }));
              }}
            />
            <span className="new-memo-char-count">{subject.length}/40</span>
          </div>
          <div className="new-memo-field">
            <Label showColon required>Message</Label>
            <TextArea
              value={message}
              rows={5}
              valueState={errors.message ? ValueState.Negative : ValueState.None}
              valueStateMessage={errors.message ? <span>{errors.message}</span> : undefined}
              onInput={(e: any) => {
                setMessage(e.target.value);
                setErrors(prev => ({ ...prev, message: undefined }));
              }}
              growing
            />
          </div>
          <div className="new-memo-field">
            <Label showColon>Attachments</Label>
            <FileUploader
              hideInput
              onChange={handleFileChange}
            >
              <Button icon="add" design="Transparent">Add File</Button>
            </FileUploader>
            {files.length > 0 && (
              <FlexBox wrap="Wrap" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                {files.map((file, i) => (
                  <div key={i} className="new-memo-file-chip">
                    <span>{file.name}</span>
                    <Button
                      icon="decline"
                      design="Transparent"
                      onClick={() => removeFile(i)}
                      className="new-memo-file-remove"
                    />
                  </div>
                ))}
              </FlexBox>
            )}
          </div>
        </div>
        <Bar
          design="Footer"
          endContent={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button design="Transparent" onClick={onClose}>Cancel</Button>
              <Button design="Emphasized" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </FlexBox>
          }
        />
      </div>
      <Toast ref={toastRef}>Memo created successfully</Toast>
      {showError && (
        <MessageBox
          type="Error"
          open
          onClose={() => setShowError(false)}
        >
          Failed to create memo. Please try again.
        </MessageBox>
      )}
    </>
  );
}
