'use client';

import { DiscBrand, DiscPlastic, DiscBrands } from '@/app/constants/discData';
import { DiscPlasticsByBrand, getPlasticsByBrand } from '@/app/constants/discData';

type GroupedSelectProps = {
  value: string;
  onChange: (value: string) => void;
  filterByBrand?: DiscBrand | '';
  className?: string;
  placeholder?: string;
  includeUnknown?: boolean;
  id?: string;
};

/**
 * Renders a select dropdown with plastics grouped by brand.
 * Brand headers are non-selectable optgroup elements.
 */
export default function GroupedSelect({
  value,
  onChange,
  filterByBrand = '',
  className = '',
  placeholder = 'Select plastic',
  includeUnknown = true,
  id,
}: GroupedSelectProps) {
  // If filtering by brand, show simple list
  if (filterByBrand) {
    const plasticsToShow = getPlasticsByBrand(filterByBrand);
    const hasMappings = plasticsToShow.length > 0;
    const valueInList = value && plasticsToShow.includes(value as DiscPlastic);
    
    // Always show filtered list when brand is selected, but include current value if it's not in the list
    const baseOptions = hasMappings 
      ? [...plasticsToShow] 
      : [...getPlasticsByBrand('')]; // Fallback to all if no mappings
    
    // Build options array, ensuring uniqueness
    const optionsSet = new Set<string>(baseOptions);
    
    // If value exists and isn't in the list, add it so it can be displayed
    if (value && !valueInList && value !== '' && value !== 'Unknown') {
      optionsSet.add(value);
    }
    
    // Convert Set to array to ensure uniqueness
    const optionsToShow = Array.from(optionsSet) as DiscPlastic[];
    
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        <option value="">{placeholder}</option>
        {optionsToShow.map((plastic) => (
          <option key={plastic} value={plastic}>
            {plastic}
          </option>
        ))}
        {includeUnknown && (
          <option value="Unknown">Unknown</option>
        )}
      </select>
    );
  }

  // Otherwise, show grouped by brand
  const brandGroups = DiscBrands.filter((brand) => {
    const brandPlastics = DiscPlasticsByBrand[brand];
    return brandPlastics && brandPlastics.length > 0;
  });

  // Fallback: if no brand groupings exist yet, show all plastics in "Other" group
  const hasGroupings = brandGroups.length > 0;

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {hasGroupings ? (
        <>
          {brandGroups.map((brand) => {
            const brandPlastics = DiscPlasticsByBrand[brand];
            if (!brandPlastics || brandPlastics.length === 0) return null;
            
            return (
              <optgroup key={brand} label={brand}>
                {brandPlastics.map((plastic) => (
                  <option key={plastic} value={plastic}>
                    {plastic}
                  </option>
                ))}
              </optgroup>
            );
          })}
          {includeUnknown && (
            <optgroup label="Other">
              <option value="Unknown">Unknown</option>
            </optgroup>
          )}
        </>
      ) : (
        // Fallback: show all plastics in a flat list until brand mappings are populated
        <>
          {getPlasticsByBrand('').map((plastic) => (
            <option key={plastic} value={plastic}>
              {plastic}
            </option>
          ))}
        </>
      )}
    </select>
  );
}

