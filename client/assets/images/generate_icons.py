from PIL import Image, ImageDraw, ImageFont
import os

def create_dollar_icon(size, filename):
    """Create a dollar icon with the specified size"""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    center = size // 2
    radius = int(size * 0.4)
    border_width = max(1, size // 64)
    
    # Draw background circle with green color
    left = center - radius
    top = center - radius
    right = center + radius
    bottom = center + radius
    
    # Draw filled circle (background)
    draw.ellipse([left, top, right, bottom], fill=(46, 139, 87, 255))  # Sea green
    
    # Draw border
    draw.ellipse([left, top, right, bottom], outline=(34, 139, 34, 255), width=border_width)  # Forest green
    
    # Draw dollar sign
    try:
        # Try to use a system font
        font_size = int(size * 0.6)
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Draw dollar sign
    text = "$"
    
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = center - text_width // 2
    text_y = center - text_height // 2
    
    # Draw text with white color
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    # Save the image
    img.save(filename, "PNG")
    print(f"✅ Created {filename} ({size}x{size})")

def main():
    """Generate all required icons"""
    try:
        # Get current directory (should be assets/images)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Create icons with different sizes
        icons = [
            (512, 'icon.png'),           # Main app icon
            (108, 'adaptive-icon.png'),  # Android adaptive icon
            (32, 'favicon.png'),         # Web favicon
            (200, 'splash-icon.png'),    # Splash screen icon
        ]
        
        for size, filename in icons:
            filepath = os.path.join(current_dir, filename)
            create_dollar_icon(size, filepath)
        
        print("🎉 All dollar icons created successfully!")
        print("📱 Restart your Expo development server to see the new icons.")
        
    except ImportError:
        print("❌ PIL (Pillow) is not installed.")
        print("💡 Install it with: pip install Pillow")
        print("")
        print("🔧 Alternative methods:")
        print("   1. Open generate-dollar-icon.html in your browser")
        print("   2. Right-click on each icon and 'Save image as' PNG")
        print("   3. Replace the existing icon files")
    except Exception as e:
        print(f"❌ Error creating icons: {e}")

if __name__ == "__main__":
    main()
