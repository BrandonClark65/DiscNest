type ProfileProgressProps = {
  percent: number;
};

export default function ProfileProgress({ percent }: ProfileProgressProps) {
  return (
    <div>
      <div className="w-full bg-[var(--surface)] rounded-full h-3 shadow-inner">
        <div
          className="h-3 rounded-full transition-all bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-sm text-[var(--foreground)]/70 mt-1 text-center sm:text-left">
        Profile Completion: {percent}%
      </p>
    </div>
  );
}
