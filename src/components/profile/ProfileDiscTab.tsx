import type { z } from 'zod';
import { editableProfileSchema } from '@/lib/validation/userSchema';

type EditableUserFields = z.infer<typeof editableProfileSchema>;

type Props = {
  profile: Partial<EditableUserFields>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<EditableUserFields>>>;
};

export default function ProfileDiscTab({ profile, setProfile }: Props) {
  const fields = [
    { key: 'pdgaNumber', label: 'PDGA Number', type: 'number' },
    { key: 'homeCourse', label: 'Home Course', type: 'text' },
    { key: 'goals', label: 'Goals', type: 'text' },
  ] as const;

  return (
    <div className="space-y-4">
      {fields.map(({ key, label, type }) => (
        <div key={key}>
          <label className="block font-medium mb-1">{label}</label>
          <input
            type={type}
            value={
              typeof profile[key] === 'object'
                ? ''
                : (profile[key] as string | number | undefined) ?? ''
            }
            onChange={(e) =>
              setProfile({
                ...profile,
                [key]: type === 'number' ? Number(e.target.value) : e.target.value,
              })
            }
            className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        </div>
      ))}
    </div>
  );
}
