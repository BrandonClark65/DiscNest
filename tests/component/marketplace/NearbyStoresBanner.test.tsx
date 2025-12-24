import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NearbyStoresBanner from '@/components/marketplace/NearbyStoresBanner';

// Mock fetch
global.fetch = vi.fn();

describe('NearbyStoresBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders nothing when userLocation is null', () => {
    const { container } = render(<NearbyStoresBanner userLocation={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing while loading', () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { container } = render(<NearbyStoresBanner userLocation={{ lat: 37.7749, lng: -122.4194 }} />);
    expect(container.firstChild).toBeNull();
  });

  test('displays nearby stores when fetched', async () => {
    const mockStores = [
      {
        _id: '1',
        name: 'Store One',
        storeName: 'store-one',
        location: { coordinates: [-122.4194, 37.7749] },
        distance: 0.5,
      },
      {
        _id: '2',
        name: 'Store Two',
        storeName: 'store-two',
        location: { coordinates: [-122.4194, 37.7750] },
        distance: 1.2,
      },
    ];

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stores: mockStores }),
    });

    render(<NearbyStoresBanner userLocation={{ lat: 37.7749, lng: -122.4194 }} />);

    await waitFor(() => {
      expect(screen.getByText('Nearby Stores')).toBeInTheDocument();
      expect(screen.getByText('Store One')).toBeInTheDocument();
      expect(screen.getByText('Store Two')).toBeInTheDocument();
    });
  });

  test('displays distance correctly', async () => {
    const mockStores = [
      {
        _id: '1',
        name: 'Near Store',
        storeName: 'near-store',
        location: { coordinates: [-122.4194, 37.7749] },
        distance: 0.05, // Less than 0.1 miles (264 feet) - should display in feet
      },
    ];

    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stores: mockStores }),
    });

    render(<NearbyStoresBanner userLocation={{ lat: 37.7749, lng: -122.4194 }} />);

    await waitFor(() => {
      expect(screen.getByText(/ft away/i)).toBeInTheDocument();
    });
  });

  test('renders nothing when no stores found', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stores: [] }),
    });

    const { container } = render(
      <NearbyStoresBanner userLocation={{ lat: 37.7749, lng: -122.4194 }} />
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  test('handles fetch error gracefully', async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { container } = render(
      <NearbyStoresBanner userLocation={{ lat: 37.7749, lng: -122.4194 }} />
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});

