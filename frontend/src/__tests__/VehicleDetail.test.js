import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VehicleDetail from '../components/Vehicledetail';

// Mock the api module
jest.mock('../components/api', () => ({
  __esModule: true,
  default: {
    getInventory: jest.fn(),
  },
  logTrafficSession: jest.fn().mockResolvedValue(undefined),
}));

import { logTrafficSession } from '../components/api';

const mockNavigateTo = jest.fn();
const mockUpdateCustomerData = jest.fn();

const defaultVehicle = {
  stockNumber: '24789',
  year: 2025,
  make: 'Chevrolet',
  model: 'Silverado 1500',
  trim: 'LT Crew Cab 4WD',
  vin: '1GCUDDED5RZ123456',
  exteriorColor: 'Summit White',
  interiorColor: 'Jet Black',
  engine: '5.3L EcoTec3 V8',
  drivetrain: '4WD',
  msrp: 52995,
  salePrice: 47495,
  status: 'In Stock',
  gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
  features: [
    'Trailering Package',
    'Heated Front Seats',
    'Apple CarPlay',
  ],
  rebates: [
    { name: 'Customer Cash', amount: 3000 },
    { name: 'Bonus Cash', amount: 1000 },
  ],
};

const defaultCustomerData = {
  selectedVehicle: defaultVehicle,
};

const renderVehicleDetail = (props = {}) => {
  return render(
    <VehicleDetail
      navigateTo={mockNavigateTo}
      updateCustomerData={mockUpdateCustomerData}
      customerData={{ ...defaultCustomerData, ...props.customerData }}
      {...props}
    />
  );
};

