import { useState, useRef, useEffect } from 'react';
import { Button, TextArea, MessageStrip, Icon, FlexBox, Toast } from '@ui5/webcomponents-react';
import type { Message, Attachment } from '@/types';
import { messageService } from '@/services';
import './MessagesTab.css';

import '@ui5/webcomponents-icons/dist/paper-plane.js';
import '@ui5/webcomponents-icons/dist/attachment.js';
import '@ui5/webcomponents-icons/dist/refresh.js';

interface MessagesTabProps {
  memoId: string;
  messages: Message[];
  onMessagesChange: () => void;
  onAttachmentClick?: (attachment: Attachment, allAttachments: Attachment[]) => void;
}

export default function MessagesTab({ memoId, messages, onMessagesChange, onAttachmentClick }: MessagesTabProps) {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await messageService.sendMessage(memoId, replyText);
      setReplyText('');
      onMessagesChange();
      toastRef.current?.show();
    } finally {
      setSending(false);
    }
  };

  const getMessageTypeLabel = (type: string) => {
    const styles: Record<string, string> = {
      'Request': 'message-type-request',
      'Reply': 'message-type-reply',
      'Rejection': 'message-type-rejection',
      'Info Update': 'message-type-info',
    };
    return <span className={`message-type-chip ${styles[type] || ''}`}>{type}</span>;
  };

  const allAttachments = messages.flatMap(m => m.attachments);

  return (
    <div className="messages-tab">
      <div className="messages-thread">
        <MessageStrip design="Information" hideCloseButton className="messages-info-strip">
          Only your new message text will be sent to Homes Victoria. Previous messages are shown for context only.
        </MessageStrip>

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`message-card ${msg.sender === 'Homes Victoria' ? 'message-card-hv' : 'message-card-voc'}`}
          >
            <FlexBox alignItems="Center" className="message-header">
              <div className={`message-avatar ${msg.sender === 'Homes Victoria' ? 'avatar-hv' : 'avatar-voc'}`}>
                {msg.senderName.charAt(0)}
              </div>
              <div className="message-meta">
                <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                  <span className={`message-sender ${msg.sender === 'Homes Victoria' ? 'sender-hv' : 'sender-voc'}`}>
                    {msg.sender} — {msg.senderName}
                  </span>
                  {getMessageTypeLabel(msg.messageType)}
                </FlexBox>
                <span className="message-timestamp">{msg.timestamp}</span>
              </div>
            </FlexBox>

            {msg.isDeliveryFailed && (
              <MessageStrip design="Negative" className="message-failed-strip">
                <FlexBox alignItems="Center" style={{ gap: '0.5rem' }}>
                  Delivery failed — message was not sent to Homes Victoria.
                  <Button design="Transparent" icon="refresh" style={{ minWidth: 'auto' }}>Retry</Button>
                </FlexBox>
              </MessageStrip>
            )}

            <div className="message-subject">{msg.subject}</div>
            <div className="message-body">{msg.body}</div>

            {msg.attachments.length > 0 && (
              <FlexBox wrap="Wrap" className="message-attachments">
                {msg.attachments.map(att => (
                  <div
                    key={att.id}
                    className="message-attachment-chip"
                    onClick={() => onAttachmentClick?.(att, allAttachments)}
                  >
                    <Icon name="attachment" />
                    <span>{att.fileName}</span>
                  </div>
                ))}
              </FlexBox>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="messages-compose">
        <span className="compose-helper">Your response will be sent to Homes Victoria via API.</span>
        <FlexBox alignItems="End" style={{ gap: '0.5rem' }}>
          <TextArea
            value={replyText}
            onInput={(e: any) => setReplyText(e.target.value)}
            placeholder="Type your reply..."
            growing
            growingMaxRows={6}
            style={{ flex: 1 }}
          />
          <Button icon="attachment" design="Transparent" title="Attach file" />
          <Button
            icon="paper-plane"
            design="Emphasized"
            onClick={handleSend}
            disabled={!replyText.trim() || sending}
            title="Send"
          />
        </FlexBox>
      </div>

      <Toast ref={toastRef}>Message sent successfully</Toast>
    </div>
  );
}
