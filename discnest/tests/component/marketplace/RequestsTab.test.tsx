import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import RequestsTab from "@/components/marketplace/RequestsTab";

const useDiscRequests = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useDiscRequests", () => ({
  __esModule: true,
  default: () => useDiscRequests(),
}));

const componentMocks = vi.hoisted(() => ({
  cardModule: {
    __esModule: true,
    default: vi.fn(({ request }: { request: any }) => <div>{request.title}</div>),
  },
  paginationModule: {
    __esModule: true,
    default: vi.fn(
      ({ onPageChange }: { onPageChange: (page: number) => void }) => (
        <button onClick={() => onPageChange(2)}>Next</button>
      )
    ),
  },
}));

const cardMock = componentMocks.cardModule.default;
const paginationMock = componentMocks.paginationModule.default;

vi.mock("@/components/marketplace/DiscRequestCard", () => componentMocks.cardModule);

vi.mock("@/components/marketplace/MarketplacePagination", () => componentMocks.paginationModule);

vi.mock("lucide-react", () => ({
  Loader2: (props: any) => <div role="status" data-testid="loader" {...props} />,
}));

describe("RequestsTab", () => {
  beforeEach(() => {
    useDiscRequests.mockReset();
    cardMock.mockClear();
    paginationMock.mockClear();
    window.scrollTo = vi.fn();
  });

  test("renders loading spinner", () => {
    useDiscRequests.mockReturnValue({
      loading: true,
      requests: [],
      page: 1,
      setPage: vi.fn(),
      totalPages: 0,
    });

    render(<RequestsTab currentUserId="viewer" />);

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  test("shows empty message", () => {
    useDiscRequests.mockReturnValue({
      loading: false,
      requests: [],
      page: 1,
      setPage: vi.fn(),
      totalPages: 0,
    });

    render(<RequestsTab currentUserId="viewer" />);

    expect(screen.getByText(/No disc requests yet/i)).toBeInTheDocument();
  });

  test("renders cards and pagination", async () => {
    const setPage = vi.fn();
    useDiscRequests.mockReturnValue({
      loading: false,
      requests: [{ _id: "r1", title: "Need a Teebird" }],
      page: 1,
      setPage,
      totalPages: 3,
    });

    render(<RequestsTab currentUserId="viewer" />);

    const cardProps = cardMock.mock.calls[0][0];
    expect(cardProps).toMatchObject({
      request: expect.objectContaining({ title: "Need a Teebird" }),
      currentUserId: "viewer",
    });

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
    expect(setPage).toHaveBeenCalledWith(2);
  });
});

