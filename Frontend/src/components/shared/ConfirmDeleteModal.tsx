import { Trash2, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemName: string;
  isLoading: boolean;
  title?: string;
  description?: string;
  icon?: React.ElementType;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading,
  title = "Delete Item",
  description = "This action cannot be undone.",
  icon: Icon = Trash2,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error is handled by the calling component
    }
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-slate-900/50
        px-4
        backdrop-blur-sm
      "
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-item-title"
        aria-describedby="delete-item-description"
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-2xl
        "
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-rose-50
                text-rose-600
              "
            >
              <Icon size={21} />
            </div>

            <div>
              <h2
                id="delete-item-title"
                className="
                  text-lg
                  font-semibold
                  text-slate-900
                "
              >
                {title}
              </h2>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                "
              >
                Permanent action
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="mt-6">
          <p
            id="delete-item-description"
            className="
              text-sm
              leading-6
              text-slate-600
            "
          >
            Are you sure you want to delete{" "}
            <span
              className="
                font-semibold
                text-slate-900
              "
            >
              {itemName}
            </span>
            ?
          </p>

          <p
            className="
              mt-2
              text-sm
              text-slate-500
            "
          >
            {description}
          </p>
        </div>

        {/* Modal Actions */}
        <div
          className="
            mt-7
            flex
            justify-end
            gap-3
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2.5
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="
              inline-flex
              min-w-[100px]
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-rose-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-rose-700
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {isLoading ? "Deleting..." : <>Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}
