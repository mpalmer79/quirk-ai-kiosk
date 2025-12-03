"""
Tests for Inventory Parsing
Tests the GM model code decoder, image URL generation, and inventory filtering
"""
import pytest
from app.routers.inventory import (
    parse_model_code,
    get_image_url,
    get_body_style,
    BODY_CODE_MAP,
    VEHICLE_IMAGES,
)


class TestGMModelCodeParser:
    """Test suite for GM model code parsing (cab styles, bed lengths)"""
    
    def test_parse_crew_cab_short_bed(self):
        """CK10543 = 4WD Crew Cab Short Bed"""
        result = parse_model_code('CK10543')
        assert result['cab'] == 'Crew Cab'
        assert result['bed'] == 'Short Bed'
        assert result['drive'] == '4WD'
    
    def test_parse_double_cab_standard_bed(self):
        """CC10753 = 2WD Double Cab Standard Bed"""
        result = parse_model_code('CC10753')
        assert result['cab'] == 'Double Cab'
        assert result['bed'] == 'Standard Bed'
        assert result['drive'] == '2WD'
    
    def test_parse_regular_cab_long_bed(self):
        """CK20903 = 4WD Regular Cab Long Bed"""
        result = parse_model_code('CK20903')
        assert result['cab'] == 'Regular Cab'
        assert result['bed'] == 'Long Bed'
        assert result['drive'] == '4WD'
    
    def test_parse_crew_cab_standard_bed(self):
        """CK10743 = 4WD Crew Cab Standard Bed"""
        result = parse_model_code('CK10743')
        assert result['cab'] == 'Crew Cab'
        assert result['bed'] == 'Standard Bed'
        assert result['drive'] == '4WD'
    
    def test_parse_crew_cab_long_bed(self):
        """CC30943 = 2WD Crew Cab Long Bed (3500 series)"""
        result = parse_model_code('CC30943')
        assert result['cab'] == 'Crew Cab'
        assert result['bed'] == 'Long Bed'
        assert result['drive'] == '2WD'
    
    def test_parse_regular_cab_standard_bed(self):
        """CK10703 = 4WD Regular Cab Standard Bed"""
        result = parse_model_code('CK10703')
        assert result['cab'] == 'Regular Cab'
        assert result['bed'] == 'Standard Bed'
        assert result['drive'] == '4WD'
    
    def test_parse_lowercase_model_code(self):
        """Parser should handle lowercase input"""
        result = parse_model_code('ck10543')
        assert result['cab'] == 'Crew Cab'
        assert result['bed'] == 'Short Bed'
        assert result['drive'] == '4WD'
    
    def test_parse_empty_string(self):
        """Empty string returns None values"""
        result = parse_model_code('')
        assert result['cab'] is None
        assert result['bed'] is None
        assert result['drive'] is None
    
    def test_parse_none_input(self):
        """None input returns None values"""
        result = parse_model_code(None)
        assert result['cab'] is None
        assert result['bed'] is None
        assert result['drive'] is None
    
    def test_parse_non_gm_model(self):
        """Non-GM model code returns None values"""
        result = parse_model_code('F-150 XLT')
        assert result['cab'] is None
        assert result['bed'] is None
        assert result['drive'] is None
    
    def test_parse_model_with_trim(self):
        """Model code with trim suffix should still parse"""
        result = parse_model_code('CK10543 LT')
        assert result['cab'] == 'Crew Cab'
        assert result['bed'] == 'Short Bed'


