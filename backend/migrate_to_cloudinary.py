#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de migration des images vers Cloudinary
Exécuter: python migrate_to_cloudinary.py
"""

import sys
import os
import requests
from io import BytesIO
import time
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Importer l'application et les modèles
from app import app, db, Produit
import cloudinary
import cloudinary.uploader

# Configuration Cloudinary
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET]):
    print("❌ Erreur: Cloudinary non configuré")
    print("Vérifiez vos variables d'environnement")
    sys.exit(1)

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

print("✅ Cloudinary configuré")

def upload_image_to_cloudinary(file_data, filename, folder="swam/products"):
    """
    Upload une image vers Cloudinary
    """
    try:
        result = cloudinary.uploader.upload(
            file_data,
            folder=folder,
            public_id=f"product_{filename.split('.')[0]}",
            allowed_formats=["jpg", "jpeg", "png", "gif", "webp"],
            transformation=[
                {"width": 800, "height": 800, "crop": "limit"},
                {"quality": "auto"}
            ]
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"❌ Erreur upload: {e}")
        return None

def migrate_images():
    """
    Migre toutes les images des produits vers Cloudinary
    """
    print("\n🚀 ===== DÉBUT DE LA MIGRATION =====\n")
    
    with app.app_context():
        # Récupérer tous les produits avec des images locales
        produits = Produit.query.filter(
            Produit.image_url.like('%swamapp-production.up.railway.app/uploads%')
        ).all()
        
        print(f"📸 {len(produits)} images à migrer")
        
        if len(produits) == 0:
            print("✅ Aucune image à migrer")
            return
        
        success_count = 0
        error_count = 0
        
        for i, produit in enumerate(produits, 1):
            print(f"\n[{i}/{len(produits)}] 📦 {produit.nom}")
            print(f"   🔗 URL actuelle: {produit.image_url}")
            
            try:
                # Télécharger l'image depuis l'URL locale
                print(f"   📥 Téléchargement...")
                response = requests.get(produit.image_url, timeout=30)
                
                if response.status_code != 200:
                    print(f"   ❌ Échec téléchargement: HTTP {response.status_code}")
                    error_count += 1
                    continue
                
                # Créer un fichier BytesIO
                image_data = BytesIO(response.content)
                image_data.seek(0)
                
                # Extraire l'extension
                ext = produit.image_url.split('.')[-1].split('?')[0]
                if ext not in ['jpg', 'jpeg', 'png', 'gif', 'webp']:
                    ext = 'jpg'
                
                filename = f"{produit.id}.{ext}"
                image_data.filename = filename
                
                print(f"   ☁️ Upload vers Cloudinary...")
                url = upload_image_to_cloudinary(
                    image_data, 
                    filename, 
                    folder="swam/products"
                )
                
                if url:
                    produit.image_url = url
                    db.session.commit()
                    success_count += 1
                    print(f"   ✅ Migré vers: {url[:60]}...")
                else:
                    print(f"   ❌ Échec upload Cloudinary")
                    error_count += 1
                
                # Pause pour éviter de dépasser les limites de l'API
                time.sleep(0.5)
                
            except requests.exceptions.Timeout:
                print(f"   ❌ Timeout - Image inaccessible")
                error_count += 1
            except Exception as e:
                print(f"   ❌ Erreur: {str(e)}")
                error_count += 1
        
        print(f"\n📊 ===== RÉSULTATS =====\n")
        print(f"✅ Succès: {success_count}")
        print(f"❌ Échecs: {error_count}")
        print(f"📦 Total: {len(produits)}")
        
        print(f"\n🎉 Migration terminée!")

def check_migration_status():
    """
    Vérifie le statut de la migration
    """
    with app.app_context():
        total = Produit.query.count()
        local = Produit.query.filter(
            Produit.image_url.like('%swamapp-production.up.railway.app/uploads%')
        ).count()
        cloudinary = total - local
        
        print(f"\n📊 ===== STATUT DES IMAGES =====\n")
        print(f"📦 Total produits: {total}")
        print(f"☁️ Images sur Cloudinary: {cloudinary}")
        print(f"🏠 Images locales: {local}")
        
        if local > 0:
            print(f"\n⚠️ {local} images encore en local")
            print("Exécutez 'python migrate_to_cloudinary.py' pour les migrer")
        else:
            print(f"\n✅ Toutes les images sont sur Cloudinary!")

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🔄 MIGRATION DES IMAGES VERS CLOUDINARY")
    print("="*50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        check_migration_status()
    else:
        print("\n⚠️  Attention: Cette opération va migrer toutes vos images vers Cloudinary")
        print("Les images existantes sur Railway seront conservées mais les URLs seront mises à jour")
        
        response = input("\nContinuer ? (o/N): ")
        if response.lower() == 'o':
            migrate_images()
        else:
            print("❌ Migration annulée")