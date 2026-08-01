# cloudinary_config.py
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def upload_image(file, folder="swam/products"):
    """
    Upload une image vers Cloudinary
    """
    try:
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            allowed_formats=["jpg", "jpeg", "png", "gif", "webp"],
            transformation=[
                {"width": 800, "height": 800, "crop": "limit"},
                {"quality": "auto"}
            ]
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"❌ Erreur upload Cloudinary: {e}")
        return None

def delete_image(public_id):
    """
    Supprime une image de Cloudinary
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"❌ Erreur suppression Cloudinary: {e}")
        return False

def get_public_id_from_url(url):
    """
    Extrait le public_id d'une URL Cloudinary
    """
    if not url or "cloudinary" not in url:
        return None
    try:
        # Exemple: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/swam/products/image.jpg
        parts = url.split("/")
        # Récupère la partie après 'upload/'
        upload_index = parts.index("upload") if "upload" in parts else -1
        if upload_index != -1:
            # Prend tout après upload/ jusqu'à l'extension
            public_parts = parts[upload_index + 2:]  # Skip version
            public_id = "/".join(public_parts).split(".")[0]
            return public_id
    except:
        return None
    return None