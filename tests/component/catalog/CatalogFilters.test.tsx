import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CatalogFilters from "@/components/catalog/CatalogFilters";

type FilterState = {
  search: string;
  brands: string[];
  types: string[];
  stabilities: string[];
  speeds: string[];
};

type OpenSections = {
  brand: boolean;
  type: boolean;
  stability: boolean;
  speed: boolean;
};

const baseFilter: FilterState = {
  search: "",
  brands: [],
  types: [],
  stabilities: [],
  speeds: [],
};

const baseSections: OpenSections = {
  brand: true,
  type: false,
  stability: false,
  speed: false,
};

const defaultProps = () => ({
  isMobile: false,
  filtersOpen: true,
  setFiltersOpen: vi.fn(),
  filter: { ...baseFilter },
  setFilter: vi.fn() as unknown as React.Dispatch<React.SetStateAction<FilterState>>,
  openSections: { ...baseSections },
  toggleAccordion: vi.fn(),
  handleCheckboxChange: vi.fn(),
  handleClearFilters: vi.fn(),
  uniqueBrands: ["Innova", "Discraft"],
  uniqueTypes: ["Putter"],
  uniqueStabilities: ["Overstable"],
  uniqueSpeeds: ["5"],
});

describe("CatalogFilters", () => {
  test("returns null on mobile when drawer closed", () => {
    const { container } = render(
      <CatalogFilters
        {...defaultProps()}
        isMobile
        filtersOpen={false}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("shows mobile drawer and close button", async () => {
    const user = userEvent.setup();
    const props = defaultProps();
    props.isMobile = true;
    props.setFiltersOpen = vi.fn();

    render(<CatalogFilters {...props} />);

    await user.click(screen.getByRole("button", { name: /Close Filters/i }));
    expect(props.setFiltersOpen).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole("button", { name: /Clear Filters/i }));
    expect(props.handleClearFilters).toHaveBeenCalled();
  });

  test("desktop search updates filter and checkbox triggers handler", async () => {
    const user = userEvent.setup();
    const props = defaultProps();

    render(<CatalogFilters {...props} />);

    await user.type(screen.getByPlaceholderText(/Search by name/i), "buzz");
    expect(props.setFilter).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /brand/i }));
    expect(props.toggleAccordion).toHaveBeenCalledWith("brand");

    const brandCheckbox = screen.getByLabelText("Innova");
    await user.click(brandCheckbox);
    expect(props.handleCheckboxChange).toHaveBeenCalledWith("brands", "Innova");
  });
});

