import { toast } from 'react-toastify';
import { useEffect } from 'react';

interface ConfirmToastOptions {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

export const showConfirmToast = ({
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'red',
}: ConfirmToastOptions) => {
  // Create backdrop element
  const backdrop = document.createElement('div');
  backdrop.className = 'confirmation-backdrop';
  
  const removeBackdrop = () => {
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
  };

  // Add click handler to backdrop
  backdrop.onclick = () => {
    toast.dismiss(toastId);
    removeBackdrop();
  };

  // Add backdrop to body
  document.body.appendChild(backdrop);

  const toastId = toast.warning(
    <div onClick={(e) => e.stopPropagation()}>
      <p className="mb-2 font-semibold text-lg text-gray-900">{title}</p>
      <p className="mb-4 text-sm text-gray-600">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={async () => {
            toast.dismiss(toastId);
            removeBackdrop();
            await onConfirm();
          }}
          className="px-4 py-2 text-white rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: confirmColor === 'red' ? '#ef4444' : undefined,
          }}
          onMouseEnter={(e) => {
            if (confirmColor === 'red') {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }
          }}
          onMouseLeave={(e) => {
            if (confirmColor === 'red') {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }
          }}
        >
          {confirmText}
        </button>
        <button
          onClick={() => {
            toast.dismiss(toastId);
            removeBackdrop();
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
        >
          {cancelText}
        </button>
      </div>
    </div>,
    {
      containerId: 'confirmation',
      autoClose: false,
      closeButton: false,
      closeOnClick: false,
      onClose: removeBackdrop, // Clean up backdrop when toast closes
    }
  );

  return toastId;
};
