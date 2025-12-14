import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import CreateListingForm from "@/components/marketplace/CreateListingForm";
import type { Disc } from "@/types/disc";

vi.mock("browser-image-compression", () => ({
  __esModule: true,
  default: vi.fn((file) => Promise.resolve(file)),
}));

const defaultUser = { id: "user-1", email: "user@test.com", name: "User" };
const originalFetch = global.fetch;

const toastMock = vi.hoisted(() => {
  const fn = vi.fn();
  fn.success = vi.fn();
  fn.error = vi.fn();
  return fn;
});

vi.mock("react-hot-toast", () => ({
  default: toastMock,
  toast: toastMock,
}));

const makeResponse = (data: any, ok = true) => ({
  ok,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

const setGeoSuccess = () => {
  const geo = {
    getCurrentPosition: vi.fn((success) =>
      success({
        coords: { latitude: 33, longitude: -118 },
      })
    ),
  };
  Object.defineProperty(global.navigator, "geolocation", {
    value: geo,
    configurable: true,
  });
  return geo;
};

const setupFetchForListing = (discs: Disc[] = []) => {
  const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    const route = typeof url === "string" ? url : url.toString();
    if (route.includes("/api/user/discs/bag")) {
      return makeResponse({ bag: discs });
    }
    if (route.includes("/api/user/discs/shelf")) {
      return makeResponse({ shelf: [] });
    }
    if (route === "/api/listings") {
      return makeResponse({ _id: "listing-1" });
    }
    return makeResponse({});
  });
  global.fetch = fetchMock as any;
  return fetchMock;
};

describe("CreateListingForm", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  });

  beforeEach(() => {
    setGeoSuccess();
  });

  test("selecting disc pre-fills form fields", async () => {
    const discs: Disc[] = [
      {
        _id: "disc-1",
        name: "Firebird",
        brand: "Innova",
        plastic: "Champion",
        weight: 175,
        type: "Fairway Driver",
      },
    ];

    const fetchMock = setupFetchForListing(discs);

    render(<CreateListingForm user={defaultUser} />);

    const bagUrl = "/api/user/discs/bag?email=user%40test.com";
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(bagUrl);
    });

    const discSelect = await screen.findByLabelText(/Select a disc from your bag/i);
    await userEvent.selectOptions(discSelect, "disc-1");

    await waitFor(() => {
      expect(screen.getByLabelText(/Title/i)).toHaveValue("Firebird");
    });
    expect(screen.getByLabelText(/Brand/i)).toHaveValue("Innova");
    expect(screen.getByLabelText(/Plastic/i)).toHaveValue("Champion");
    expect(screen.getByLabelText(/Weight/i)).toHaveValue(175);
  });

  test("submits listing with normalized payload and closes form", async () => {
    const fetchMock = setupFetchForListing();
    const onClose = vi.fn();

    render(<CreateListingForm user={defaultUser} onClose={onClose} />);

    const bagUrl = "/api/user/discs/bag?email=user%40test.com";
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(bagUrl);
    });

    await userEvent.type(screen.getByLabelText(/Title/i), "New Listing");
    await userEvent.type(screen.getByLabelText(/Description/i), "Great disc");
    await userEvent.type(screen.getByLabelText(/Weight/i), "173");

    const priceInput = screen.getByLabelText(/Price/i);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, "40");

    await userEvent.click(screen.getByRole("button", { name: /Post Listing/i }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url]) => url === "/api/listings"
      );
      expect(postCall).toBeTruthy();
      const [, init] = postCall as unknown as [
        RequestInfo,
        RequestInit | undefined
      ];
      expect(init?.body).toBeDefined();
      const body = JSON.parse(init!.body as string);
      expect(body).toMatchObject({
        title: "New Listing",
        weight: 173,
        userId: defaultUser.id,
        price: 40,
      });
    });

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Listing created!");
    });
    expect(onClose).toHaveBeenCalled();
  });
});

