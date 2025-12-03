import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VehicleDetail from '../components/Vehicledetail';

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
  transmission: '10-Speed Automatic',
  drivetrain: '4WD',
  fuelEconomy: '16 city / 22 hwy',
  msrp: 52995,
  salePrice: 47495,
  savings: 5500,
  monthlyLease: 398,
  monthlyFinance: 612,
  status: 'In Stock',
  mileage: 12,
  gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
  features: [
    'Trailering Package',
    'Heated Front Seats',
    'Apple CarPlay & Android Auto',
  ],
  rebates: [
    { name: 'Customer Cash', amount: 2500 },
    { name: 'Bonus Cash', amount: 1500 },
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
    test('renders vehicle title with year, make, and model', () => {
      renderVehicleDetail();
      expect(screen.getByText('2025 Chevrolet Silverado 1500')).toBeInTheDocument();
    });

    test('renders vehicle trim', () => {
      renderVehicleDetail();
      expect(screen.getByText('LT Crew Cab 4WD')).toBeInTheDocument();
    });

    test('renders stock number', () => {
      renderVehicleDetail();
      expect(screen.getByText('24789')).toBeInTheDocument();
    });

    test('renders back button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Back to Results')).toBeInTheDocument();
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

  describe('Vehicle Specifications', () => {
    test('displays engine information', () => {
      renderVehicleDetail();
      expect(screen.getByText('Engine')).toBeInTheDocument();
      expect(screen.getByText('5.3L EcoTec3 V8')).toBeInTheDocument();
    });

    test('displays transmission information', () => {
      renderVehicleDetail();
      expect(screen.getByText('Transmission')).toBeInTheDocument();
      expect(screen.getByText('10-Speed Automatic')).toBeInTheDocument();
    });

    test('displays drivetrain information', () => {
      renderVehicleDetail();
      expect(screen.getByText('Drivetrain')).toBeInTheDocument();
      expect(screen.getByText('4WD')).toBeInTheDocument();
    });

    test('displays fuel economy information', () => {
      renderVehicleDetail();
      expect(screen.getByText('Fuel Economy')).toBeInTheDocument();
      expect(screen.getByText('16 city / 22 hwy')).toBeInTheDocument();
    });
  });

  describe('Color Information', () => {
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
  });

  describe('Pricing Information', () => {
    test('displays MSRP', () => {
      renderVehicleDetail();
      expect(screen.getByText('MSRP')).toBeInTheDocument();
      expect(screen.getByText('$52,995')).toBeInTheDocument();
    });

    test('displays sale price', () => {
      renderVehicleDetail();
      expect(screen.getByText('Your Price')).toBeInTheDocument();
      expect(screen.getByText('$47,495')).toBeInTheDocument();
    });

    test('displays savings badge', () => {
      renderVehicleDetail();
      expect(screen.getByText(/You Save \$5,500/)).toBeInTheDocument();
    });

    test('displays rebates', () => {
      renderVehicleDetail();
      expect(screen.getByText('Customer Cash')).toBeInTheDocument();
      expect(screen.getByText('-$2,500')).toBeInTheDocument();
      expect(screen.getByText('Bonus Cash')).toBeInTheDocument();
      expect(screen.getByText('-$1,500')).toBeInTheDocument();
    });
  });

  describe('Payment Estimates', () => {
    test('displays lease payment estimate', () => {
      renderVehicleDetail();
      expect(screen.getByText('Lease')).toBeInTheDocument();
      expect(screen.getByText('$398')).toBeInTheDocument();
      expect(screen.getByText('/mo for 39 mo')).toBeInTheDocument();
    });

    test('displays finance payment estimate', () => {
      renderVehicleDetail();
      expect(screen.getByText('Finance')).toBeInTheDocument();
      expect(screen.getByText('$612')).toBeInTheDocument();
      expect(screen.getByText('/mo for 72 mo')).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    test('displays Key Features heading', () => {
      renderVehicleDetail();
      expect(screen.getByText('Key Features')).toBeInTheDocument();
    });

    test('displays vehicle features', () => {
      renderVehicleDetail();
      expect(screen.getByText('Trailering Package')).toBeInTheDocument();
      expect(screen.getByText('Heated Front Seats')).toBeInTheDocument();
      expect(screen.getByText('Apple CarPlay & Android Auto')).toBeInTheDocument();
    });
  });

  describe('VIN Display', () => {
    test('displays VIN label and number', () => {
      renderVehicleDetail();
      expect(screen.getByText('VIN:')).toBeInTheDocument();
      expect(screen.getByText('1GCUDDED5RZ123456')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('back button navigates to inventory', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Back to Results'));
      expect(mockNavigateTo).toHaveBeenCalledWith('inventory');
    });
  });

  describe('Action Buttons', () => {
    test('renders Request This Vehicle button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Request This Vehicle')).toBeInTheDocument();
    });

    test('renders Calculate Payment button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Calculate Payment')).toBeInTheDocument();
    });

    test('renders Value My Trade button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Value My Trade')).toBeInTheDocument();
    });

    test('renders Talk to a Sales Consultant button', () => {
      renderVehicleDetail();
      expect(screen.getByText('Talk to a Sales Consultant')).toBeInTheDocument();
    });

    test('Calculate Payment navigates to payment calculator', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Calculate Payment'));
      expect(mockNavigateTo).toHaveBeenCalledWith('paymentCalculator');
    });

    test('Value My Trade navigates to trade-in', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Value My Trade'));
      expect(mockNavigateTo).toHaveBeenCalledWith('tradeIn');
    });

    test('Talk to a Sales Consultant navigates to handoff', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Talk to a Sales Consultant'));
      expect(mockNavigateTo).toHaveBeenCalledWith('handoff');
    });
  });

  describe('Request Vehicle Flow', () => {
    test('Request This Vehicle shows confirmation screen', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      
      expect(screen.getByText('Vehicle Requested!')).toBeInTheDocument();
      expect(screen.getByText(/A team member will bring this vehicle/)).toBeInTheDocument();
    });

    test('confirmation screen shows vehicle details', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      
      expect(screen.getByText('2025 Silverado 1500')).toBeInTheDocument();
      expect(screen.getByText('LT Crew Cab 4WD')).toBeInTheDocument();
      expect(screen.getByText('Stock #24789')).toBeInTheDocument();
    });

    test('confirmation screen shows expected steps', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      
      expect(screen.getByText('What to Expect')).toBeInTheDocument();
      expect(screen.getByText('Vehicle will be brought up front')).toBeInTheDocument();
      expect(screen.getByText('A team member will meet you')).toBeInTheDocument();
      expect(screen.getByText('Take it for a test drive!')).toBeInTheDocument();
    });

    test('confirmation screen shows estimated wait time', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      
      expect(screen.getByText(/Estimated wait: 2-3 minutes/)).toBeInTheDocument();
    });

    test('updateCustomerData is called when vehicle is requested', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      
      expect(mockUpdateCustomerData).toHaveBeenCalledWith(
        expect.objectContaining({
          vehicleRequested: expect.objectContaining({
            stockNumber: '24789',
          }),
        })
      );
    });

    test('Connect with Sales Consultant navigates to handoff from confirmation', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      fireEvent.click(screen.getByText('Connect with Sales Consultant'));
      
      expect(mockNavigateTo).toHaveBeenCalledWith('handoff');
    });

    test('Back to Vehicle Details returns to detail view', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      expect(screen.getByText('Vehicle Requested!')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Back to Vehicle Details'));
      
      expect(screen.getByText('Request This Vehicle')).toBeInTheDocument();
      expect(screen.queryByText('Vehicle Requested!')).not.toBeInTheDocument();
    });

    test('Continue Browsing navigates to inventory from confirmation', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      fireEvent.click(screen.getByText('Continue Browsing'));
      
      expect(mockNavigateTo).toHaveBeenCalledWith('inventory');
    });

    test('shows personalized confirmation when customer name is provided', () => {
      render(
        <VehicleDetail
          navigateTo={mockNavigateTo}
          updateCustomerData={mockUpdateCustomerData}
          customerData={{ 
            selectedVehicle: defaultVehicle,
            customerName: 'John'
          }}
        />
      );
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      
      expect(screen.getByText('Great choice, John!')).toBeInTheDocument();
    });

    test('shows generic confirmation when no customer name', () => {
      renderVehicleDetail();
      
      fireEvent.click(screen.getByText('Request This Vehicle'));
      
      expect(screen.getByText('Vehicle Requested!')).toBeInTheDocument();
    });
  });
});

