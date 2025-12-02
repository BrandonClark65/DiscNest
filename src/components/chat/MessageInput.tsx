'use client';

import GradientButton from '@/components/ui/GradientButton';

type MessageInputProps = {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
};

export default function MessageInput({
  value,
  onChange,
  onSend,
}: MessageInputProps) {
  return (
    <div
      className="
        mt-4 flex gap-2 items-center
        bg-[var(--surface)] border border-[var(--muted)]/30 rounded-full shadow-sm
        px-3 py-2
      "
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your message..."
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
        className="
          flex-1 bg-transparent text-[var(--foreground)] placeholder-[var(--foreground)]/50
          focus:outline-none text-sm px-2
        "
      />
      <GradientButton
        label="Send"
        onClick={onSend}
        variant="primary"
        className="!px-5 !py-2 text-sm"
      />
    </div>
  );
}
