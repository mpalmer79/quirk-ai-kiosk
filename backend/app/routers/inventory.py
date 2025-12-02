def get_image_url(model: str, year: int = 2024) -> str:
    """Get official Chevrolet stock image URL based on model"""
    model_lower = model.lower()
    
    # Chevrolet media/press images (publicly accessible)
    image_map = {
        'corvette': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/03/2024-Chevrolet-Corvette-Red.png',
        'silverado 1500': 'https://di-uploads-pod14.dealerinspire.com/vindeaborlando/uploads/2023/06/2024-Chevrolet-Silverado-1500-Gray.png',
        'silverado 2500': 'https://di-uploads-pod3.dealerinspire.com/chevyofspartanburg/uploads/2024/01/2024-Silverado-2500HD.png',
        'silverado 3500': 'https://di-uploads-pod3.dealerinspire.com/chevyofspartanburg/uploads/2024/01/2024-Silverado-2500HD.png',
        'tahoe': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/06/2024-Chevrolet-Tahoe-Black.png',
        'suburban': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/06/2024-Chevrolet-Suburban-White.png',
        'traverse': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/08/2024-Chevrolet-Traverse-Silver.png',
        'equinox': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/02/2024-Chevrolet-Equinox-Blue.png',
        'colorado': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/02/2024-Chevrolet-Colorado-Blue.png',
        'trailblazer': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/06/2024-Chevrolet-Trailblazer-Red.png',
        'trax': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/06/2024-Chevrolet-Trax-Blue.png',
        'blazer': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/03/2024-Chevrolet-Blazer-Black.png',
        'malibu': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/06/2024-Chevrolet-Malibu-Silver.png',
        'camaro': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2022/04/2024-Chevrolet-Camaro-Yellow.png',
        'bolt': 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/06/2024-Chevrolet-Bolt-EUV-Gray.png',
    }
    
    # Match model to image
    for key, url in image_map.items():
        if key in model_lower:
            return url
    
    # Default fallback
    return 'https://di-uploads-pod14.dealerinspire.com/chevaborlando/uploads/2023/06/2024-Chevrolet-Tahoe-Black.png'