describe('VehicleDetail Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handles vehicle with no rebates', () => {
    const vehicleNoRebates = {
      ...defaultVehicle,
      rebates: [],
    };

    render(
      <VehicleDetail
        navigateTo={mockNavigateTo}
        updateCustomerData={mockUpdateCustomerData}
        customerData={{ selectedVehicle: vehicleNoRebates }}
      />
    );

    expect(screen.getByText('2025 Chevrolet Silverado 1500')).toBeInTheDocument();
    expect(screen.queryByText('Customer Cash')).not.toBeInTheDocument();
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

    expect(screen.getByText('Key Features')).toBeInTheDocument();
    expect(screen.queryByText('Trailering Package')).not.toBeInTheDocument();
  });

  test('handles different vehicle model', () => {
    const tahoVehicle = {
      ...defaultVehicle,
      model: 'Tahoe',
      trim: 'Z71 4WD',
    };

    render(
      <VehicleDetail
        navigateTo={mockNavigateTo}
        updateCustomerData={mockUpdateCustomerData}
        customerData={{ selectedVehicle: tahoVehicle }}
      />
    );

    expect(screen.getByText('2025 Chevrolet Tahoe')).toBeInTheDocument();
    expect(screen.getByText('Z71 4WD')).toBeInTheDocument();
  });
});

describe('VehicleDetail Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('all action buttons are accessible', () => {
    renderVehicleDetail();

    expect(screen.getByText('Request This Vehicle').tagName).toBe('BUTTON');
    expect(screen.getByText('Calculate Payment').tagName).toBe('BUTTON');
    expect(screen.getByText('Value My Trade').tagName).toBe('BUTTON');
    expect(screen.getByText('Talk to a Sales Consultant').tagName).toBe('BUTTON');
    expect(screen.getByText('Back to Results').tagName).toBe('BUTTON');
  });

  test('spec sections have labels', () => {
    renderVehicleDetail();

    expect(screen.getByText('Engine')).toBeInTheDocument();
    expect(screen.getByText('Transmission')).toBeInTheDocument();
    expect(screen.getByText('Drivetrain')).toBeInTheDocument();
    expect(screen.getByText('Fuel Economy')).toBeInTheDocument();
  });

  test('confirmation screen buttons are accessible', () => {
    renderVehicleDetail();
    
    fireEvent.click(screen.getByText('Request This Vehicle'));

    expect(screen.getByText('Connect with Sales Consultant').tagName).toBe('BUTTON');
    expect(screen.getByText('Back to Vehicle Details').tagName).toBe('BUTTON');
    expect(screen.getByText('Continue Browsing').tagName).toBe('BUTTON');
  });
});
