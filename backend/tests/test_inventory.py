"""
Tests for Inventory Router functions
Tests the actual functions in app/routers/inventory.py
"""
import pytest
from app.routers.inventory import (
    parse_model_code,
    get_image_url,
    get_body_style,
    get_fuel_type,
    get_engine,
    get_transmission,
    parse_drivetrain,
    get_features,
    BODY_CODE_MAP,
    VEHICLE_IMAGES,
)


class TestParseModelCode:
    """Test GM model code parsing"""

    def test_crew_cab_short_bed_4wd(self):
        result = parse_model_code('CK10543')
        assert result['cab'] == 'Crew Cab'
        assert result['bed'] == 'Short Bed'
        assert result['drive'] == '4WD'

    def test_double_cab_standard_bed_2wd(self):
        result = parse_model_code('CC10753')
        assert result['cab'] == 'Double Cab'
        assert result['bed'] == 'Standard Bed'
        assert result['drive'] == '2WD'

    def test_regular_cab_long_bed(self):
        result = parse_model_code('CK20903')
        assert result['cab'] == 'Regular Cab'
        assert result['bed'] == 'Long Bed'
        assert result['drive'] == '4WD'

    def test_empty_string_returns_none(self):
        result = parse_model_code('')
        assert result['cab'] is None
        assert result['bed'] is None
        assert result['drive'] is None

    def test_none_input_returns_none(self):
        result = parse_model_code(None)
        assert result['cab'] is None
        assert result['bed'] is None
        assert result['drive'] is None

    def test_non_gm_model_returns_none(self):
        result = parse_model_code('F-150 XLT')
        assert result['cab'] is None
        assert result['bed'] is None


class TestGetImageUrl:
    """Test vehicle image URL selection"""

    def test_corvette_image(self):
        url = get_image_url('Corvette Stingray')
        assert 'corvette' in url.lower() or url == VEHICLE_IMAGES['corvette']

    def test_silverado_1500_image(self):
        url = get_image_url('Silverado 1500 LT')
        assert url == VEHICLE_IMAGES['silverado']

    def test_silverado_2500hd_image(self):
        url = get_image_url('Silverado 2500HD High Country')
        assert url == VEHICLE_IMAGES['silverado_hd']

    def test_silverado_ev_image(self):
        url = get_image_url('Silverado EV RST')
        assert url == VEHICLE_IMAGES['silverado_ev']

    def test_tahoe_image(self):
        url = get_image_url('Tahoe Z71')
        assert url == VEHICLE_IMAGES['tahoe']

    def test_equinox_image(self):
        url = get_image_url('Equinox RS')
        assert url == VEHICLE_IMAGES['equinox']

    def test_equinox_ev_image(self):
        url = get_image_url('Equinox EV')
        assert url == VEHICLE_IMAGES['equinox_ev']

    def test_unknown_model_returns_default(self):
        url = get_image_url('Unknown Model XYZ')
        assert url == VEHICLE_IMAGES['default']


class TestGetBodyStyle:
    """Test body style classification"""

    def test_silverado_is_truck(self):
        result = get_body_style('PKUP', 'Silverado 1500', None)
        assert result == 'Truck'

    def test_colorado_is_truck(self):
        result = get_body_style('', 'Colorado ZR2', None)
        assert result == 'Truck'

    def test_tahoe_is_suv(self):
        result = get_body_style('', 'Tahoe', None)
        assert result == 'SUV'

    def test_corvette_is_coupe(self):
        result = get_body_style('COUPE', 'Corvette Stingray', None)
        assert result == 'Coupe'

    def test_malibu_is_sedan(self):
        result = get_body_style('', 'Malibu LT', None)
        assert result == 'Sedan'

    def test_express_is_van(self):
        result = get_body_style('', 'Express', None)
        assert result == 'Van'


class TestGetFuelType:
    """Test fuel type detection"""

    def test_ev_model(self):
        assert get_fuel_type('Silverado EV') == 'Electric'
        assert get_fuel_type('Equinox EV') == 'Electric'
        assert get_fuel_type('Bolt EV') == 'Electric'

    def test_eray_is_hybrid(self):
        assert get_fuel_type('Corvette E-Ray') == 'Hybrid'

    def test_regular_model_is_gasoline(self):
        assert get_fuel_type('Silverado 1500') == 'Gasoline'
        assert get_fuel_type('Tahoe') == 'Gasoline'


