import React, { useState } from 'react';

interface SavePoseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, category: 'neutral' | 'action' | 'seated' | 'dynamic', description: string) => void;
}

export const SavePoseModal: React.FC<SavePoseModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'neutral' | 'action' | 'seated' | 'dynamic'>('dynamic');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), category, description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#1e2025] border border-[#2e323b] rounded-2xl shadow-2xl overflow-hidden text-neutral-100">
        <div className="px-5 py-4 border-b border-[#2e323b] flex items-center justify-between">
          <h3 className="font-semibold text-base">Save Custom 3D Pose</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Pose Name
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hero Three-Point Landing"
              className="w-full bg-[#141518] border border-[#2e323b] focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['dynamic', 'action', 'seated', 'neutral'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 text-xs font-medium rounded-xl border capitalize transition ${
                    category === cat
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-[#141518] border-[#2e323b] text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reference notes on anatomy, weight distribution, or foreshortening..."
              className="w-full bg-[#141518] border border-[#2e323b] focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 outline-none resize-none transition"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#2e323b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-[#282b32] rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition active:scale-95"
            >
              Save to Library
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