describe('VehicleDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders vehicle title with NEW prefix, year, make, model, and trim', () => {
      renderVehicleDetail();
      expect(screen.getByText(/NEW 2025 Chevrolet Silverado 1500 LT Crew Cab 4WD/)).toBeInTheDocument();
    });

    test('renders stock number', () => {
      renderVehicleDetail();
      expect(screen.getByText(/STOCK:/)).toBeInTheDocument();
      expect(screen.getByText(/24789/)).toBeInTheDocument();
    });

    test('renders VIN', () => {
      renderVehicleDetail();
      expect(screen.getByText(/VIN:/)).toBeInTheDocument();
      expect(screen.getByText(/1GCUDDED5RZ123456/)).toBeInTheDocument();
    });

    test('renders back button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Back to Inventory')).toBeInTheDocument();
    });

    test('renders vehicle status', () => {
      renderVehicleDetail();
      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });

    test('uses default vehicle when none selected', () => {
      render(
        <VehicleDetail
          navigateTo={mockNavigateTo}
          updateCustomerData={mockUpdateCustomerData}
          customerData={{}}
        />
      );
      expect(screen.getByText(/Silverado 1500/)).toBeInTheDocument();
    });
  });

  describe('Vehicle Specifications (Basic Info)', () => {
    test('displays exterior color', () => {
      renderVehicleDetail();
      expect(screen.getByText('Exterior')).toBeInTheDocument();
      expect(screen.getByText('Summit White')).toBeInTheDocument();
    });

    test('displays interior color', () => {
      renderVehicleDetail();
      expect(screen.getByText('Interior')).toBeInTheDocument();
      expect(screen.getByText('Jet Black')).toBeInTheDocument();
    });

    test('displays engine information', () => {
      renderVehicleDetail();
      expect(screen.getByText('Engine')).toBeInTheDocument();
      expect(screen.getByText('5.3L EcoTec3 V8')).toBeInTheDocument();
    });

    test('displays drivetrain information', () => {
      renderVehicleDetail();
      expect(screen.getByText('Drivetrain')).toBeInTheDocument();
      expect(screen.getByText('4WD')).toBeInTheDocument();
    });
  });

  describe('Pricing Information', () => {
    test('displays MSRP', () => {
      renderVehicleDetail();
      expect(screen.getByText('MSRP')).toBeInTheDocument();
      expect(screen.getByText('$52,995')).toBeInTheDocument();
    });

    test('displays Quirk Price', () => {
      renderVehicleDetail();
      expect(screen.getByText('Quirk Price')).toBeInTheDocument();
    });

    test('displays rebates', () => {
      renderVehicleDetail();
      expect(screen.getByText('Customer Cash')).toBeInTheDocument();
      expect(screen.getByText('-$3,000')).toBeInTheDocument();
      expect(screen.getByText('Bonus Cash')).toBeInTheDocument();
      expect(screen.getByText('-$1,000')).toBeInTheDocument();
    });

    test('displays calculated Quirk Price (MSRP minus rebates)', () => {
      renderVehicleDetail();
      // $52,995 - $3,000 - $1,000 = $48,995
      expect(screen.getByText('$48,995')).toBeInTheDocument();
    });
  });

  describe('Conditional Offers', () => {
    test('displays Conditional Offers toggle button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Conditional Offers')).toBeInTheDocument();
    });

    test('conditional offers are hidden by default', () => {
      renderVehicleDetail();
      expect(screen.queryByText('Select Market Chevy Loyalty Cash')).not.toBeInTheDocument();
    });

    test('clicking toggle shows conditional offers', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Conditional Offers'));
      
      expect(screen.getByText('Select Market Chevy Loyalty Cash')).toBeInTheDocument();
      expect(screen.getByText('Trade Assistance')).toBeInTheDocument();
      expect(screen.getByText('GM First Responder Offer')).toBeInTheDocument();
      expect(screen.getByText('GM Military Offer')).toBeInTheDocument();
    });

    test('clicking toggle again hides conditional offers', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Conditional Offers'));
      expect(screen.getByText('Select Market Chevy Loyalty Cash')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Conditional Offers'));
      expect(screen.queryByText('Select Market Chevy Loyalty Cash')).not.toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    test('displays Key Features heading', () => {
      renderVehicleDetail();
      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    test('displays vehicle features as tags', () => {
      renderVehicleDetail();
      expect(screen.getByText('Trailering Package')).toBeInTheDocument();
      expect(screen.getByText('Heated Front Seats')).toBeInTheDocument();
      expect(screen.getByText('Apple CarPlay')).toBeInTheDocument();
    });
  });

  describe('Photo Gallery', () => {
    test('displays photo count badge', () => {
      renderVehicleDetail();
      expect(screen.getByText('(4) Photos')).toBeInTheDocument();
    });

    test('displays thumbnail images', () => {
      renderVehicleDetail();
      // Component renders 4 thumbnail placeholders
      const thumbnails = document.querySelectorAll('[style*="width: 100px"]');
      expect(thumbnails.length).toBe(4);
    });
  });

  describe('Navigation', () => {
    test('back button navigates to inventory', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Back to Inventory'));
      expect(mockNavigateTo).toHaveBeenCalledWith('inventory');
    });
  });

  describe('Action Buttons', () => {
    test('renders Let\'s See It! button', () => {
      renderVehicleDetail();
      expect(screen.getByText("Let's See It!")).toBeInTheDocument();
    });

    test('renders hint text below Let\'s See It button', () => {
      renderVehicleDetail();
      expect(screen.getByText(/Tap to have this vehicle brought to the showroom/)).toBeInTheDocument();
    });

    test('renders Calculate Payment button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Calculate Payment')).toBeInTheDocument();
    });

    test('renders Value My Trade button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Value My Trade')).toBeInTheDocument();
    });

    test('Calculate Payment navigates to payment calculator', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Calculate Payment'));
      expect(mockNavigateTo).toHaveBeenCalledWith('paymentCalculator');
    });

    test('Value My Trade navigates to tradeIn', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Value My Trade'));
      expect(mockNavigateTo).toHaveBeenCalledWith('tradeIn');
    });

    test('renders Save to Phone QR Code button', () => {
      renderVehicleDetail();
      expect(screen.getByText(/Save to Phone/)).toBeInTheDocument();
    });

    test('QR Code button opens QR modal', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText(/Save to Phone/));
      
      // QR Modal should appear
      expect(screen.getByText('Save This Vehicle')).toBeInTheDocument();
    });
  });

  describe('Let\'s See It Flow', () => {
    test('clicking Let\'s See It shows confirmation screen', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(screen.getByText("We're On It!")).toBeInTheDocument();
      });
    });

    test('confirmation screen shows success message', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(screen.getByText(/A team member has been notified/)).toBeInTheDocument();
      });
    });

    test('confirmation screen shows vehicle details', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(screen.getByText('2025 Silverado 1500')).toBeInTheDocument();
        expect(screen.getByText('LT Crew Cab 4WD')).toBeInTheDocument();
        expect(screen.getByText(/Stock#\s*24789/)).toBeInTheDocument();
      });
    });

    test('confirmation screen shows expected steps', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(screen.getByText('What to Expect:')).toBeInTheDocument();
        expect(screen.getByText(/A sales consultant will locate the vehicle/)).toBeInTheDocument();
        expect(screen.getByText(/bring it to the front entrance/)).toBeInTheDocument();
        expect(screen.getByText(/see it up close and ask questions/)).toBeInTheDocument();
      });
    });

    test('confirmation screen shows estimated wait time', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(screen.getByText(/Estimated wait: 3-5 minutes/)).toBeInTheDocument();
      });
    });

    test('updateCustomerData is called when vehicle is requested', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(mockUpdateCustomerData).toHaveBeenCalledWith(
          expect.objectContaining({
            vehicleRequested: expect.objectContaining({
              stockNumber: '24789',
            }),
          })
        );
      });
    });

    test('logTrafficSession is called when vehicle is requested', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(logTrafficSession).toHaveBeenCalledWith(
          expect.objectContaining({
            currentStep: 'vehicleRequest',
            vehicleRequested: true,
          })
        );
      });
    });

    test('Browse More Vehicles navigates to inventory from confirmation', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(screen.getByText('Browse More Vehicles')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Browse More Vehicles'));
      expect(mockNavigateTo).toHaveBeenCalledWith('inventory');
    });

    test('Chat with AI Assistant navigates to aiAssistant from confirmation', async () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      await waitFor(() => {
        expect(screen.getByText('Chat with AI Assistant')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Chat with AI Assistant'));
      expect(mockNavigateTo).toHaveBeenCalledWith('aiAssistant');
    });
  });

  describe('Loading State', () => {
    test('shows loading text while sending request', async () => {
      // Make logTrafficSession take some time
      logTrafficSession.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText("Let's See It!"));
      
      // Should show loading state
      expect(screen.getByText('Notifying Team...')).toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText("We're On It!")).toBeInTheDocument();
      });
    });
  });
});

