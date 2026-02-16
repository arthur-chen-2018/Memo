import { useEffect, useCallback } from 'react';
import { Button, Icon, FlexBox } from '@ui5/webcomponents-react';
import type { Attachment } from '@/types';
import './AttachmentViewer.css';

import '@ui5/webcomponents-icons/dist/decline.js';
import '@ui5/webcomponents-icons/dist/download.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/navigation-left-arrow.js';
import '@ui5/webcomponents-icons/dist/navigation-right-arrow.js';
import '@ui5/webcomponents-icons/dist/document.js';

interface AttachmentViewerProps {
  attachment: Attachment;
  attachments: Attachment[];
  onClose: () => void;
  onNavigate: (attachment: Attachment) => void;
}

export default function AttachmentViewer({ attachment, attachments, onClose, onNavigate }: AttachmentViewerProps) {
  const currentIndex = attachments.findIndex(a => a.id === attachment.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < attachments.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) onNavigate(attachments[currentIndex - 1]);
  }, [hasPrev, currentIndex, attachments, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext) onNavigate(attachments[currentIndex + 1]);
  }, [hasNext, currentIndex, attachments, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToPrev, goToNext]);

  const isImage = attachment.fileType.startsWith('image/');
  const isPdf = attachment.fileType === 'application/pdf';
  const isVideo = attachment.fileType.startsWith('video/');

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="viewer-preview-image">
          <Icon name="document" style={{ fontSize: '4rem', color: 'var(--sapNeutralColor)' }} />
          <p style={{ color: 'var(--sapContent_ContrastTextColor)', marginTop: '1rem' }}>
            {attachment.fileName}
          </p>
          <p style={{ color: 'var(--sapNeutralColor)', fontSize: 'var(--sapFontSmallSize)' }}>
            Image preview (mock data — no actual file)
          </p>
        </div>
      );
    }
    if (isPdf) {
      return (
        <div className="viewer-preview-placeholder">
          <Icon name="document" style={{ fontSize: '4rem', color: 'var(--sapNeutralColor)' }} />
          <p style={{ color: 'var(--sapContent_ContrastTextColor)', marginTop: '1rem' }}>
            {attachment.fileName}
          </p>
          <p style={{ color: 'var(--sapNeutralColor)', fontSize: 'var(--sapFontSmallSize)' }}>
            PDF viewer placeholder
          </p>
          <Button design="Emphasized" icon="download" style={{ marginTop: '1rem' }}>Download</Button>
        </div>
      );
    }
    if (isVideo) {
      return (
        <div className="viewer-preview-placeholder">
          <Icon name="document" style={{ fontSize: '4rem', color: 'var(--sapNeutralColor)' }} />
          <p style={{ color: 'var(--sapContent_ContrastTextColor)', marginTop: '1rem' }}>
            {attachment.fileName}
          </p>
          <p style={{ color: 'var(--sapNeutralColor)', fontSize: 'var(--sapFontSmallSize)' }}>
            Video player placeholder
          </p>
        </div>
      );
    }
    return (
      <div className="viewer-preview-placeholder">
        <Icon name="document" style={{ fontSize: '4rem', color: 'var(--sapNeutralColor)' }} />
        <p style={{ color: 'var(--sapContent_ContrastTextColor)', marginTop: '1rem' }}>
          Preview not available
        </p>
        <p style={{ color: 'var(--sapNeutralColor)', fontSize: 'var(--sapFontSmallSize)' }}>
          {attachment.fileName} ({attachment.fileSize})
        </p>
        <Button design="Emphasized" icon="download" style={{ marginTop: '1rem' }}>Download</Button>
      </div>
    );
  };

  return (
    <div className="attachment-viewer-overlay">
      {/* Top bar */}
      <div className="attachment-viewer-topbar">
        <FlexBox alignItems="Center" style={{ gap: '1rem', flex: 1 }}>
          <span className="viewer-filename">{attachment.fileName}</span>
          <span className="viewer-counter">
            {currentIndex + 1} of {attachments.length}
          </span>
        </FlexBox>
        <FlexBox alignItems="Center" style={{ gap: '0.25rem' }}>
          <Button
            icon="navigation-left-arrow"
            design="Transparent"
            onClick={goToPrev}
            disabled={!hasPrev}
            title="Previous"
            className="viewer-nav-btn"
          />
          <Button
            icon="navigation-right-arrow"
            design="Transparent"
            onClick={goToNext}
            disabled={!hasNext}
            title="Next"
            className="viewer-nav-btn"
          />
          <Button icon="download" design="Transparent" title="Download" className="viewer-nav-btn" />
          {attachment.uploadedBy === 'VOC' && (
            <Button icon="delete" design="Transparent" title="Delete" className="viewer-nav-btn" />
          )}
          <Button icon="decline" design="Transparent" onClick={onClose} title="Close" className="viewer-nav-btn" />
        </FlexBox>
      </div>

      {/* Preview area */}
      <div className="attachment-viewer-content">
        {renderPreview()}
      </div>

      {/* Bottom metadata */}
      <div className="attachment-viewer-metadata">
        <FlexBox alignItems="Center" style={{ gap: '2rem' }}>
          <div>
            <span className="meta-label">Uploaded By: </span>
            <span className={attachment.uploadedBy === 'Homes Victoria' ? 'meta-hv' : 'meta-voc'}>
              {attachment.uploadedBy}
            </span>
          </div>
          <div>
            <span className="meta-label">Size: </span>
            <span>{attachment.fileSize}</span>
          </div>
          <div>
            <span className="meta-label">Date: </span>
            <span>{attachment.uploadDate}</span>
          </div>
        </FlexBox>
      </div>

      {/* Thumbnail strip */}
      {attachments.length > 1 && (
        <div className="attachment-viewer-thumbs">
          {attachments.map(att => (
            <div
              key={att.id}
              className={`viewer-thumb ${att.id === attachment.id ? 'viewer-thumb-active' : ''}`}
              onClick={() => onNavigate(att)}
              title={att.fileName}
            >
              <Icon name="document" />
              <span className="thumb-name">{att.fileName.substring(0, 12)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