class TestGetEngine:
    """Test engine derivation"""

    def test_ev_engine(self):
        assert get_engine(0, 'Silverado EV') == 'Electric Motor'

    def test_corvette_engine(self):
        assert get_engine(8, 'Corvette Stingray') == '6.2L V8'

    def test_corvette_eray_engine(self):
        assert get_engine(8, 'Corvette E-Ray') == '6.2L V8 + Electric Motor'

    def test_v8_hd_truck(self):
        assert get_engine(8, 'Silverado 2500HD') == '6.6L V8'

    def test_v6_engine(self):
        assert get_engine(6, 'Traverse') == '3.6L V6'

    def test_turbo_four(self):
        assert get_engine(4, 'Equinox') == '2.0L Turbo I4'


class TestGetTransmission:
    """Test transmission derivation"""

    def test_ev_transmission(self):
        assert get_transmission('Silverado EV') == 'Single-Speed Direct Drive'

    def test_corvette_transmission(self):
        assert get_transmission('Corvette') == '8-Speed Dual Clutch'

    def test_truck_transmission(self):
        assert get_transmission('Silverado 1500') == '10-Speed Automatic'

    def test_default_transmission(self):
        assert get_transmission('Equinox') == '9-Speed Automatic'


class TestParseDrivetrain:
    """Test drivetrain parsing"""

    def test_ck_model_is_4wd(self):
        assert parse_drivetrain('', 'CK10543') == '4WD'

    def test_corvette_is_rwd(self):
        assert parse_drivetrain('', 'Corvette Stingray') == 'RWD'

    def test_corvette_eray_is_awd(self):
        assert parse_drivetrain('', 'Corvette E-Ray') == 'AWD'

    def test_4wd_in_body(self):
        assert parse_drivetrain('4WD CREW', '') == '4WD'

    def test_awd_in_body(self):
        assert parse_drivetrain('AWD SUV', '') == 'AWD'

    def test_default_is_fwd(self):
        assert parse_drivetrain('', 'Equinox') == 'FWD'


class TestGetFeatures:
    """Test feature generation"""

    def test_base_features_always_present(self):
        features = get_features('LS', 'Silverado')
        assert 'Apple CarPlay' in features
        assert 'Android Auto' in features
        assert 'Backup Camera' in features

    def test_lt_trim_adds_features(self):
        features = get_features('LT', 'Equinox')
        assert 'Heated Seats' in features
        assert 'Remote Start' in features

    def test_z71_trim_adds_offroad(self):
        features = get_features('Z71', 'Tahoe')
        assert 'Z71 Off-Road Package' in features

    def test_high_country_adds_premium(self):
        features = get_features('High Country', 'Silverado')
        assert 'Leather Seats' in features
        assert 'Bose Audio' in features

    def test_ev_adds_ev_features(self):
        features = get_features('RST', 'Silverado EV')
        assert 'One-Pedal Driving' in features
        assert 'DC Fast Charging' in features


class TestBodyCodeMap:
    """Test body code mapping completeness"""

    def test_all_codes_have_cab_and_bed(self):
        for code, config in BODY_CODE_MAP.items():
            assert 'cab' in config
            assert 'bed' in config

    def test_valid_cab_types(self):
        valid_cabs = {'Regular Cab', 'Double Cab', 'Crew Cab'}
        for code, config in BODY_CODE_MAP.items():
            assert config['cab'] in valid_cabs

    def test_valid_bed_types(self):
        valid_beds = {'Short Bed', 'Standard Bed', 'Long Bed'}
        for code, config in BODY_CODE_MAP.items():
            assert config['bed'] in valid_beds


class TestVehicleImages:
    """Test vehicle images mapping"""

    def test_all_urls_are_https(self):
        for model, url in VEHICLE_IMAGES.items():
            assert url.startswith('https://'), f"{model} URL not HTTPS"

    def test_default_image_exists(self):
        assert 'default' in VEHICLE_IMAGES

    def test_key_models_have_images(self):
        required = ['corvette', 'silverado', 'tahoe', 'equinox', 'colorado']
        for model in required:
            assert model in VEHICLE_IMAGES
