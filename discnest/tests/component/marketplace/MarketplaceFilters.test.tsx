import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MarketplaceFilters from "@/components/marketplace/MarketplaceFilters";

describe("MarketplaceFilters", () => {
  const setup = () => {
    const props = {
      searchQuery: "",
      setSearchQuery: vi.fn(),
      brandFilter: "",
      setBrandFilter: vi.fn(),
      conditionFilter: "",
      setConditionFilter: vi.fn(),
    };
    render(<MarketplaceFilters {...props} />);
    return props;
  };

  test("updates search input and calls setter", async () => {
    const user = userEvent.setup();
    const props = setup();

    const input = screen.getByPlaceholderText("Search discs...");
    await user.type(input, "buzzz");

    expect(props.setSearchQuery).toHaveBeenCalledTimes(5);
    expect(props.setSearchQuery.mock.calls.flat()).toEqual([
      "b",
      "u",
      "z",
      "z",
      "z",
    ]);
  });

  test("changes brand and condition selects", async () => {
    const user = userEvent.setup();
    const props = setup();

    const [brandSelect, conditionSelect] = screen.getAllByRole("combobox");

    await user.selectOptions(brandSelect, "Innova");
    await user.selectOptions(conditionSelect, "New");

    expect(props.setBrandFilter).toHaveBeenCalledWith("Innova");
    expect(props.setConditionFilter).toHaveBeenCalledWith("New");
  });

  test("renders brand options from catalog", () => {
    setup();
    expect(screen.getByRole("option", { name: "All Brands" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Innova" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Discraft" })).toBeInTheDocument();
  });
});

