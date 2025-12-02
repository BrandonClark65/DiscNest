import type { z } from 'zod';
import { editableProfileSchema } from '@/lib/validation/userSchema';
import { DiscBrands, DiscPlastics } from '@/app/constants/discData';
import MultiSelect from '@/components/ui/MultiSelect';

type EditableUserFields = z.infer<typeof editableProfileSchema>;

type Props = {
  profile: Partial<EditableUserFields>;
  setProfile: React.Dispatch<React.SetStateAction<Partial<EditableUserFields>>>;
};

export default function ProfilePlayTab({ profile, setProfile }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* --- Core Play Selections --- */}
      <div>
        <label className="block font-medium">Dominant Hand</label>
        <select
          value={profile.dominantHand ?? 'Right'}
          onChange={(e) =>
            setProfile({
              ...profile,
              dominantHand: e.target.value as EditableUserFields['dominantHand'],
            })
          }
          className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
        >
          <option>Left</option>
          <option>Right</option>
          <option>Both</option>
        </select>
      </div>

      <div>
        <label className="block font-medium">Throw Style</label>
        <select
          value={profile.throwStyle ?? 'Backhand'}
          onChange={(e) =>
            setProfile({
              ...profile,
              throwStyle: e.target.value as EditableUserFields['throwStyle'],
            })
          }
          className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
        >
          <option>Backhand</option>
          <option>Forehand</option>
          <option>Both</option>
        </select>
      </div>

      {/* --- MultiSelect sections --- */}
      <div className="col-span-2">
        <MultiSelect
          label="Favorite Brands"
          options={[...DiscBrands]}
          value={profile.favoriteBrands ?? []}
          onChange={(val) =>
            setProfile({
              ...profile,
              favoriteBrands: val as EditableUserFields['favoriteBrands'],
            })
          }
        />
      </div>

      <div className="col-span-2">
        <MultiSelect
          label="Preferred Disc Types"
          options={['Putter', 'Midrange', 'Fairway Driver', 'Distance Driver']}
          value={profile.preferredDiscTypes ?? []}
          onChange={(val) =>
            setProfile({
              ...profile,
              preferredDiscTypes: val as EditableUserFields['preferredDiscTypes'],
            })
          }
        />
      </div>

      {/* --- Other Selects --- */}
      <div>
        <label className="block font-medium">Stability Preference</label>
        <select
          value={profile.stabilityPreference ?? 'Straight'}
          onChange={(e) =>
            setProfile({
              ...profile,
              stabilityPreference: e.target.value as EditableUserFields['stabilityPreference'],
            })
          }
          className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
        >
          <option>Straight</option>
          <option>Overstable</option>
          <option>Understable</option>
        </select>
      </div>

      <div>
        <label className="block font-medium">Arm Speed</label>
        <select
          value={profile.armSpeed ?? 'Medium'}
          onChange={(e) =>
            setProfile({
              ...profile,
              armSpeed: e.target.value as EditableUserFields['armSpeed'],
            })
          }
          className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
        >
          <option>Slow</option>
          <option>Medium</option>
          <option>Fast</option>
        </select>
      </div>

      <div>
        <label className="block font-medium">Skill Level</label>
        <select
          value={profile.skillLevel ?? 'Intermediate'}
          onChange={(e) =>
            setProfile({
              ...profile,
              skillLevel: e.target.value as EditableUserFields['skillLevel'],
            })
          }
          className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
        >
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
          <option>Pro</option>
        </select>
      </div>

      <div>
        <label className="block font-medium">Play Frequency</label>
        <select
          value={profile.playFrequency ?? '1-2 times per week'}
          onChange={(e) =>
            setProfile({
              ...profile,
              playFrequency: e.target.value as EditableUserFields['playFrequency'],
            })
          }
          className="bg-[var(--background)] border border-[var(--muted)]/40 px-3 py-2 rounded-lg w-full"
        >
          <option>&lt;1 per week</option>
          <option>1-2 times per week</option>
          <option>Every day</option>
        </select>
      </div>

      <div className="col-span-2">
        <MultiSelect
          label="Preferred Plastics"
          options={[...DiscPlastics]}
          value={profile.preferredPlastics ?? []}
          onChange={(val) =>
            setProfile({
              ...profile,
              preferredPlastics: val as EditableUserFields['preferredPlastics'],
            })
          }
        />
      </div>
    </div>
  );
}