describe('VehicleDetail Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles vehicle with no rebates - uses default rebates', () => {
    const vehicleNoRebates = {
      ...defaultVehicle,
      rebates: undefined,
    };

    render(
      <VehicleDetail
        navigateTo={mockNavigateTo}
        updateCustomerData={mockUpdateCustomerData}
        customerData={{ selectedVehicle: vehicleNoRebates }}
      />
    );

    // Should still show default rebates
    expect(screen.getByText('Customer Cash')).toBeInTheDocument();
    expect(screen.getByText('Bonus Cash')).toBeInTheDocument();
  });

  test('handles vehicle with no features', () => {
    const vehicleNoFeatures = {
      ...defaultVehicle,
      features: [],
    };

    render(
      <VehicleDetail
        navigateTo={mockNavigateTo}
        updateCustomerData={mockUpdateCustomerData}
        customerData={{ selectedVehicle: vehicleNoFeatures }}
      />
    );

    // Key Features section should not render when no features
    expect(screen.queryByText('Trailering Package')).not.toBeInTheDocument();
  });

  test('handles different vehicle model', () => {
    const tahoeVehicle = {
      ...defaultVehicle,
      model: 'Tahoe',
      trim: 'Z71 4WD',
    };

    render(
      <VehicleDetail
        navigateTo={mockNavigateTo}
        updateCustomerData={mockUpdateCustomerData}
        customerData={{ selectedVehicle: tahoeVehicle }}
      />
    );

    expect(screen.getByText(/NEW 2025 Chevrolet Tahoe Z71 4WD/)).toBeInTheDocument();
  });

  test('handles In Transit status', () => {
    const transitVehicle = {
      ...defaultVehicle,
      status: 'In Transit',
    };

    render(
      <VehicleDetail
        navigateTo={mockNavigateTo}
        updateCustomerData={mockUpdateCustomerData}
        customerData={{ selectedVehicle: transitVehicle }}
      />
    );

    expect(screen.getByText('In Transit')).toBeInTheDocument();
  });

  test('handles missing exterior color', () => {
    const vehicleNoColor = {
      ...defaultVehicle,
      exteriorColor: undefined,
      exterior_color: undefined,
    };

    render(
      <VehicleDetail
        navigateTo={mockNavigateTo}
        updateCustomerData={mockUpdateCustomerData}
        customerData={{ selectedVehicle: vehicleNoColor }}
      />
    );

    expect(screen.getByText('Exterior')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('VehicleDetail Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('all action buttons are accessible', () => {
    renderVehicleDetail();

    expect(screen.getByText("Let's See It!").tagName).toBe('BUTTON');
    expect(screen.getByText('Calculate Payment').tagName).toBe('BUTTON');
    expect(screen.getByText('Value My Trade').tagName).toBe('BUTTON');
    expect(screen.getByText('Back to Inventory').tagName).toBe('BUTTON');
  });

  test('spec sections have labels', () => {
    renderVehicleDetail();

    expect(screen.getByText('Exterior')).toBeInTheDocument();
    expect(screen.getByText('Interior')).toBeInTheDocument();
    expect(screen.getByText('Engine')).toBeInTheDocument();
    expect(screen.getByText('Drivetrain')).toBeInTheDocument();
  });

  test('confirmation screen buttons are accessible', async () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText("Let's See It!"));

    await waitFor(() => {
      expect(screen.getByText('Browse More Vehicles').tagName).toBe('BUTTON');
      expect(screen.getByText('Chat with AI Assistant').tagName).toBe('BUTTON');
    });
  });

  test('conditional offers toggle is accessible', () => {
    renderVehicleDetail();
    
    // The text is in a span inside a button - check the parent button exists
    const conditionalText = screen.getByText('Conditional Offers');
    expect(conditionalText.closest('button')).toBeInTheDocument();
  });
});

