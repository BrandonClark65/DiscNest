import type { z } from 'zod';
import { editableProfileSchema } from '@/lib/validation/userSchema';

type EditableUserFields = z.infer<typeof editableProfileSchema>;

type Props = {
  profile: Partial<EditableUserFields>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<EditableUserFields>>>;
};

export default function ProfileBasicTab({ profile, setProfile }: Props) {
  const fields: (keyof EditableUserFields)[] = ['name', 'username', 'bio'];

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field}>
          <label className="block font-medium capitalize mb-1">{field}</label>
          {field === 'bio' ? (
            <textarea
              value={profile.bio ?? ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full min-h-[80px] focus:ring-2 focus:ring-[var(--accent)]/40"
            />
          ) : (
            <input
              type="text"
              value={(profile[field] as string) ?? ''}
              onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
              className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full focus:ring-2 focus:ring-[var(--accent)]/40"
            />
          )}
        </div>
      ))}
    </div>
  );
}
