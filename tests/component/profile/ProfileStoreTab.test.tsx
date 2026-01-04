import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileStoreTab from '@/components/profile/ProfileStoreTab';

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: vi.fn(() => {
    return () => <div>Map Component</div>;
  }),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('ProfileStoreTab', () => {
  const mockSetProfile = vi.fn();
  const defaultProfile = {
    name: 'Test User',
    username: 'testuser',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders role selection', () => {
    render(
      <ProfileStoreTab
        profile={defaultProfile}
        setProfile={mockSetProfile}
        userRole="user"
      />
    );

    expect(screen.getByText('Account Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Regular User')).toBeInTheDocument();
    expect(screen.getByLabelText('Store')).toBeInTheDocument();
  });

  test('shows store fields when store role is selected', () => {
    render(
      <ProfileStoreTab
        profile={{ ...defaultProfile, role: 'store' }}
        setProfile={mockSetProfile}
        userRole="store"
      />
    );

    expect(screen.getByLabelText(/Store Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Set Store Location/i)).toBeInTheDocument();
  });

  test('hides store fields when user role is selected', () => {
    render(
      <ProfileStoreTab
        profile={defaultProfile}
        setProfile={mockSetProfile}
        userRole="user"
      />
    );

    expect(screen.queryByLabelText(/Store Name/i)).not.toBeInTheDocument();
  });

  test('normalizes store name input', () => {
    render(
      <ProfileStoreTab
        profile={{ ...defaultProfile, role: 'store' }}
        setProfile={mockSetProfile}
        userRole="store"
      />
    );

    const storeNameInput = screen.getByLabelText(/Store Name/i);
    fireEvent.change(storeNameInput, { target: { value: 'My Store Name!' } });

    expect(mockSetProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        storeName: 'my-store-name',
      })
    );
  });

  test('suggests store name when switching to store role', () => {
    render(
      <ProfileStoreTab
        profile={{ ...defaultProfile, username: 'testuser' }}
        setProfile={mockSetProfile}
        userRole="user"
      />
    );

    const storeRadio = screen.getByLabelText('Store');
    fireEvent.click(storeRadio);

    expect(mockSetProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'store',
        storeName: 'testuser',
      })
    );
  });

  test('handles location setting', async () => {
    const mockPosition = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    render(
      <ProfileStoreTab
        profile={{ ...defaultProfile, role: 'store' }}
        setProfile={mockSetProfile}
        userRole="store"
      />
    );

    const locationButton = screen.getByText(/Set Store Location/i);
    fireEvent.click(locationButton);

    await waitFor(() => {
      expect(mockSetProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          location: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749],
          },
        })
      );
    });
  });

  test('handles geolocation error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(new Error('Geolocation error'));
    });

    render(
      <ProfileStoreTab
        profile={{ ...defaultProfile, role: 'store' }}
        setProfile={mockSetProfile}
        userRole="store"
      />
    );

    const locationButton = screen.getByText(/Set Store Location/i);
    fireEvent.click(locationButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to get your location/i)).toBeInTheDocument();
    });
  });

  test('displays store URL preview', () => {
    render(
      <ProfileStoreTab
        profile={{ ...defaultProfile, role: 'store', storeName: 'my-store' }}
        setProfile={mockSetProfile}
        userRole="store"
      />
    );

    // Check for the specific preview text that includes "Your store page:"
    const previewText = screen.getByText(/Your store page:/i);
    expect(previewText).toBeInTheDocument();
    
    // Check that the URL appears in the preview section (within the same element)
    expect(previewText.textContent).toContain('/marketplace/store/my-store');
  });
});

