import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import CreateDiscRequestForm from "@/components/marketplace/CreateDiscRequestForm";
import type { Disc } from "@/types/disc";

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

function getControlLabeled(labelText: RegExp) {
  // First try using RTL's getByLabelText which handles htmlFor/id associations
  try {
    const control = screen.getByLabelText(labelText);
    if (control && (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA' || control.tagName === 'SELECT')) {
      return control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    }
  } catch {
    // Fallback to original logic
  }
  
  const label = screen.getAllByText(labelText)[0];
  if (!label) {
    throw new Error(`Label ${labelText} not found`);
  }
  
  // Try to find control via htmlFor/id association
  const htmlFor = label.getAttribute('htmlFor') || label.getAttribute('for');
  if (htmlFor) {
    const control = document.getElementById(htmlFor);
    if (control && (control.tagName === 'INPUT' || control.tagName === 'TEXTAREA' || control.tagName === 'SELECT')) {
      return control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    }
  }
  
  // Fallback: look in parent element
  const control = label.parentElement?.querySelector<HTMLElement>(
    "input, textarea, select"
  );
  if (!control) {
    throw new Error(`Control for ${labelText} not found`);
  }
  return control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
}

const makeResponse = (data: any, ok = true) => ({
  ok,
  json: async () => data,
});

const setGeoSuccess = (coords = { latitude: 40, longitude: -120 }) => {
  const geo = {
    getCurrentPosition: vi.fn((success) =>
      success({
        coords,
      })
    ),
  };
  Object.defineProperty(global.navigator, "geolocation", {
    value: geo,
    configurable: true,
  });
  return geo;
};

const setGeoFailure = () => {
  const geo = {
    getCurrentPosition: vi.fn((_success, error) => {
      error?.({ code: 1, message: "denied" });
    }),
  };
  Object.defineProperty(global.navigator, "geolocation", {
    value: geo,
    configurable: true,
  });
  return geo;
};

const setupFetchForRequest = (discs: Disc[] = []) => {
  const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    const route = typeof url === "string" ? url : url.toString();
    if (route.includes("/api/user/discs/bag")) {
      return makeResponse({ bag: discs });
    }
    if (route.includes("/api/user/discs/shelf")) {
      return makeResponse({ shelf: [] });
    }
    if (route === "/api/requests") {
      return makeResponse({ _id: "request-1" });
    }
    return makeResponse({});
  });
  global.fetch = fetchMock as any;
  return fetchMock;
};

describe("CreateDiscRequestForm", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    toastMock.mockClear();
    toastMock.success.mockClear();
    toastMock.error.mockClear();
  });

  test("selecting disc auto-fills fields", async () => {
    setGeoSuccess();
    const discs: Disc[] = [
      {
        _id: "disc-1",
        name: "Buzzz",
        brand: "Discraft",
        plastic: "ESP",
        weight: 177,
        color: "Orange",
      },
    ];
    setupFetchForRequest(discs);

    render(<CreateDiscRequestForm user={defaultUser} />);

    await waitFor(() => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(0);
    });
    const selector = screen.getAllByRole("combobox")[0];
    await userEvent.selectOptions(selector, "disc-1");

    await waitFor(() => {
      expect(getControlLabeled(/Title/i)).toHaveValue("Buzzz");
    });
    expect(getControlLabeled(/Brand/i)).toHaveValue("Discraft");
    expect(getControlLabeled(/Plastic/i)).toHaveValue("ESP");
    expect(getControlLabeled(/Weight/i)).toHaveValue(177);
    expect(getControlLabeled(/Color/i)).toHaveValue("Orange");
  });

  test("submits request with coordinates from geolocation", async () => {
    const geo = setGeoSuccess({ latitude: 55, longitude: -90 });
    const fetchMock = setupFetchForRequest();
    const onClose = vi.fn();

    render(<CreateDiscRequestForm user={defaultUser} onClose={onClose} />);

    await waitFor(() => {
      expect(geo.getCurrentPosition).toHaveBeenCalled();
    });

    await userEvent.type(getControlLabeled(/Title/i), "Need a midrange");
    await userEvent.type(getControlLabeled(/Description/i), "Looking for backups");

    await userEvent.click(screen.getByRole("button", { name: /Post Request/i }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(
        ([url]) => url === "/api/requests"
      );
      expect(postCall).toBeTruthy();
      const [, init] = postCall as unknown as [
        RequestInfo,
        RequestInit | undefined
      ];
      expect(init?.body).toBeDefined();
      const body = JSON.parse(init!.body as string);
      expect(body).toMatchObject({
        title: "Need a midrange",
        latitude: 55,
        longitude: -90,
      });
    });

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Disc request posted!");
    });
    expect(onClose).toHaveBeenCalled();
  });

  test("alerts when location cannot be determined", async () => {
    setGeoFailure();
    const fetchMock = setupFetchForRequest();

    render(<CreateDiscRequestForm user={defaultUser} />);

    await waitFor(() => {
      expect(getControlLabeled(/^City$/i)).toBeInTheDocument();
    });

    await userEvent.type(getControlLabeled(/Title/i), "Need disc");
    await userEvent.type(getControlLabeled(/Description/i), "Help");
    await userEvent.type(getControlLabeled(/^City$/i), "Austin");
    await userEvent.type(getControlLabeled(/^State$/i), "TX");

    await userEvent.click(screen.getByRole("button", { name: /Post Request/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Location not provided. Please enable location or enter city/state."
      );
    });

    const postCall = fetchMock.mock.calls.find(
      ([url]) => url === "/api/requests"
    );
    expect(postCall).toBeUndefined();
  });
});

