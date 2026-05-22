'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { UploadForm } from './UploadForm';

export function UploadButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="primary">
        Upload a photo
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Share a photo">
        <UploadForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