describe('VehicleDetail API Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('still shows confirmation even if API call fails', async () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    logTrafficSession.mockRejectedValue(new Error('Network error'));
    
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText("Let's See It!"));
    
    // Should still show confirmation (graceful degradation)
    await waitFor(() => {
      expect(screen.getByText("We're On It!")).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });
});

describe('VehicleDetail QR Code Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('QR modal displays vehicle information', () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText(/Save to Phone/));
    
    // Should show vehicle details in modal
    expect(screen.getByText('2025 Chevrolet Silverado 1500')).toBeInTheDocument();
    expect(screen.getByText('LT Crew Cab 4WD')).toBeInTheDocument();
  });

  test('QR modal shows scan instructions', () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText(/Save to Phone/));
    
    expect(screen.getByText('Open camera on your phone')).toBeInTheDocument();
    expect(screen.getByText('Point at QR code')).toBeInTheDocument();
  });

  test('QR modal shows Copy Link button', () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText(/Save to Phone/));
    
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
  });

  test('QR modal shows Print QR Card button', () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText(/Save to Phone/));
    
    expect(screen.getByText('Print QR Card')).toBeInTheDocument();
  });

  test('QR modal can be closed', () => {
    renderVehicleDetail();
    
    // Open modal
    fireEvent.click(screen.getByText(/Save to Phone/));
    expect(screen.getByText('Save This Vehicle')).toBeInTheDocument();
    
    // Find and click close button (first button in modal)
    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => 
      btn.querySelector('svg path[d="M18 6L6 18M6 6l12 12"]')
    );
    
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(screen.queryByText('Save This Vehicle')).not.toBeInTheDocument();
    }
  });

  test('QR modal displays stock number', () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText(/Save to Phone/));
    
    expect(screen.getByText(/Stock #24789/)).toBeInTheDocument();
  });

  test('renders Virtual Experience button', () => {
    renderVehicleDetail();
    expect(screen.getByText(/Virtual Experience/)).toBeInTheDocument();
  });

  test('Virtual Experience button navigates to virtualTestDrive', () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText(/Virtual Experience/));
    
    expect(mockNavigateTo).toHaveBeenCalledWith('virtualTestDrive');
  });
});
