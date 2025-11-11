type ProfileHeaderProps = {
  name: string;
  discCount: number;
};

export default function ProfileHeader({ name, discCount }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-sm">
        Welcome, {name}
      </h1>
      <div className="bg-[var(--primary)] text-[var(--background)] px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
        {discCount} Disc{discCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