class TestImageURLGeneration:
    """Test suite for vehicle image URL selection"""
    
    def test_corvette_image(self):
        """Corvette returns correct Wikimedia URL"""
        url = get_image_url('Corvette Stingray')
        assert 'Corvette' in url
        assert url == VEHICLE_IMAGES['corvette']
    
    def test_silverado_1500_image(self):
        """Silverado 1500 returns standard Silverado image"""
        url = get_image_url('Silverado 1500 LT')
        assert url == VEHICLE_IMAGES['silverado']
    
    def test_silverado_2500_hd_image(self):
        """Silverado 2500HD returns HD-specific image"""
        url = get_image_url('Silverado 2500HD High Country')
        assert url == VEHICLE_IMAGES['silverado_hd']
    
    def test_silverado_3500_image(self):
        """Silverado 3500 returns HD image"""
        url = get_image_url('Silverado 3500')
        assert url == VEHICLE_IMAGES['silverado_hd']
    
    def test_silverado_ev_image(self):
        """Silverado EV returns EV-specific image"""
        url = get_image_url('Silverado EV RST')
        assert url == VEHICLE_IMAGES['silverado_ev']
    
    def test_tahoe_image(self):
        """Tahoe returns correct image"""
        url = get_image_url('Tahoe Z71')
        assert url == VEHICLE_IMAGES['tahoe']
    
    def test_equinox_image(self):
        """Equinox returns correct image"""
        url = get_image_url('Equinox RS')
        assert url == VEHICLE_IMAGES['equinox']
    
    def test_equinox_ev_image(self):
        """Equinox EV returns EV-specific image"""
        url = get_image_url('Equinox EV')
        assert url == VEHICLE_IMAGES['equinox_ev']
    
    def test_unknown_model_returns_default(self):
        """Unknown model returns default image"""
        url = get_image_url('Unknown Model XYZ')
        assert url == VEHICLE_IMAGES['default']
    
    def test_case_insensitive(self):
        """Image lookup is case-insensitive"""
        url_lower = get_image_url('corvette')
        url_upper = get_image_url('CORVETTE')
        url_mixed = get_image_url('CoRvEtTe')
        assert url_lower == url_upper == url_mixed


class TestBodyStyleClassification:
    """Test suite for body style classification"""
    
    def test_truck_cab_style_classification(self):
        """Truck with cab style returns Truck"""
        result = get_body_style('PKUP', 'Silverado 1500', 'Crew Cab')
        assert result == 'Truck'
    
    def test_suv_classification(self):
        """SUV body type classification"""
        result = get_body_style('APURP', 'Tahoe', None)
        assert result == 'SUV'
    
    def test_sedan_by_model_name(self):
        """Malibu classified as Sedan"""
        result = get_body_style('', 'Malibu LT', None)
        assert result == 'Sedan'
    
    def test_corvette_classification(self):
        """Corvette classified as Sports Car"""
        result = get_body_style('COUPE', 'Corvette Stingray', None)
        assert result == 'Sports Car'
    
    def test_camaro_classification(self):
        """Camaro classified as Sports Car"""
        result = get_body_style('COUPE', 'Camaro SS', None)
        assert result == 'Sports Car'
    
    def test_suburban_classification(self):
        """Suburban classified as SUV"""
        result = get_body_style('', 'Suburban', None)
        assert result == 'SUV'
    
    def test_colorado_classification(self):
        """Colorado classified as Truck"""
        result = get_body_style('PKUP', 'Colorado ZR2', None)
        assert result == 'Truck'


class TestBodyCodeMapping:
    """Test body code mapping completeness"""
    
    def test_all_body_codes_have_cab_and_bed(self):
        """All body codes should have both cab and bed values"""
        for code, config in BODY_CODE_MAP.items():
            assert 'cab' in config, f"Body code {code} missing cab"
            assert 'bed' in config, f"Body code {code} missing bed"
    
    def test_cab_values_are_valid(self):
        """Cab values should be known types"""
        valid_cabs = {'Regular Cab', 'Double Cab', 'Crew Cab'}
        for code, config in BODY_CODE_MAP.items():
            assert config['cab'] in valid_cabs, f"Invalid cab type for {code}"
    
    def test_bed_values_are_valid(self):
        """Bed values should be known types"""
        valid_beds = {'Short Bed', 'Standard Bed', 'Long Bed'}
        for code, config in BODY_CODE_MAP.items():
            assert config['bed'] in valid_beds, f"Invalid bed type for {code}"


class TestVehicleImagesMapping:
    """Test vehicle images mapping completeness"""
    
    def test_all_images_are_valid_urls(self):
        """All image URLs should be valid HTTPS URLs"""
        for model, url in VEHICLE_IMAGES.items():
            assert url.startswith('https://'), f"Invalid URL for {model}"
    
    def test_all_images_are_wikimedia(self):
        """All images should be from Wikimedia Commons"""
        for model, url in VEHICLE_IMAGES.items():
            assert 'wikimedia.org' in url, f"Non-Wikimedia URL for {model}"
    
    def test_default_image_exists(self):
        """Default fallback image must exist"""
        assert 'default' in VEHICLE_IMAGES
        assert VEHICLE_IMAGES['default'].startswith('https://')
