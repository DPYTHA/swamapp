from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
import re
import json 
import random
import string
import requests
import os  # Ajout manquant
from functools import wraps
from dotenv import load_dotenv

# Initialisation de l'application
app = Flask(__name__)
CORS(app)

# Charger les variables d'environnement
load_dotenv()

# Configuration
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://localhost/swami')
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # À AJOUTER
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
    CLOUDINARY_UPLOAD_PRESET = os.getenv('CLOUDINARY_UPLOAD_PRESET', 'swam_products')

# Utilisation
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = Config.SQLALCHEMY_TRACK_MODIFICATIONS  # À AJOUTER
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Initialisation des extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
# ===================== MODELES =====================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=True)
    telephone = db.Column(db.String(20), unique=True, nullable=False)
    mot_de_passe = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='client')
    date_inscription = db.Column(db.DateTime, default=datetime.utcnow)
   
    
    # Relations
    commandes_client = db.relationship('Commande', 
                                        foreign_keys='Commande.client_id',
                                        back_populates='client', 
                                        lazy=True)
    
    commandes_livreur = db.relationship('Commande', 
                                         foreign_keys='Commande.livreur_id',
                                         back_populates='livreur', 
                                         lazy=True)
    
    paiements_valides = db.relationship('Paiement', 
                                         foreign_keys='Paiement.valide_par', 
                                         back_populates='validateur', 
                                         lazy=True)

class Produit(db.Model):
    __tablename__ = 'produits'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    prix = db.Column(db.Float, nullable=False)
    categorie = db.Column(db.String(50), nullable=False)
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(500), nullable=True)  # URL Cloudinary
    date_ajout = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    details_commandes = db.relationship('CommandeDetail', back_populates='produit', lazy=True)


class NotificationToken(db.Model):
    __tablename__ = 'notification_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(db.String(50))
    platform = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Commande(db.Model):
    __tablename__ = 'commandes'
    
    id = db.Column(db.Integer, primary_key=True)
    code_suivi = db.Column(db.String(10), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    livreur_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Informations de livraison
    adresse_livraison = db.Column(db.Text, nullable=False)
    destination_nom = db.Column(db.String(100), nullable=True)
    destination_telephone = db.Column(db.String(20), nullable=True)
    distance = db.Column(db.Integer, default=0)
    frais_livraison = db.Column(db.Float, default=0)
    
    # Informations de délai
    delivery_option = db.Column(db.String(20), default='asap')
    reduction = db.Column(db.Integer, default=0)
    
    # Montants
    sous_total = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    
    # Statuts
    statut = db.Column(db.String(50), default='en_attente_paiement')
    statut_paiement = db.Column(db.String(20), default='en_attente')
    
    # Dates
    date_commande = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    date_livraison = db.Column(db.DateTime, nullable=True)
    
    # Champs pour la recherche de livreur
    recherche_livreur = db.Column(db.Boolean, default=False)
    date_recherche = db.Column(db.DateTime, nullable=True)
    notifications_envoyees = db.Column(db.Integer, default=0)
    
    # Relations
    client = db.relationship('User', 
                              foreign_keys=[client_id],
                              back_populates='commandes_client')
    
    livreur = db.relationship('User', 
                               foreign_keys=[livreur_id],
                               back_populates='commandes_livreur')
    
    details = db.relationship('CommandeDetail', 
                               back_populates='commande', 
                               lazy=True, 
                               cascade='all, delete-orphan')
    
    paiements = db.relationship('Paiement', 
                                 back_populates='commande', 
                                 lazy=True, 
                                 cascade='all, delete-orphan')

class CommandeDetail(db.Model):
    __tablename__ = 'commande_details'
    
    id = db.Column(db.Integer, primary_key=True)
    commande_id = db.Column(db.Integer, db.ForeignKey('commandes.id'), nullable=False)
    produit_id = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)
    quantite = db.Column(db.Integer, nullable=False)
    prix_unitaire = db.Column(db.Float, nullable=False)
    
    # Relations
    commande = db.relationship('Commande', back_populates='details', lazy=True)
    produit = db.relationship('Produit', back_populates='details_commandes', lazy=True)

class Paiement(db.Model):
    __tablename__ = 'paiements'
    
    id = db.Column(db.Integer, primary_key=True)
    commande_id = db.Column(db.Integer, db.ForeignKey('commandes.id'), nullable=False)
    code_suivi = db.Column(db.String(10), nullable=False)
    montant = db.Column(db.Float, nullable=False)
    methode = db.Column(db.String(50), nullable=False)
    numero_transaction = db.Column(db.String(100), nullable=True)
    statut = db.Column(db.String(20), default='en_attente')
    date_paiement = db.Column(db.DateTime, default=datetime.utcnow)
    date_validation = db.Column(db.DateTime, nullable=True)
    valide_par = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relations
    commande = db.relationship('Commande', back_populates='paiements')
    validateur = db.relationship('User', foreign_keys=[valide_par], back_populates='paiements_valides')





class ResetCode(db.Model):
    __tablename__ = 'reset_codes'
    
    id = db.Column(db.Integer, primary_key=True)
    telephone = db.Column(db.String(20), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ===================== MODELE ADRESSE =====================
class Adresse(db.Model):
    __tablename__ = 'adresses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nom = db.Column(db.String(100), nullable=False)  # Maison, Bureau, etc.
    adresse = db.Column(db.Text, nullable=False)
    telephone = db.Column(db.String(20), nullable=False)
    est_principale = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref=db.backref('adresses', lazy=True, cascade='all, delete-orphan'))

# ===================== MODELE LISTE DE SOUHAITS =====================
class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    produit_id = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref=db.backref('wishlist_items', lazy=True))
    produit = db.relationship('Produit', backref=db.backref('wishlisted_by', lazy=True))

# ===================== MODELE AVIS =====================
class Avis(db.Model):
    __tablename__ = 'avis'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    commande_id = db.Column(db.Integer, db.ForeignKey('commandes.id'), nullable=False)
    produit_id = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)
    note = db.Column(db.Integer, nullable=False)  # 1 à 5
    commentaire = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    user = db.relationship('User', backref=db.backref('avis', lazy=True))
    commande = db.relationship('Commande', backref=db.backref('avis', lazy=True))
    produit = db.relationship('Produit', backref=db.backref('avis', lazy=True))

# ===================== MODELE CODE PROMO =====================
class CodePromo(db.Model):
    __tablename__ = 'codes_promo'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    reduction_type = db.Column(db.String(20), nullable=False)  # 'pourcentage' ou 'montant'
    reduction_value = db.Column(db.Float, nullable=False)
    min_commande = db.Column(db.Float, default=0)
    max_utilisations = db.Column(db.Integer, default=1)
    utilisations_actuelles = db.Column(db.Integer, default=0)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relations
    utilisations = db.relationship('UtilisationCodePromo', backref='code_promo', lazy=True)

class UtilisationCodePromo(db.Model):
    __tablename__ = 'utilisations_codes_promo'
    
    id = db.Column(db.Integer, primary_key=True)
    code_promo_id = db.Column(db.Integer, db.ForeignKey('codes_promo.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    commande_id = db.Column(db.Integer, db.ForeignKey('commandes.id'), nullable=True)
    utilise_le = db.Column(db.DateTime, default=datetime.utcnow)


# ===================== FONCTIONS UTILES =====================
def generer_code_suivi():
    """Génère un code unique de 8 caractères pour le suivi de commande"""
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        if not Commande.query.filter_by(code_suivi=code).first():
            return code


# Fonction pour générer un code à 6 chiffres
def generate_reset_code():
    return ''.join(random.choices(string.digits, k=6))

def validate_telephone(telephone):
    """Valide le format du numéro de téléphone"""
    telephone = re.sub(r'[\s\-]', '', telephone)
    pattern = r'^[0-9]{9,15}$'
    return re.match(pattern, telephone) is not None

def calculer_frais_livraison(distance):
    """Calcule les frais de livraison (100m = 150 FCFA)"""
    return (distance // 100 + (1 if distance % 100 > 0 else 0)) * 150

# ===================== FONCTIONS NOTIFICATIONS =====================


# ===================== ROUTES AUTH =====================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if 'telephone' not in data or 'mot_de_passe' not in data:
        return jsonify({'message': 'Téléphone et mot de passe requis'}), 400
    
    telephone = data['telephone']
    mot_de_passe = data['mot_de_passe']
    
    if not validate_telephone(telephone):
        return jsonify({'message': 'Format de numéro de téléphone invalide'}), 400
    
    if User.query.filter_by(telephone=telephone).first():
        return jsonify({'message': 'Ce numéro est déjà utilisé'}), 400
    
    if len(mot_de_passe) < 4:
        return jsonify({'message': 'Le mot de passe doit contenir au moins 4 caractères'}), 400
    
    hashed_password = bcrypt.generate_password_hash(mot_de_passe).decode('utf-8')
    
    new_user = User(
        nom=data.get('nom', ''),
        telephone=telephone,
        mot_de_passe=hashed_password,
        role='client',
       
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    access_token = create_access_token(identity=str(new_user.id))
    
    return jsonify({
        'message': 'Inscription réussie',
        'token': access_token,
        'user': {
            'id': new_user.id,
            'nom': new_user.nom,
            'telephone': new_user.telephone,
            'role': new_user.role
        }
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if 'telephone' not in data or 'mot_de_passe' not in data:
        return jsonify({'message': 'Téléphone et mot de passe requis'}), 400
    
    telephone = data['telephone']
    mot_de_passe = data['mot_de_passe']
    
    user = User.query.filter_by(telephone=telephone).first()
    
    if not user or not bcrypt.check_password_hash(user.mot_de_passe, mot_de_passe):
        return jsonify({'message': 'Téléphone ou mot de passe incorrect'}), 401
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'token': access_token,
        'user': {
            'id': user.id,
            'nom': user.nom,
            'telephone': user.telephone,
            'role': user.role
        }
    }), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    return jsonify({
        'id': user.id,
        'nom': user.nom,
        'telephone': user.telephone,
        'role': user.role,
        'date_inscription': user.date_inscription.isoformat() if user.date_inscription else None
    })

@app.route('/api/profile/update', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    data = request.get_json()
    
    if 'nom' in data:
        user.nom = data['nom']
    if 'email' in data:
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profil mis à jour avec succès',
        'user': {
            'id': user.id,
            'nom': user.nom,
            'telephone': user.telephone,
            'email': user.email,
            'role': user.role,
            'date_inscription': user.date_inscription.isoformat() if user.date_inscription else None
        }
    })

# ===================== ROUTES PRODUITS (PUBLIQUES) =====================

# GET /api/produits - Liste tous les produits
@app.route('/api/produits', methods=['GET'])
def get_public_produits():
    """Liste tous les produits avec filtres optionnels"""
    try:
        # Paramètres de filtrage
        categorie = request.args.get('categorie')
        search = request.args.get('search')
        limit = request.args.get('limit', type=int)
        
        # Construction de la requête
        query = Produit.query
        
        if categorie and categorie != 'all' and categorie != 'Tous':
            query = query.filter_by(categorie=categorie)
        
        if search:
            query = query.filter(Produit.nom.ilike(f'%{search}%'))
        
        # Tri par date d'ajout (plus récent d'abord)
        query = query.order_by(Produit.date_ajout.desc())
        
        if limit:
            query = query.limit(limit)
        
        produits = query.all()
        
        return jsonify([{
            'id': p.id,
            'nom': p.nom,
            'description': p.description,
            'prix': p.prix,
            'categorie': p.categorie,
            'stock': p.stock,
            'image_url': p.image_url,
            'date_ajout': p.date_ajout.isoformat() if p.date_ajout else None
        } for p in produits]), 200
        
    except Exception as e:
        return jsonify({'message': 'Erreur serveur', 'error': str(e)}), 500


# GET /api/produits/<id> - Détail d'un produit
@app.route('/api/produits/<int:produit_id>', methods=['GET'])
def get_produit1(produit_id):
    """Récupère les détails d'un produit spécifique"""
    try:
        produit = Produit.query.get_or_404(produit_id)
        
        return jsonify({
            'id': produit.id,
            'nom': produit.nom,
            'description': produit.description,
            'prix': produit.prix,
            'categorie': produit.categorie,
            'stock': produit.stock,
            'image_url': produit.image_url,
            'date_ajout': produit.date_ajout.isoformat() if produit.date_ajout else None
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Produit non trouvé'}), 404


# ===================== ROUTES NOTIFICATIONS =====================

@app.route('/api/notifications/register-token', methods=['POST'])
@jwt_required()
def register_token():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    token = data.get('token')
    role = data.get('role')
    platform = data.get('platform')
    
    if not token:
        return jsonify({'message': 'Token requis'}), 400
    
    # Vérifier si le token existe déjà
    existing = NotificationToken.query.filter_by(token=token).first()
    if existing:
        existing.user_id = current_user_id
        existing.role = role
    else:
        new_token = NotificationToken(
            user_id=current_user_id,
            token=token,
            role=role,
            platform=platform
        )
        db.session.add(new_token)
    
    db.session.commit()
    return jsonify({'message': 'Token enregistré'}), 200


# app.py - Fonction utilitaire d'envoi

def send_push_notification(user_id, title, body, data=None, notification_type='default'):
    """
    Envoie une notification push à un utilisateur spécifique.
    """
    # Récupérer tous les tokens de l'utilisateur
    tokens = NotificationToken.query.filter_by(user_id=user_id).all()
    
    if not tokens:
        print(f"Aucun token pour l'utilisateur {user_id}")
        return False
    
    messages = []
    for token in tokens:
        messages.append({
            'to': token.token,
            'sound': 'default',
            'title': title,
            'body': body,
            'data': data or {},
            'priority': 'high',
            'channelId': notification_type,  # Pour Android
        })
    
    try:
        response = requests.post(
            'https://exp.host/--/api/v2/push/send',
            json=messages,
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        )
        
        if response.status_code == 200:
            print(f"Notifications envoyées à {len(messages)} appareil(s)")
            
            # Optionnel : gérer les tokens invalides (ex: DeviceNotRegistered)
            result = response.json()
            if 'data' in result:
                for i, res in enumerate(result['data']):
                    if res.get('status') == 'error' and 'DeviceNotRegistered' in res.get('message', ''):
                        # Supprimer le token invalide
                        NotificationToken.query.filter_by(token=messages[i]['to']).delete()
                        db.session.commit()
            
            return True
        else:
            print(f"Erreur Expo: {response.text}")
            return False
    except Exception as e:
        print(f"Exception lors de l'envoi: {e}")
        return False

# ===================== ROUTES PRODUITS =====================
@app.route('/api/produits', methods=['GET'])
def get_produits():
    categorie = request.args.get('categorie')
    search = request.args.get('search')
    
    query = Produit.query
    
    if categorie and categorie != 'all' and categorie != 'Tous':
        query = query.filter_by(categorie=categorie)
    
    if search:
        query = query.filter(Produit.nom.ilike(f'%{search}%'))
    
    produits = query.all()
    
    return jsonify([{
        'id': p.id,
        'nom': p.nom,
        'description': p.description,
        'prix': p.prix,
        'categorie': p.categorie,
        'stock': p.stock
    } for p in produits])

@app.route('/api/produits/<int:produit_id>', methods=['GET'])
def get_produit(produit_id):
    produit = Produit.query.get_or_404(produit_id)
    
    return jsonify({
        'id': produit.id,
        'nom': produit.nom,
        'description': produit.description,
        'prix': produit.prix,
        'categorie': produit.categorie,
        'stock': produit.stock
    })

# ===================== ROUTES COMMANDES =====================
@app.route('/api/commandes', methods=['POST'])
@jwt_required()
def create_commande():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    # 🔍 LOG DE DÉBOGAGE
    print("\n" + "="*50)
    print("🔍 DONNÉES REÇUES PAR LE BACKEND:")
    print(json.dumps(data, indent=2, default=str))
    print("="*50 + "\n")

    # Vérifier les données requises
    if 'items' not in data or not data['items']:
        return jsonify({'message': 'La commande doit contenir des articles'}), 400
    if 'adresse_livraison' not in data:
        return jsonify({'message': 'Adresse de livraison requise'}), 400
    if 'methode_paiement' not in data:
        return jsonify({'message': 'Méthode de paiement requise'}), 400

    # ✅ Récupérer le client IMMÉDIATEMENT
    client = User.query.get(current_user_id)
    if not client:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    # Génération du code de suivi unique
    code_suivi = generer_code_suivi()

    # Calculer le sous-total des articles
    sous_total = 0
    details_data = []

    for item in data['items']:
        produit = Produit.query.get(item['produit_id'])
        if not produit:
            return jsonify({'message': f'Produit avec ID {item["produit_id"]} non trouvé'}), 400
        
        if 'quantity' not in item:
            return jsonify({
                'message': 'Quantité manquante dans les articles',
                'received_keys': list(item.keys())
            }), 400
            
        quantite = item['quantity']
        
        if produit.stock < quantite:
            return jsonify({'message': f'Stock insuffisant pour {produit.nom}'}), 400

        prix_ligne = produit.prix * quantite
        sous_total += prix_ligne
        details_data.append({
            'produit_id': item['produit_id'],
            'quantite': quantite,
            'prix_unitaire': produit.prix,
            'nom_produit': produit.nom
        })

    # Récupérer les informations de livraison
    frais_livraison = data.get('frais_livraison', 0)
    reduction = data.get('reduction', 0)
    distance = data.get('distance', 0)
    delivery_option = data.get('delivery_option', 'asap')

    # Calculer le total final
    total_final = sous_total + frais_livraison - abs(reduction)

    # Créer l'objet Commande
    new_commande = Commande(
        code_suivi=code_suivi,
        client_id=current_user_id,
        adresse_livraison=data['adresse_livraison'],
        destination_nom=data.get('destination_nom'),
        destination_telephone=data.get('destination_telephone'),
        distance=distance,
        frais_livraison=frais_livraison,
        delivery_option=delivery_option,
        reduction=reduction,
        sous_total=sous_total,
        total=total_final,
        statut='en_attente_paiement'
    )

    db.session.add(new_commande)
    db.session.flush()

    # Ajouter les détails de la commande
    details_commande_log = []
    for det in details_data:
        detail = CommandeDetail(
            commande_id=new_commande.id,
            produit_id=det['produit_id'],
            quantite=det['quantite'],
            prix_unitaire=det['prix_unitaire']
        )
        db.session.add(detail)
        details_commande_log.append({
            'produit': det['nom_produit'],
            'quantite': det['quantite'],
            'prix': det['prix_unitaire']
        })

    # Créer le paiement associé
    nouveau_paiement = Paiement(
        commande_id=new_commande.id,
        code_suivi=code_suivi,
        montant=total_final,
        methode=data['methode_paiement'],
        numero_transaction=data.get('numero_transaction', ''),
        statut='en_attente'
    )
    db.session.add(nouveau_paiement)

    db.session.commit()

    # ✅ NOTIFICATION POUR LES ADMINISTRATEURS (MAINTENANT client EXISTE)
    admins = User.query.filter_by(role='admin').all()
    
    for admin in admins:
        send_push_notification(
            user_id=admin.id,
            title="🛍️ Nouvelle commande !",
            body=f"Commande {code_suivi} de {client.nom or 'Client'} - {total_final} FCFA",
            data={
                'type': 'new_order',
                'orderId': new_commande.id,
                'code': code_suivi,
                'client': client.nom or client.telephone,
                'total': total_final
            },
            notification_type='new-orders'
        )
        print(f"✅ Notification envoyée à l'admin {admin.nom or admin.telephone}")

    print("\n" + "="*60)
    print("🛍️  NOUVELLE COMMANDE - EN ATTENTE DE PAIEMENT")
    print("="*60)
    print(f"📋 Code de suivi : {code_suivi}")
    print(f"👤 Client : {client.nom or 'Client'} - {client.telephone}")
    print(f"📅 Date : {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}")
    print(f"📍 Adresse : {data['adresse_livraison']}")
    print(f"🚚 Distance : {distance} m - Frais: {frais_livraison} FCFA")
    print(f"🏷️ Réduction : {reduction} FCFA")
    print(f"💳 Paiement : {data['methode_paiement']} - En attente")
    print("-"*60)
    print("Articles commandés :")
    for article in details_commande_log:
        print(f"  • {article['produit']} x{article['quantite']} - {article['prix']} FCFA")
    print("-"*60)
    print(f"💰 SOUS-TOTAL : {sous_total} FCFA")
    print(f"💰 TOTAL : {total_final} FCFA")
    print("="*60 + "\n")

    return jsonify({
        'message': 'Commande créée avec succès, en attente de paiement',
        'code_suivi': code_suivi,
        'commande_id': new_commande.id,
        'total': total_final,
        'paiement_id': nouveau_paiement.id
    }), 201
@app.route('/api/commandes/client', methods=['GET'])
@jwt_required()
def get_mes_commandes():
    current_user_id = get_jwt_identity()
    commandes = Commande.query.filter_by(client_id=current_user_id).order_by(Commande.date_commande.desc()).all()
    
    result = []
    for c in commandes:
        paiement = Paiement.query.filter_by(commande_id=c.id).first()
        result.append({
            'id': c.id,
            'code_suivi': c.code_suivi,
            'date': c.date_commande.strftime('%d/%m/%Y %H:%M'),
            'total': c.total,
            'statut': c.statut,
            'statut_paiement': paiement.statut if paiement else 'non_defini',
            'articles_count': len(c.details)
        })
    
    return jsonify(result)

@app.route('/api/commandes/suivi/<string:code_suivi>', methods=['GET'])
def suivre_commande(code_suivi):
    commande = Commande.query.filter_by(code_suivi=code_suivi).first()
    
    if not commande:
        return jsonify({'message': 'Code de commande invalide'}), 404
    
    paiement = Paiement.query.filter_by(commande_id=commande.id).first()
    
    return jsonify({
        'code_suivi': commande.code_suivi,
        'statut': commande.statut,
        'statut_paiement': paiement.statut if paiement else commande.statut_paiement,
        'sous_total': commande.sous_total,
        'frais_livraison': commande.frais_livraison,
        'reduction': commande.reduction,
        'total': commande.total,
        'distance': commande.distance,
        'delivery_option': commande.delivery_option,
        'date_commande': commande.date_commande.isoformat() if commande.date_commande else None,
        'date_livraison': commande.date_livraison.isoformat() if commande.date_livraison else None,
        'adresse': commande.adresse_livraison,
        'destination_nom': commande.destination_nom,
        'destination_telephone': commande.destination_telephone,
        'articles': [{
            'nom': d.produit.nom,
            'quantite': d.quantite,
            'prix': d.prix_unitaire
        } for d in commande.details]
    })

@app.route('/api/commandes/<int:commande_id>/statut', methods=['PUT'])
@jwt_required()
def update_commande_statut(commande_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    commande = Commande.query.get_or_404(commande_id)
    
    if user.role != 'admin' and commande.client_id != current_user_id:
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    data = request.get_json()
    if 'statut' not in data:
        return jsonify({'message': 'Statut requis'}), 400
    
    nouveau_statut = data['statut']
    ancien_statut = commande.statut
    
    # Validation des transitions de statut
    transitions_valides = {
        'en_attente_paiement': ['preparation', 'annulee'],
        'preparation': ['livraison', 'annulee'],
        'livraison': ['livree', 'annulee'],
        'livree': [],
        'annulee': []
    }
    
    if nouveau_statut not in transitions_valides.get(ancien_statut, []):
        if user.role != 'admin':
            return jsonify({'message': 'Transition de statut non autorisée'}), 400
    
    commande.statut = nouveau_statut
    
    if nouveau_statut == 'livree':
        commande.date_livraison = datetime.now(timezone.utc)
    
    db.session.commit()
    
    print(f"\n📝 Statut de la commande {commande.code_suivi} mis à jour: {ancien_statut} -> {nouveau_statut}")
    
    return jsonify({
        'message': 'Statut mis à jour avec succès',
        'code_suivi': commande.code_suivi,
        'statut': commande.statut,
        'date_livraison': commande.date_livraison.isoformat() if commande.date_livraison else None
    }), 200
#----------------------GESTIONS DES UTILISATEURS----------------------------------------------
# GET /api/admin/users - Liste tous les utilisateurs
@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    users = User.query.all()
    
    return jsonify([{
        'id': u.id,
        'nom': u.nom,
        'telephone': u.telephone,
        'email': getattr(u, 'email', None),
        'role': u.role,
        'date_inscription': u.date_inscription.isoformat() if u.date_inscription else None
    } for u in users]), 200

# PUT /api/admin/users/<id> - Modifier un utilisateur
@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'nom' in data:
        user.nom = data['nom']
    if 'telephone' in data:
        user.telephone = data['telephone']
    if 'role' in data:
        user.role = data['role']
    if 'mot_de_passe' in data and data['mot_de_passe']:
        user.mot_de_passe = bcrypt.generate_password_hash(data['mot_de_passe']).decode('utf-8')
    
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur modifié avec succès'}), 200

# DELETE /api/admin/users/<id> - Supprimer un utilisateur
@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    user = User.query.get_or_404(user_id)
    
    # Empêcher l'admin de se supprimer lui-même
    if user.id == current_user_id:
        return jsonify({'message': 'Vous ne pouvez pas supprimer votre propre compte'}), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Utilisateur supprimé avec succès'}), 200




# ===================== ROUTES PAIEMENTS =====================
@app.route('/api/admin/paiements', methods=['GET'])
@jwt_required()
def get_paiements_en_attente():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    paiements = Paiement.query.filter_by(statut='en_attente').order_by(Paiement.date_paiement.desc()).all()
    
    return jsonify([{
        'id': p.id,
        'code_suivi': p.code_suivi,
        'montant': p.montant,
        'methode': p.methode,
        'numero_transaction': p.numero_transaction,
        'date_paiement': p.date_paiement.isoformat() if p.date_paiement else None,
        'client': {
            'nom': p.commande.client.nom or 'Client',
            'telephone': p.commande.client.telephone
        },
        'commande': {
            'id': p.commande.id,
            'total': p.commande.total,
            'adresse': p.commande.adresse_livraison,
            'articles': [{
                'nom': d.produit.nom,
                'quantite': d.quantite,
                'prix': d.prix_unitaire
            } for d in p.commande.details]
        }
    } for p in paiements])

@app.route('/api/admin/paiements/<int:paiement_id>/valider', methods=['POST'])
@jwt_required()
def valider_paiement(paiement_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    print(f"🔍 Tentative de validation du paiement {paiement_id} par admin {admin.id if admin else 'inconnu'}")
    
    if not admin or admin.role != 'admin':
        print("❌ Accès non autorisé - pas admin")
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    data = request.get_json()
    paiement = Paiement.query.get_or_404(paiement_id)
    
    print(f"📦 Paiement trouvé: {paiement.id}, statut: {paiement.statut}")
    
    # Mettre à jour le paiement
    paiement.statut = 'valide'
    paiement.date_validation = datetime.utcnow()
    paiement.valide_par = current_user_id
    if data and data.get('numero_transaction'):
        paiement.numero_transaction = data['numero_transaction']
    
    # Mettre à jour le statut de la commande
    commande = paiement.commande
    commande.statut = 'preparation'
    commande.statut_paiement = 'valide'
    
    # Réduire les stocks
    for detail in commande.details:
        produit = Produit.query.get(detail.produit_id)
        produit.stock -= detail.quantite
        print(f"📦 Stock réduit pour {produit.nom}: {produit.stock + detail.quantite} -> {produit.stock}")
    
    db.session.commit()
    
    print(f"✅ Paiement validé pour la commande {paiement.code_suivi}")
    print(f"💰 Montant: {paiement.montant} FCFA")
    print(f"👤 Validé par: {admin.nom or admin.telephone}")
    
    # Envoyer notification au client
    send_push_notification(
        user_id=commande.client_id,
        title="✅ Paiement validé",
        body=f"Votre paiement de {paiement.montant} FCFA a été validé. Votre commande est en préparation.",
        data={
            'type': 'payment_validated',
            'orderId': commande.id,
            'code': commande.code_suivi,
            'montant': paiement.montant
        },
        notification_type='payment'
    )
    
    return jsonify({'message': 'Paiement validé avec succès'}), 200

@app.route('/api/admin/paiements/<int:paiement_id>/refuser', methods=['POST'])
@jwt_required()
def refuser_paiement(paiement_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    paiement = Paiement.query.get_or_404(paiement_id)
    
    paiement.statut = 'refuse'
    paiement.date_validation = datetime.utcnow()
    paiement.valide_par = current_user_id
    
    commande = paiement.commande
    commande.statut = 'annulee'
    
    db.session.commit()
    
    print(f"\n❌ Paiement refusé pour la commande {paiement.code_suivi}")
    
    # Envoyer notification au client
    send_push_notification(
        user_id=commande.client_id,
        title="❌ Paiement refusé",
        body=f"Votre paiement de {paiement.montant} FCFA a été refusé. Veuillez vérifier vos informations.",
        data={
            'type': 'payment_refused',
            'orderId': commande.id,
            'code': commande.code_suivi
        },
        notification_type='payment'
    )
    
    return jsonify({'message': 'Paiement refusé'}), 200

@app.route('/api/commandes/<string:code_suivi>/paiement', methods=['GET'])
def get_statut_paiement(code_suivi):
    commande = Commande.query.filter_by(code_suivi=code_suivi).first()
    
    if not commande:
        return jsonify({'message': 'Commande non trouvée'}), 404
    
    paiement = Paiement.query.filter_by(commande_id=commande.id).first()
    
    if not paiement:
        return jsonify({'message': 'Paiement non trouvé'}), 404
    
    return jsonify({
        'code_suivi': code_suivi,
        'statut_paiement': paiement.statut,
        'montant': paiement.montant,
        'methode': paiement.methode,
        'numero_transaction': paiement.numero_transaction,
        'date_paiement': paiement.date_paiement.isoformat() if paiement.date_paiement else None,
        'date_validation': paiement.date_validation.isoformat() if paiement.date_validation else None
    })

# ===================== ROUTES ADMIN =====================
@app.route('/api/admin/commandes', methods=['GET'])
@jwt_required()
def get_all_commandes():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    limit = request.args.get('limit', type=int)
    query = Commande.query.order_by(Commande.date_commande.desc())
    
    if limit:
        commandes = query.limit(limit).all()
    else:
        commandes = query.all()
    
    result = []
    for c in commandes:
        paiement = Paiement.query.filter_by(commande_id=c.id).first()
        result.append({
            'id': c.id,
            'code_suivi': c.code_suivi,
            'client': {
                'nom': c.client.nom or 'Client',
                'telephone': c.client.telephone
            },
            'date': c.date_commande.isoformat() if c.date_commande else None,
            'total': c.total,
            'statut': c.statut,
            'statut_paiement': paiement.statut if paiement else 'non_defini',
            'adresse': c.adresse_livraison,
            'livreur_id': c.livreur_id,
            'recherche_livreur': c.recherche_livreur,
            'paiement': {
                'id': paiement.id if paiement else None,
                'statut': paiement.statut if paiement else 'non_defini',
                'methode': paiement.methode if paiement else None,
                'montant': paiement.montant if paiement else None
            },
            'articles': [{
                'nom': d.produit.nom,
                'quantite': d.quantite
            } for d in c.details]
        })
    
    return jsonify(result)

@app.route('/api/admin/commandes/<string:code_suivi>', methods=['GET'])
@jwt_required()
def get_admin_commande_detail(code_suivi):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commande = Commande.query.filter_by(code_suivi=code_suivi).first()
    
    if not commande:
        return jsonify({'message': 'Commande non trouvée'}), 404
    
    paiement = Paiement.query.filter_by(commande_id=commande.id).first()
    
    return jsonify({
        'id': commande.id,
        'code_suivi': commande.code_suivi,
        'client': {
            'nom': commande.client.nom or 'Client',
            'telephone': commande.client.telephone
        },
        'date': commande.date_commande.isoformat() if commande.date_commande else None,
        'sous_total': commande.sous_total,
        'frais_livraison': commande.frais_livraison,
        'reduction': commande.reduction,
        'total': commande.total,
        'statut': commande.statut,
        'recherche_livreur': commande.recherche_livreur,
        'date_recherche': commande.date_recherche.isoformat() if commande.date_recherche else None,
        'livreur_id': commande.livreur_id,
        'adresse': commande.adresse_livraison,
        'paiement': {
            'id': paiement.id if paiement else None,
            'statut': paiement.statut if paiement else 'non_defini',
            'methode': paiement.methode if paiement else None,
            'montant': paiement.montant if paiement else None,
            'numero_transaction': paiement.numero_transaction if paiement else None
        },
        'articles': [{
            'nom': d.produit.nom,
            'quantite': d.quantite,
            'prix': d.prix_unitaire
        } for d in commande.details]
    })

@app.route('/api/admin/livreurs-disponibles', methods=['GET'])
@jwt_required()
def get_livreurs_disponibles():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    livreurs = User.query.filter_by(role='livreur').all()
    
    aujourd_hui = datetime.now(timezone.utc).date()
    debut_jour = datetime(aujourd_hui.year, aujourd_hui.month, aujourd_hui.day, 
                          0, 0, 0, tzinfo=timezone.utc)
    fin_jour = datetime(aujourd_hui.year, aujourd_hui.month, aujourd_hui.day, 
                        23, 59, 59, tzinfo=timezone.utc)
    
    result = []
    for l in livreurs:
        livraisons_aujourdhui = Commande.query.filter(
            Commande.livreur_id == l.id,
            Commande.date_commande >= debut_jour,
            Commande.date_commande <= fin_jour
        ).count()
        
        commande_active = Commande.query.filter(
            Commande.livreur_id == l.id,
            Commande.statut.in_(['preparation', 'livraison'])
        ).first()
        
        statut = 'occupé' if commande_active else 'disponible'
        
        result.append({
            'id': l.id,
            'nom': l.nom or 'Livreur',
            'telephone': l.telephone,
            'statut': statut,
            'note': 4.8,
            'livraisons_aujourdhui': livraisons_aujourdhui
        })
    
    print(f"✅ {len(result)} livreurs trouvés")
    return jsonify(result), 200

@app.route('/api/admin/commandes/<int:commande_id>/assigner-livreur', methods=['POST'])
@jwt_required()
def assigner_livreur(commande_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    data = request.get_json()
    livreur_id = data.get('livreur_id')
    
    commande = Commande.query.get_or_404(commande_id)
    livreur = User.query.get_or_404(livreur_id)
    
    if livreur.role != 'livreur':
        return jsonify({'message': 'L\'utilisateur n\'est pas un livreur'}), 400
    
    if commande.livreur_id:
        return jsonify({'message': 'Cette commande a déjà un livreur assigné'}), 400
    
    commande.livreur_id = livreur_id
    commande.recherche_livreur = False
    db.session.commit()
    
    # Notifier le livreur (avec 60% au lieu de 70%)
    gain = commande.frais_livraison * 0.6  # 👈 Changé ici
    send_push_notification(
        user_id=livreur_id,
        title="🚚 Nouvelle livraison assignée",
        body=f"Vous avez été assigné à la commande {commande.code_suivi} - Gain: {gain:.0f} FCFA",
        data={
            'type': 'driver_assigned',
            'orderId': commande.id,
            'code': commande.code_suivi,
            'gain': gain
        },
        notification_type='assignment'
    )
    
    # Notifier le client
    send_push_notification(
        user_id=commande.client_id,
        title="🚚 Livreur assigné",
        body=f"Un livreur a été assigné à votre commande {commande.code_suivi}",
        data={
            'type': 'driver_assigned',
            'orderId': commande.id,
            'code': commande.code_suivi
        },
        notification_type='order_update'
    )
    
    return jsonify({
        'message': f'Livreur {livreur.nom} assigné avec succès',
        'livreur': {
            'id': livreur.id,
            'nom': livreur.nom,
            'telephone': livreur.telephone
        }
    }), 200

@app.route('/api/admin/commandes-en-attente-livreur', methods=['GET'])
@jwt_required()
def get_commandes_attente_livreur():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commandes = Commande.query.filter_by(
        statut='preparation',
        livreur_id=None,
        recherche_livreur=False
    ).order_by(Commande.date_recherche.desc()).all()
    
    return jsonify([{
        'id': c.id,
        'code_suivi': c.code_suivi,
        'client': {
            'nom': c.client.nom or 'Client',
            'telephone': c.client.telephone
        },
        'adresse': c.adresse_livraison,
        'total': c.total,
        'distance': c.distance,
        'frais_livraison': c.frais_livraison,
        'date_commande': c.date_commande.isoformat() if c.date_commande else None,
        'temps_attente': (datetime.utcnow() - c.date_commande).seconds // 60 if c.date_commande else 0,
        'gain_livreur': c.frais_livraison * 0.7
    } for c in commandes])

@app.route('/api/admin/commandes/<int:commande_id>/rechercher-livreur', methods=['POST'])
@jwt_required()
def rechercher_livreur(commande_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commande = Commande.query.get_or_404(commande_id)
    
    if commande.livreur_id:
        return jsonify({'message': 'Cette commande a déjà un livreur'}), 400
    
    commande.recherche_livreur = True
    commande.date_recherche = datetime.now(timezone.utc)
    db.session.commit()
    
    print(f"\n🔍 Recherche de livreur lancée pour la commande {commande.code_suivi}")
    
    livreurs = User.query.filter_by(role='livreur').all()
    print(f"📋 {len(livreurs)} livreur(s) trouvé(s)")
    
    notifications_envoyees = 0
    
    for livreur in livreurs:
        commande_active = Commande.query.filter(
            Commande.livreur_id == livreur.id,
            Commande.statut.in_(['preparation', 'livraison'])
        ).first()
        
        if not commande_active:
            print(f"✅ Livreur disponible: {livreur.nom or livreur.telephone}")
            
            # 👇 Changé de 0.7 à 0.6 (60%)
            gain = commande.frais_livraison * 0.6
            
            success = send_push_notification(
                user_id=livreur.id,
                title="🚚 Nouvelle livraison disponible",
                body=f"Commande {commande.code_suivi} - Gain: {gain:.0f} FCFA",
                data={
                    'type': 'new_order',
                    'orderId': commande.id,
                    'code': commande.code_suivi,
                    'gain': gain,
                    'distance': commande.distance,
                    'adresse': commande.adresse_livraison
                },
                notification_type='new_orders'
            )
            
            if success:
                notifications_envoyees += 1
                commande.notifications_envoyees += 1
                db.session.commit()
        else:
            print(f"❌ Livreur occupé: {livreur.nom or livreur.telephone}")
    
    print(f"📨 {notifications_envoyees} notification(s) envoyée(s)")
    
    return jsonify({
        'message': 'Recherche de livreur lancée',
        'notifications_envoyees': notifications_envoyees,
        'livreurs_disponibles': notifications_envoyees
    }), 200

@app.route('/api/admin/livreurs-en-attente', methods=['GET'])
@jwt_required()
def get_livreurs_en_attente():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    livreurs = User.query.filter_by(role='livreur_en_attente').all()
    
    return jsonify([{
        'id': l.id,
        'nom': l.nom,
        'telephone': l.telephone,
        'date_inscription': l.date_inscription.isoformat() if l.date_inscription else None
    } for l in livreurs])

@app.route('/api/admin/livreurs/<int:livreur_id>/valider', methods=['PUT'])
@jwt_required()
def valider_livreur(livreur_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    livreur = User.query.get_or_404(livreur_id)
    livreur.role = 'livreur'
    db.session.commit()
    
    # Notifier le livreur
    send_push_notification(
        user_id=livreur_id,
        title="✅ Compte validé",
        body="Félicitations ! Votre compte livreur a été validé. Vous pouvez maintenant recevoir des livraisons.",
        data={
            'type': 'account_validated'
        },
        notification_type='account'
    )
    
    return jsonify({'message': 'Livreur validé avec succès'}), 200

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    total_commandes = Commande.query.count()
    commandes_en_attente = Commande.query.filter_by(statut='en_attente_paiement').count()
    paiements_en_attente = Paiement.query.filter_by(statut='en_attente').count()
    total_clients = User.query.filter_by(role='client').count()
    total_livreurs = User.query.filter_by(role='livreur').count()
    commandes_aujourdhui = Commande.query.filter(
        Commande.date_commande >= datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    ).count()
    
    # Chiffre d'affaires du mois
    debut_mois = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    commandes_mois = Commande.query.filter(Commande.date_commande >= debut_mois).all()
    chiffre_affaires_mois = sum(c.total for c in commandes_mois)
    
    return jsonify({
        'total_commandes': total_commandes,
        'commandes_en_attente': commandes_en_attente,
        'paiements_en_attente': paiements_en_attente,
        'total_clients': total_clients,
        'total_livreurs': total_livreurs,
        'commandes_aujourdhui': commandes_aujourdhui,
        'chiffre_affaires_mois': chiffre_affaires_mois
    })

@app.route('/api/admin/stats/detailed', methods=['GET'])
@jwt_required()
def get_admin_stats_detailed():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    period = request.args.get('period', 'week')
    
    maintenant = datetime.now(timezone.utc)
    if period == 'week':
        debut = maintenant - timedelta(days=7)
    elif period == 'month':
        debut = maintenant - timedelta(days=30)
    else:
        debut = maintenant - timedelta(days=365)
    
    commandes = Commande.query.filter(Commande.date_commande >= debut).all()
    
    total_commandes = len(commandes)
    nouveaux_clients = User.query.filter(User.date_inscription >= debut, User.role == 'client').count()
    
    produits_vendus = 0
    ventes_par_categorie = {}
    top_produits = {}
    
    for cmd in commandes:
        for detail in cmd.details:
            produits_vendus += detail.quantite
            cat = detail.produit.categorie
            ventes_par_categorie[cat] = ventes_par_categorie.get(cat, 0) + detail.quantite
            
            if detail.produit.nom in top_produits:
                top_produits[detail.produit.nom]['total'] += detail.quantite
            else:
                top_produits[detail.produit.nom] = {
                    'nom': detail.produit.nom,
                    'total': detail.quantite,
                    'prix': detail.produit.prix
                }
    
    chiffre_affaires = sum(c.total for c in commandes)
    
    commandes_par_jour = []
    max_commandes = 0
    
    for i in range(7):
        jour = (maintenant - timedelta(days=6-i)).date()
        count = sum(1 for c in commandes if c.date_commande and c.date_commande.date() == jour)
        max_commandes = max(max_commandes, count)
        commandes_par_jour.append({
            'jour': jour.strftime('%a')[:3],
            'count': count
        })
    
    top_5 = sorted(top_produits.values(), key=lambda x: x['total'], reverse=True)[:5]
    
    livraisons_terminees = [c for c in commandes if c.date_livraison]
    temps_moyen = 0
    distance_moyenne = 0
    frais_moyens = 0
    
    if livraisons_terminees:
        temps_total = sum((c.date_livraison - c.date_commande).total_seconds() / 60 for c in livraisons_terminees)
        temps_moyen = round(temps_total / len(livraisons_terminees))
        distance_moyenne = round(sum(c.distance for c in livraisons_terminees) / len(livraisons_terminees) / 1000, 1)
        frais_moyens = sum(c.frais_livraison for c in livraisons_terminees) / len(livraisons_terminees)
    
    livreurs_actifs = Commande.query.filter(
        Commande.livreur_id.isnot(None),
        Commande.date_commande >= debut
    ).distinct(Commande.livreur_id).count()
    
    frais_livraison_total = sum(c.frais_livraison for c in commandes)
    reductions_total = sum(abs(c.reduction) for c in commandes)
    
    categories_colors = {
        'Ingrédients': '#FF6B6B',
        'Boissons': '#4ECDC4',
        'Poissons': '#FFE66D'
    }
    
    return jsonify({
        'total_commandes': total_commandes,
        'nouveaux_clients': nouveaux_clients,
        'produits_vendus': produits_vendus,
        'chiffre_affaires': chiffre_affaires,
        'commandes_par_jour': commandes_par_jour,
        'max_commandes': max_commandes,
        'ventes_par_categorie': [
            {'nom': cat, 'total': ventes_par_categorie.get(cat, 0), 'couleur': categories_colors.get(cat, '#888888')}
            for cat in categories_colors.keys()
        ],
        'total_articles': produits_vendus or 1,
        'top_produits': top_5,
        'livraisons': {
            'moyenne': temps_moyen,
            'distance_moyenne': distance_moyenne,
            'frais_moyens': frais_moyens,
            'livreurs_actifs': livreurs_actifs
        },
        'revenus': {
            'total': chiffre_affaires,
            'frais_livraison': frais_livraison_total,
            'reduction': reductions_total
        },
        'satisfaction': {
            'moyenne': 4.8,
            'total_avis': 0
        }
    })


# GET /api/admin/produits - Liste tous les produits (admin)
@app.route('/api/admin/produits', methods=['GET'])
@jwt_required()
def admin_get_produits():
    """Liste tous les produits pour l'admin (avec gestion d'erreur)"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        produits = Produit.query.order_by(Produit.date_ajout.desc()).all()
        
        return jsonify([{
            'id': p.id,
            'nom': p.nom,
            'description': p.description,
            'prix': p.prix,
            'categorie': p.categorie,
            'stock': p.stock,
            'image_url': p.image_url,
            'date_ajout': p.date_ajout.isoformat() if p.date_ajout else None
        } for p in produits]), 200
        
    except Exception as e:
        return jsonify({'message': 'Erreur serveur', 'error': str(e)}), 500

# POST /api/admin/produits - Créer un nouveau produit
@app.route('/api/admin/produits', methods=['POST'])
@jwt_required()
def create_produit():
    """Crée un nouveau produit (admin seulement)"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        
        # Validation des données requises
        if not data.get('nom'):
            return jsonify({'message': 'Le nom du produit est requis'}), 400
        
        if not data.get('prix'):
            return jsonify({'message': 'Le prix est requis'}), 400
        
        # Création du produit
        nouveau_produit = Produit(
            nom=data['nom'],
            description=data.get('description', ''),
            prix=float(data['prix']),
            categorie=data.get('categorie', 'Ingrédients'),
            stock=int(data.get('stock', 0)),
            image_url=data.get('image_url')  # URL Cloudinary
        )
        
        db.session.add(nouveau_produit)
        db.session.commit()
        
        return jsonify({
            'message': 'Produit créé avec succès',
            'produit': {
                'id': nouveau_produit.id,
                'nom': nouveau_produit.nom,
                'prix': nouveau_produit.prix,
                'image_url': nouveau_produit.image_url
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'message': 'Format de données invalide'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur lors de la création', 'error': str(e)}), 500

# PUT /api/admin/produits/<id> - Modifier un produit
@app.route('/api/admin/produits/<int:produit_id>', methods=['PUT'])
@jwt_required()
def update_produit(produit_id):
    """Modifie un produit existant (admin seulement)"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        produit = Produit.query.get_or_404(produit_id)
        data = request.get_json()
        
        # Mise à jour des champs
        if 'nom' in data:
            produit.nom = data['nom']
        if 'description' in data:
            produit.description = data['description']
        if 'prix' in data:
            produit.prix = float(data['prix'])
        if 'categorie' in data:
            produit.categorie = data['categorie']
        if 'stock' in data:
            produit.stock = int(data['stock'])
        if 'image_url' in data:
            produit.image_url = data['image_url']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Produit modifié avec succès',
            'produit': {
                'id': produit.id,
                'nom': produit.nom,
                'prix': produit.prix,
                'image_url': produit.image_url
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur lors de la modification', 'error': str(e)}), 500

# DELETE /api/admin/produits/<id> - Supprimer un produit
@app.route('/api/admin/produits/<int:produit_id>', methods=['DELETE'])
@jwt_required()
def delete_produit(produit_id):
    """Supprime un produit (admin seulement)"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        produit = Produit.query.get_or_404(produit_id)
        
        db.session.delete(produit)
        db.session.commit()
        
        return jsonify({'message': 'Produit supprimé avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur lors de la suppression', 'error': str(e)}), 500

# ===================== ROUTES CATÉGORIES =====================

# GET /api/categories - Liste les catégories disponibles
@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Retourne la liste des catégories et leur nombre de produits"""
    try:
        from sqlalchemy import func
        
        categories = db.session.query(
            Produit.categorie, 
            func.count(Produit.id).label('count')
        ).group_by(Produit.categorie).all()
        
        result = []
        for cat in categories:
            result.append({
                'id': cat.categorie,
                'nom': cat.categorie,
                'count': cat.count
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'message': 'Erreur serveur', 'error': str(e)}), 500



# ===================== ROUTES LIVREUR =====================
@app.route('/api/livreur/commandes-disponibles', methods=['GET'])
@jwt_required()
def livreur_commandes_disponibles():
    current_user_id = get_jwt_identity()
    livreur = User.query.get(current_user_id)
    
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commandes = Commande.query.filter_by(
        statut='preparation',
        livreur_id=None,
        recherche_livreur=True
    ).order_by(Commande.date_recherche.desc()).all()
    
    return jsonify([{
        'id': c.id,
        'code_suivi': c.code_suivi,
        'client': {
            'nom': c.client.nom or 'Client',
            'telephone': c.client.telephone
        },
        'adresse_livraison': c.adresse_livraison,
        'distance': c.distance,
        'frais_livraison': c.frais_livraison,
        'total': c.total,
        'gain': c.frais_livraison * 0.6,
        'date_recherche': c.date_recherche.strftime('%H:%M') if c.date_recherche else None
    } for c in commandes])


@app.route('/api/admin/livreurs/<int:livreur_id>', methods=['GET'])
@jwt_required()
def get_livreur_details(livreur_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    livreur = User.query.filter_by(id=livreur_id, role='livreur').first()
    if not livreur:
        return jsonify({'message': 'Livreur non trouvé'}), 404
    
    return jsonify({
        'id': livreur.id,
        'nom': livreur.nom,
        'telephone': livreur.telephone,
        'date_inscription': livreur.date_inscription.isoformat() if livreur.date_inscription else None
    })

@app.route('/api/admin/livreurs/<int:livreur_id>/commandes', methods=['GET'])
@jwt_required()
def get_livreur_commandes(livreur_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commandes = Commande.query.filter_by(livreur_id=livreur_id).order_by(Commande.date_commande.desc()).all()
    
    result = []
    for cmd in commandes:
        result.append({
            'id': cmd.id,
            'code_suivi': cmd.code_suivi,
            'statut': cmd.statut,
            'total': cmd.total,
            'frais_livraison': cmd.frais_livraison,
            'adresse_livraison': cmd.adresse_livraison,
            'date_commande': cmd.date_commande.isoformat(),
            'client': {
                'nom': cmd.client.nom,
                'telephone': cmd.client.telephone
            }
        })
    
    return jsonify(result)
@app.route('/api/livreur/mes-livraisons', methods=['GET'])
@jwt_required()
def livreur_mes_livraisons():
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commandes = Commande.query.filter_by(livreur_id=current_user_id)\
        .filter(Commande.statut.in_(['preparation', 'livraison']))\
        .order_by(Commande.date_commande.desc())\
        .all()
    
    return jsonify([{
        'id': c.id,
        'code_suivi': c.code_suivi,
        'client': {
            'nom': c.client.nom or 'Client',
            'telephone': c.client.telephone
        },
        'adresse_livraison': c.adresse_livraison,
        'statut': c.statut,
        'distance': c.distance,
        'frais_livraison': c.frais_livraison,
        'total': c.total
    } for c in commandes])

@app.route('/api/livreur/historique-livraisons', methods=['GET'])
@jwt_required()
def livreur_historique_livraisons():
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commandes = Commande.query.filter_by(livreur_id=current_user_id)\
        .filter(Commande.statut.in_(['livree', 'annulee']))\
        .order_by(Commande.date_commande.desc())\
        .all()
    
    return jsonify([{
        'id': c.id,
        'code_suivi': c.code_suivi,
        'adresse_livraison': c.adresse_livraison,
        'statut': c.statut,
        'distance': c.distance,
        'frais_livraison': c.frais_livraison,
        'gain': c.frais_livraison * 0.7,
        'date_commande': c.date_commande.isoformat() if c.date_commande else None,
        'date_livraison': c.date_livraison.isoformat() if c.date_livraison else None
    } for c in commandes])

@app.route('/api/livreur/commandes/<int:commande_id>/accepter', methods=['PUT'])
@jwt_required()
def livreur_accepter_livraison(commande_id):
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commande = Commande.query.get_or_404(commande_id)
    
    if commande.livreur_id:
        return jsonify({'message': 'Cette commande a déjà un livreur'}), 400
    
    if commande.statut != 'preparation':
        return jsonify({'message': 'Cette commande n\'est pas disponible'}), 400
    
    commande.livreur_id = current_user_id
    commande.statut = 'preparation'
    commande.recherche_livreur = False
    db.session.commit()
    
    print(f"\n✅ Livraison acceptée par livreur {livreur.nom or livreur.telephone}")
    print(f"📦 Commande: {commande.code_suivi}")
    
    # Notifier le client
    send_push_notification(
        user_id=commande.client_id,
        title="🚚 Livreur en route",
        body=f"Un livreur a accepté votre commande {commande.code_suivi}",
        data={
            'type': 'driver_assigned',
            'orderId': commande.id,
            'code': commande.code_suivi
        },
        notification_type='order_update'
    )
    
    # Notifier les admins
    admins = User.query.filter_by(role='admin').all()
    for admin in admins:
        send_push_notification(
            user_id=admin.id,
            title="✅ Livraison acceptée",
            body=f"Livreur {livreur.nom or livreur.telephone} a accepté la commande {commande.code_suivi}",
            data={
                'type': 'order_accepted',
                'orderId': commande.id,
                'code': commande.code_suivi,
                'livreur': livreur.nom or livreur.telephone
            },
            notification_type='admin_alert'
        )
    
    return jsonify({'message': 'Livraison acceptée avec succès'}), 200

@app.route('/api/livreur/commandes/<int:commande_id>/statut', methods=['PUT'])
@jwt_required()
def livreur_update_statut(commande_id):
    current_user_id_str = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id_str)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commande = Commande.query.get_or_404(commande_id)
    
    if commande.livreur_id != current_user_id:
        return jsonify({'message': 'Cette commande ne vous est pas assignée'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Données JSON requises'}), 400
        
    nouveau_statut = data.get('statut')
    if nouveau_statut not in ['livraison', 'livree']:
        return jsonify({'message': 'Statut invalide'}), 400
    
    ancien_statut = commande.statut
    commande.statut = nouveau_statut
    
    if nouveau_statut == 'livree':
        commande.date_livraison = datetime.now(timezone.utc)
        
        # Notifier le client
        send_push_notification(
            user_id=commande.client_id,
            title="✅ Commande livrée",
            body=f"Votre commande {commande.code_suivi} a été livrée avec succès",
            data={
                'type': 'order_delivered',
                'orderId': commande.id,
                'code': commande.code_suivi
            },
            notification_type='order_update'
        )
    
    db.session.commit()
    
    return jsonify({
        'message': 'Statut mis à jour avec succès',
        'commande_id': commande.id,
        'code_suivi': commande.code_suivi,
        'nouveau_statut': commande.statut
    }), 200

@app.route('/api/livreur/commandes/<int:commande_id>', methods=['GET'])
@jwt_required()
def livreur_detail_commande(commande_id):
    current_user_id_str = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id_str)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commande = Commande.query.get_or_404(commande_id)
    
    if commande.livreur_id != current_user_id and not (commande.statut == 'preparation' and commande.recherche_livreur):
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    articles = []
    for detail in commande.details:
        articles.append({
            'nom': detail.produit.nom,
            'quantite': detail.quantite,
            'prix': detail.prix_unitaire
        })
    
    return jsonify({
        'id': commande.id,
        'code_suivi': commande.code_suivi,
        'client': {
            'nom': commande.client.nom or 'Client',
            'telephone': commande.client.telephone
        },
        'adresse': commande.adresse_livraison,
        'statut': commande.statut,
        'distance': commande.distance,
        'frais_livraison': commande.frais_livraison,
        'total': commande.total,
        'articles': articles,
        'date_commande': commande.date_commande.isoformat() if commande.date_commande else None,
        'date_livraison': commande.date_livraison.isoformat() if commande.date_livraison else None
    }), 200

@app.route('/api/livreur/stats', methods=['GET'])
@jwt_required()
def livreur_stats():
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    maintenant = datetime.now(timezone.utc)
    
    total_livraisons = Commande.query.filter_by(livreur_id=current_user_id).count()
    
    debut_mois = maintenant.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    livraisons_mois = Commande.query.filter(
        Commande.livreur_id == current_user_id,
        Commande.date_commande >= debut_mois
    ).count()
    
    commandes = Commande.query.filter_by(livreur_id=current_user_id).all()
    gains_total = sum(c.frais_livraison * 0.7 for c in commandes if c.frais_livraison)
    
    commandes_mois = Commande.query.filter(
        Commande.livreur_id == current_user_id,
        Commande.date_commande >= debut_mois
    ).all()
    gains_mois = sum(c.frais_livraison * 0.7 for c in commandes_mois if c.frais_livraison)
    
    livraisons_aujourdhui = Commande.query.filter(
        Commande.livreur_id == current_user_id,
        Commande.date_commande >= maintenant.replace(hour=0, minute=0, second=0, microsecond=0)
    ).count()
    
    return jsonify({
        'total_livraisons': total_livraisons,
        'livraisons_mois': livraisons_mois,
        'livraisons_aujourdhui': livraisons_aujourdhui,
        'gains_total': gains_total,
        'gains_mois': gains_mois,
        'note_moyenne': 4.8
    })

# ===================== ROUTES HEALTH =====================
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'SWAM API is running',
        'timestamp': datetime.utcnow().isoformat()
    })
#------------------REINITIALISER MOTS DE PASSE-----------------------
# Route pour demander un code de réinitialisation
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    telephone = data.get('telephone')
    
    if not telephone:
        return jsonify({'message': 'Numéro de téléphone requis'}), 400
    
    # Vérifier si l'utilisateur existe
    user = User.query.filter_by(telephone=telephone).first()
    if not user:
        return jsonify({'message': 'Aucun compte trouvé avec ce numéro'}), 404
    
    # Générer un code à 6 chiffres
    code = generate_reset_code()
    
    # Sauvegarder le code en base
    reset_code = ResetCode(
        telephone=telephone,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=15)  # Expire après 15 minutes
    )
    
    # Supprimer les anciens codes pour ce téléphone
    ResetCode.query.filter_by(telephone=telephone).delete()
    
    db.session.add(reset_code)
    db.session.commit()
    
    # ICI : Envoyer le code par SMS (via votre service SMS)
    # Pour le moment, on affiche juste dans la console
    print(f"📱 Code de réinitialisation pour {telephone}: {code}")
    
    # En production, envoyez un vrai SMS
    # send_sms(telephone, f"Votre code de réinitialisation SWAM est: {code}")
    
    return jsonify({
        'message': 'Code envoyé avec succès',
        'debug_code': code 
    }), 200

# Route pour vérifier le code
@app.route('/api/verify-reset-code', methods=['POST'])
def verify_reset_code():
    data = request.get_json()
    telephone = data.get('telephone')
    code = data.get('code')
    
    if not telephone or not code:
        return jsonify({'message': 'Téléphone et code requis'}), 400
    
    # Chercher le code valide
    reset_code = ResetCode.query.filter_by(
        telephone=telephone,
        code=code,
        used=False
    ).first()
    
    if not reset_code:
        return jsonify({'message': 'Code invalide'}), 400
    
    # Vérifier si le code a expiré
    if reset_code.expires_at < datetime.utcnow():
        return jsonify({'message': 'Code expiré'}), 400
    
    return jsonify({'message': 'Code valide'}), 200

# Route pour réinitialiser le mot de passe
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    telephone = data.get('telephone')
    code = data.get('code')
    new_password = data.get('new_password')
    
    if not telephone or not code or not new_password:
        return jsonify({'message': 'Tous les champs sont requis'}), 400
    
    # Vérifier le code
    reset_code = ResetCode.query.filter_by(
        telephone=telephone,
        code=code,
        used=False
    ).first()
    
    if not reset_code or reset_code.expires_at < datetime.utcnow():
        return jsonify({'message': 'Code invalide ou expiré'}), 400
    
    # Vérifier la longueur du mot de passe
    if len(new_password) < 4:
        return jsonify({'message': 'Le mot de passe doit contenir au moins 4 caractères'}), 400
    
    # Mettre à jour le mot de passe
    user = User.query.filter_by(telephone=telephone).first()
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    hashed_password = bcrypt.generate_password_hash(new_password).decode('utf-8')
    user.mot_de_passe = hashed_password
    
    # Marquer le code comme utilisé
    reset_code.used = True
    
    db.session.commit()
    
    return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200

# ===================== CREATION DES DONNEES DE TEST =====================
def create_sample_data():
    # Création d'un admin par défaut
    if not User.query.filter_by(role='admin').first():
        admin = User(
            nom='Admin',
            telephone='771234567',
            mot_de_passe=bcrypt.generate_password_hash('admin123').decode('utf-8'),
            role='admin',
            email='admin@swami.com'
        )
        db.session.add(admin)
        print("✅ Admin créé: 771234567 / admin123")
    
    # Création de livreurs de test
    if not User.query.filter_by(role='livreur').first():
        livreurs = [
            User(
                nom='Livreur Ali',
                telephone='781234567',
                mot_de_passe=bcrypt.generate_password_hash('livreur123').decode('utf-8'),
                role='livreur',
                email='ali@example.com'
            ),
            User(
                nom='Livreur Fatou',
                telephone='782345678',
                mot_de_passe=bcrypt.generate_password_hash('livreur123').decode('utf-8'),
                role='livreur',
                email='fatou@example.com'
            )
        ]
        for livreur in livreurs:
            db.session.add(livreur)
        print("✅ Livreurs de test créés")
    
    # Création des produits de test
    if Produit.query.count() == 0:
        print("Création des données de test...")
        
        produits = [
            Produit(nom='Riz parfumé', description='Riz de qualité supérieure', prix=3500, categorie='Ingrédients', stock=50),
            Produit(nom='Huile Arachide', description='Huile pure 100% arachide', prix=2500, categorie='Ingrédients', stock=30),
            Produit(nom='Jus de Bissap', description='Jus naturel de bissap', prix=1000, categorie='Boissons', stock=100),
            Produit(nom='Thiakry', description='Dessert traditionnel', prix=1500, categorie='Boissons', stock=40),
            Produit(nom='Marlin fumé', description='Poisson fumé traditionnel', prix=4500, categorie='Poissons', stock=20),
            Produit(nom='Requin séché', description='Requin séché au soleil', prix=5000, categorie='Poissons', stock=15),
        ]
        
        for produit in produits:
            db.session.add(produit)
        
        db.session.commit()
        print("✅ Données de test créées avec succès!")

# ===================== ROUTES ADRESSES =====================

# GET /api/client/adresses - Liste toutes les adresses du client connecté
@app.route('/api/client/adresses', methods=['GET'])
@jwt_required()
def get_client_adresses():
    """Récupère toutes les adresses de l'utilisateur connecté"""
    try:
        current_user_id = get_jwt_identity()
        
        adresses = Adresse.query.filter_by(user_id=current_user_id).order_by(
            Adresse.est_principale.desc(), 
            Adresse.created_at.desc()
        ).all()
        
        return jsonify([{
            'id': a.id,
            'nom': a.nom,
            'adresse': a.adresse,
            'telephone': a.telephone,
            'est_principale': a.est_principale,
            'created_at': a.created_at.isoformat() if a.created_at else None
        } for a in adresses]), 200
        
    except Exception as e:
        print(f"❌ Erreur get_adresses: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

# POST /api/client/adresses - Ajouter une nouvelle adresse
@app.route('/api/client/adresses', methods=['POST'])
@jwt_required()
def create_client_adresse():
    """Crée une nouvelle adresse pour l'utilisateur connecté"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validation des données
        if not data.get('nom'):
            return jsonify({'message': 'Le nom de l\'adresse est requis'}), 400
        if not data.get('adresse'):
            return jsonify({'message': 'L\'adresse est requise'}), 400
        if not data.get('telephone'):
            return jsonify({'message': 'Le téléphone est requis'}), 400
        
        # Si cette adresse est définie comme principale, retirer le statut principal des autres
        if data.get('est_principale'):
            Adresse.query.filter_by(user_id=current_user_id, est_principale=True).update({'est_principale': False})
        
        # Créer la nouvelle adresse
        nouvelle_adresse = Adresse(
            user_id=current_user_id,
            nom=data['nom'],
            adresse=data['adresse'],
            telephone=data['telephone'],
            est_principale=data.get('est_principale', False)
        )
        
        db.session.add(nouvelle_adresse)
        db.session.commit()
        
        print(f"✅ Adresse créée pour l'utilisateur {current_user_id}")
        
        return jsonify({
            'message': 'Adresse créée avec succès',
            'adresse': {
                'id': nouvelle_adresse.id,
                'nom': nouvelle_adresse.nom,
                'adresse': nouvelle_adresse.adresse,
                'telephone': nouvelle_adresse.telephone,
                'est_principale': nouvelle_adresse.est_principale
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur create_adresse: {str(e)}")
        return jsonify({'message': 'Erreur lors de la création de l\'adresse'}), 500

# PUT /api/client/adresses/<id> - Modifier une adresse
@app.route('/api/client/adresses/<int:adresse_id>', methods=['PUT'])
@jwt_required()
def update_client_adresse(adresse_id):
    """Modifie une adresse existante"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Récupérer l'adresse et vérifier qu'elle appartient à l'utilisateur
        adresse = Adresse.query.filter_by(id=adresse_id, user_id=current_user_id).first()
        
        if not adresse:
            return jsonify({'message': 'Adresse non trouvée'}), 404
        
        # Si cette adresse est définie comme principale, retirer le statut principal des autres
        if data.get('est_principale') and not adresse.est_principale:
            Adresse.query.filter_by(user_id=current_user_id, est_principale=True).update({'est_principale': False})
        
        # Mise à jour des champs
        if 'nom' in data:
            adresse.nom = data['nom']
        if 'adresse' in data:
            adresse.adresse = data['adresse']
        if 'telephone' in data:
            adresse.telephone = data['telephone']
        if 'est_principale' in data:
            adresse.est_principale = data['est_principale']
        
        db.session.commit()
        
        return jsonify({'message': 'Adresse modifiée avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur update_adresse: {str(e)}")
        return jsonify({'message': 'Erreur lors de la modification'}), 500

# DELETE /api/client/adresses/<id> - Supprimer une adresse
@app.route('/api/client/adresses/<int:adresse_id>', methods=['DELETE'])
@jwt_required()
def delete_client_adresse(adresse_id):
    """Supprime une adresse"""
    try:
        current_user_id = get_jwt_identity()
        
        adresse = Adresse.query.filter_by(id=adresse_id, user_id=current_user_id).first()
        
        if not adresse:
            return jsonify({'message': 'Adresse non trouvée'}), 404
        
        db.session.delete(adresse)
        db.session.commit()
        
        return jsonify({'message': 'Adresse supprimée avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur delete_adresse: {str(e)}")
        return jsonify({'message': 'Erreur lors de la suppression'}), 500

# ===================== ROUTES LISTE DE SOUHAITS =====================

# GET /api/client/wishlist - Liste des souhaits
@app.route('/api/client/wishlist', methods=['GET'])
@jwt_required()
def get_wishlist():
    """Récupère la liste de souhaits de l'utilisateur"""
    try:
        current_user_id = get_jwt_identity()
        
        wishlist = Wishlist.query.filter_by(user_id=current_user_id).order_by(Wishlist.created_at.desc()).all()
        
        return jsonify([{
            'id': w.id,
            'produit_id': w.produit_id,
            'produit': {
                'id': w.produit.id,
                'nom': w.produit.nom,
                'prix': w.produit.prix,
                'image_url': w.produit.image_url,
                'categorie': w.produit.categorie
            },
            'created_at': w.created_at.isoformat() if w.created_at else None
        } for w in wishlist]), 200
        
    except Exception as e:
        print(f"❌ Erreur get_wishlist: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

# POST /api/client/wishlist - Ajouter un produit aux souhaits
@app.route('/api/client/wishlist', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    """Ajoute un produit à la liste de souhaits"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        produit_id = data.get('produit_id')
        
        if not produit_id:
            return jsonify({'message': 'ID produit requis'}), 400
        
        # Vérifier si le produit existe déjà dans la wishlist
        existing = Wishlist.query.filter_by(
            user_id=current_user_id, 
            produit_id=produit_id
        ).first()
        
        if existing:
            return jsonify({'message': 'Produit déjà dans la liste de souhaits'}), 400
        
        # Vérifier si le produit existe
        produit = Produit.query.get(produit_id)
        if not produit:
            return jsonify({'message': 'Produit non trouvé'}), 404
        
        wishlist_item = Wishlist(
            user_id=current_user_id,
            produit_id=produit_id
        )
        
        db.session.add(wishlist_item)
        db.session.commit()
        
        return jsonify({'message': 'Produit ajouté à la liste de souhaits'}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur add_to_wishlist: {str(e)}")
        return jsonify({'message': 'Erreur lors de l\'ajout'}), 500

# DELETE /api/client/wishlist/<id> - Retirer un produit des souhaits
@app.route('/api/client/wishlist/<int:wishlist_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(wishlist_id):
    """Retire un produit de la liste de souhaits"""
    try:
        current_user_id = get_jwt_identity()
        
        wishlist_item = Wishlist.query.filter_by(
            id=wishlist_id, 
            user_id=current_user_id
        ).first()
        
        if not wishlist_item:
            return jsonify({'message': 'Élément non trouvé'}), 404
        
        db.session.delete(wishlist_item)
        db.session.commit()
        
        return jsonify({'message': 'Produit retiré de la liste de souhaits'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur remove_from_wishlist: {str(e)}")
        return jsonify({'message': 'Erreur lors de la suppression'}), 500

# ===================== ROUTES AVIS =====================

# GET /api/client/avis - Liste des avis de l'utilisateur
@app.route('/api/client/avis', methods=['GET'])
@jwt_required()
def get_mes_avis():
    """Récupère tous les avis de l'utilisateur connecté"""
    try:
        current_user_id = get_jwt_identity()
        
        avis = Avis.query.filter_by(user_id=current_user_id).order_by(Avis.created_at.desc()).all()
        
        return jsonify([{
            'id': a.id,
            'commande_id': a.commande_id,
            'produit_id': a.produit_id,
            'produit_nom': a.produit.nom if a.produit else 'Produit',
            'note': a.note,
            'commentaire': a.commentaire,
            'created_at': a.created_at.isoformat() if a.created_at else None
        } for a in avis]), 200
        
    except Exception as e:
        print(f"❌ Erreur get_avis: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

# POST /api/client/avis - Ajouter un avis
@app.route('/api/client/avis', methods=['POST'])
@jwt_required()
def add_avis():
    """Ajoute un avis sur un produit commandé"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        commande_id = data.get('commande_id')
        produit_id = data.get('produit_id')
        note = data.get('note')
        commentaire = data.get('commentaire', '')
        
        # Validations
        if not all([commande_id, produit_id, note]):
            return jsonify({'message': 'commande_id, produit_id et note requis'}), 400
        
        if not 1 <= note <= 5:
            return jsonify({'message': 'La note doit être entre 1 et 5'}), 400
        
        # Vérifier que la commande appartient à l'utilisateur
        commande = Commande.query.filter_by(id=commande_id, client_id=current_user_id).first()
        if not commande:
            return jsonify({'message': 'Commande non trouvée'}), 404
        
        # Vérifier que l'utilisateur n'a pas déjà donné d'avis pour ce produit dans cette commande
        existing = Avis.query.filter_by(
            user_id=current_user_id,
            commande_id=commande_id,
            produit_id=produit_id
        ).first()
        
        if existing:
            return jsonify({'message': 'Vous avez déjà donné un avis pour ce produit'}), 400
        
        avis = Avis(
            user_id=current_user_id,
            commande_id=commande_id,
            produit_id=produit_id,
            note=note,
            commentaire=commentaire
        )
        
        db.session.add(avis)
        db.session.commit()
        
        return jsonify({'message': 'Avis ajouté avec succès'}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur add_avis: {str(e)}")
        return jsonify({'message': 'Erreur lors de l\'ajout de l\'avis'}), 500

# ===================== ROUTES CODES PROMO =====================

# GET /api/client/promos - Liste des codes promo disponibles pour l'utilisateur
@app.route('/api/client/promos', methods=['GET'])
@jwt_required()
def get_mes_promos():
    """Récupère les codes promo disponibles pour l'utilisateur"""
    try:
        current_user_id = get_jwt_identity()
        maintenant = datetime.utcnow()
        
        # Récupérer les codes promo actifs
        promos = CodePromo.query.filter(
            CodePromo.date_debut <= maintenant,
            CodePromo.date_fin >= maintenant,
            CodePromo.utilisations_actuelles < CodePromo.max_utilisations
        ).all()
        
        # Récupérer les codes déjà utilisés par l'utilisateur
        codes_utilises = db.session.query(UtilisationCodePromo.code_promo_id).filter(
            UtilisationCodePromo.user_id == current_user_id
        ).all()
        codes_utilises_ids = [c[0] for c in codes_utilises]
        
        # Filtrer les codes non utilisés
        promos_disponibles = [p for p in promos if p.id not in codes_utilises_ids]
        
        return jsonify([{
            'id': p.id,
            'code': p.code,
            'description': p.description,
            'reduction_type': p.reduction_type,
            'reduction_value': p.reduction_value,
            'min_commande': p.min_commande,
            'date_fin': p.date_fin.isoformat() if p.date_fin else None
        } for p in promos_disponibles]), 200
        
    except Exception as e:
        print(f"❌ Erreur get_promos: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

# POST /api/client/promos/valider - Valider un code promo
@app.route('/api/client/promos/valider', methods=['POST'])
@jwt_required()
def valider_code_promo():
    """Valide un code promo pour une commande"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        code = data.get('code')
        montant_commande = data.get('montant_commande', 0)
        
        if not code:
            return jsonify({'message': 'Code promo requis'}), 400
        
        maintenant = datetime.utcnow()
        
        # Chercher le code promo
        promo = CodePromo.query.filter_by(code=code).first()
        
        if not promo:
            return jsonify({'message': 'Code promo invalide'}), 404
        
        # Vérifier les dates
        if promo.date_debut > maintenant:
            return jsonify({'message': 'Ce code n\'est pas encore valide'}), 400
        
        if promo.date_fin < maintenant:
            return jsonify({'message': 'Ce code a expiré'}), 400
        
        # Vérifier le nombre d'utilisations
        if promo.utilisations_actuelles >= promo.max_utilisations:
            return jsonify({'message': 'Ce code a atteint sa limite d\'utilisations'}), 400
        
        # Vérifier si l'utilisateur a déjà utilisé ce code
        deja_utilise = UtilisationCodePromo.query.filter_by(
            code_promo_id=promo.id,
            user_id=current_user_id
        ).first()
        
        if deja_utilise:
            return jsonify({'message': 'Vous avez déjà utilisé ce code'}), 400
        
        # Vérifier le montant minimum de commande
        if montant_commande < promo.min_commande:
            return jsonify({'message': f'Commande minimum de {promo.min_commande} FCFA requise'}), 400
        
        # Calculer la réduction
        reduction = 0
        if promo.reduction_type == 'pourcentage':
            reduction = montant_commande * promo.reduction_value / 100
        else:  # montant
            reduction = promo.reduction_value
        
        return jsonify({
            'valid': True,
            'id': promo.id,
            'reduction': round(reduction),
            'reduction_type': promo.reduction_type,
            'reduction_value': promo.reduction_value,
            'message': f'Code promo valide ! Vous économisez {round(reduction)} FCFA'
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur valider_promo: {str(e)}")
        return jsonify({'message': 'Erreur lors de la validation'}), 500

# POST /api/client/promos/utiliser - Utiliser un code promo
@app.route('/api/client/promos/utiliser', methods=['POST'])
@jwt_required()
def utiliser_code_promo():
    """Marque un code promo comme utilisé pour une commande"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        code_promo_id = data.get('code_promo_id')
        commande_id = data.get('commande_id')
        
        if not code_promo_id or not commande_id:
            return jsonify({'message': 'code_promo_id et commande_id requis'}), 400
        
        # Vérifier que la commande appartient à l'utilisateur
        commande = Commande.query.filter_by(id=commande_id, client_id=current_user_id).first()
        if not commande:
            return jsonify({'message': 'Commande non trouvée'}), 404
        
        # Récupérer le code promo
        promo = CodePromo.query.get(code_promo_id)
        if not promo:
            return jsonify({'message': 'Code promo non trouvé'}), 404
        
        # Enregistrer l'utilisation
        utilisation = UtilisationCodePromo(
            code_promo_id=code_promo_id,
            user_id=current_user_id,
            commande_id=commande_id
        )
        
        promo.utilisations_actuelles += 1
        
        db.session.add(utilisation)
        db.session.commit()
        
        return jsonify({'message': 'Code promo appliqué avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur utiliser_promo: {str(e)}")
        return jsonify({'message': 'Erreur lors de l\'application du code'}), 500

# ===================== ROUTES STATISTIQUES D'ACHAT =====================

# GET /api/client/statistiques - Statistiques détaillées d'achat
@app.route('/api/client/statistiques', methods=['GET'])
@jwt_required()
def get_statistiques_achat():
    """Récupère des statistiques détaillées sur les achats de l'utilisateur"""
    try:
        current_user_id = get_jwt_identity()
        
        # Récupérer toutes les commandes de l'utilisateur
        commandes = Commande.query.filter_by(client_id=current_user_id).all()
        
        if not commandes:
            return jsonify({
                'total_commandes': 0,
                'total_depense': 0,
                'moyenne_commande': 0,
                'commande_max': 0,
                'commande_min': 0,
                'produits_achetes': 0,
                'categories_favorites': [],
                'mois_plus_actif': None,
                'jour_prefere': None
            }), 200
        
        # Statistiques générales
        total_commandes = len(commandes)
        total_depense = sum(c.total for c in commandes)
        moyenne_commande = total_depense / total_commandes if total_commandes > 0 else 0
        commande_max = max((c.total for c in commandes), default=0)
        commande_min = min((c.total for c in commandes), default=0)
        
        # Nombre total de produits achetés
        produits_achetes = 0
        categories_count = {}
        
        for cmd in commandes:
            for detail in cmd.details:
                produits_achetes += detail.quantite
                if detail.produit and detail.produit.categorie:
                    cat = detail.produit.categorie
                    categories_count[cat] = categories_count.get(cat, 0) + detail.quantite
        
        # Catégories favorites (top 3)
        categories_favorites = sorted(
            [{'categorie': k, 'quantite': v} for k, v in categories_count.items()],
            key=lambda x: x['quantite'],
            reverse=True
        )[:3]
        
        # Mois le plus actif
        mois_count = {}
        jour_count = {}
        
        for cmd in commandes:
            if cmd.date_commande:
                mois = cmd.date_commande.strftime('%Y-%m')
                mois_count[mois] = mois_count.get(mois, 0) + 1
                
                jour = cmd.date_commande.strftime('%A')  # Jour de la semaine
                jour_count[jour] = jour_count.get(jour, 0) + 1
        
        mois_plus_actif = max(mois_count, key=mois_count.get) if mois_count else None
        jour_prefere = max(jour_count, key=jour_count.get) if jour_count else None
        
        return jsonify({
            'total_commandes': total_commandes,
            'total_depense': total_depense,
            'moyenne_commande': round(moyenne_commande),
            'commande_max': commande_max,
            'commande_min': commande_min,
            'produits_achetes': produits_achetes,
            'categories_favorites': categories_favorites,
            'mois_plus_actif': mois_plus_actif,
            'jour_prefere': jour_prefere
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur get_statistiques: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

# ===================== ROUTES SUPPORT =====================

# POST /api/client/support - Envoyer une demande de support
@app.route('/api/client/support', methods=['POST'])
@jwt_required()
def envoyer_demande_support():
    """Envoie une demande de support"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        sujet = data.get('sujet')
        message = data.get('message')
        type_demande = data.get('type', 'question')  # 'question', 'reclamation', 'bug'
        
        if not sujet or not message:
            return jsonify({'message': 'Sujet et message requis'}), 400
        
        user = User.query.get(current_user_id)
        
        # Ici vous pouvez envoyer un email, créer un ticket dans un système, etc.
        print(f"📧 DEMANDE SUPPORT - User: {user.telephone}")
        print(f"📧 Sujet: {sujet}")
        print(f"📧 Type: {type_demande}")
        print(f"📧 Message: {message}")
        
        # Simuler l'envoi
        # TODO: Implémenter l'envoi d'email réel ou la création de ticket
        
        return jsonify({
            'message': 'Demande envoyée avec succès',
            'ticket_id': f"SUP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        }), 200
        
    except Exception as e:
        print(f"❌ Erreur support: {str(e)}")
        return jsonify({'message': 'Erreur lors de l\'envoi'}), 500

# ===================== ROUTES ADMIN POUR CODES PROMO =====================

# GET /api/admin/promos - Liste tous les codes promo (admin)
@app.route('/api/admin/promos', methods=['GET'])
@jwt_required()
def admin_get_promos():
    """Liste tous les codes promo (admin seulement)"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        promos = CodePromo.query.order_by(CodePromo.created_at.desc()).all()
        
        return jsonify([{
            'id': p.id,
            'code': p.code,
            'description': p.description,
            'reduction_type': p.reduction_type,
            'reduction_value': p.reduction_value,
            'min_commande': p.min_commande,
            'max_utilisations': p.max_utilisations,
            'utilisations_actuelles': p.utilisations_actuelles,
            'date_debut': p.date_debut.isoformat() if p.date_debut else None,
            'date_fin': p.date_fin.isoformat() if p.date_fin else None,
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in promos]), 200
        
    except Exception as e:
        print(f"❌ Erreur admin_get_promos: {str(e)}")
        return jsonify({'message': 'Erreur serveur'}), 500

# POST /api/admin/promos - Créer un code promo (admin)
@app.route('/api/admin/promos', methods=['POST'])
@jwt_required()
def admin_create_promo():
    """Crée un nouveau code promo (admin seulement)"""
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        
        # Validations
        required = ['code', 'reduction_type', 'reduction_value', 'date_debut', 'date_fin']
        for field in required:
            if field not in data:
                return jsonify({'message': f'Le champ {field} est requis'}), 400
        
        if data['reduction_type'] not in ['pourcentage', 'montant']:
            return jsonify({'message': 'Type de réduction invalide'}), 400
        
        # Vérifier si le code existe déjà
        existing = CodePromo.query.filter_by(code=data['code']).first()
        if existing:
            return jsonify({'message': 'Ce code existe déjà'}), 400
        
        # Créer le code promo
        promo = CodePromo(
            code=data['code'],
            description=data.get('description', ''),
            reduction_type=data['reduction_type'],
            reduction_value=data['reduction_value'],
            min_commande=data.get('min_commande', 0),
            max_utilisations=data.get('max_utilisations', 1),
            date_debut=datetime.fromisoformat(data['date_debut'].replace('Z', '+00:00')),
            date_fin=datetime.fromisoformat(data['date_fin'].replace('Z', '+00:00'))
        )
        
        db.session.add(promo)
        db.session.commit()
        
        return jsonify({'message': 'Code promo créé avec succès'}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur admin_create_promo: {str(e)}")
        return jsonify({'message': 'Erreur lors de la création'}), 500


# ===================== CRÉATION DES TABLES =====================
with app.app_context():
    try:
        # Créer toutes les tables si elles n'existent pas
        db.create_all()
        print("✅ Tables créées avec succès")
        
        # Créer un admin par défaut si nécessaire
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            admin = User(
                nom='Admin',
                telephone='771234567',
                mot_de_passe=bcrypt.generate_password_hash('admin123').decode('utf-8'),
                role='admin'
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin par défaut créé: 771234567 / admin123")
            
    except Exception as e:
        print(f"⚠️ Erreur lors de la création des tables: {e}")

# ===================== LANCEMENT =====================
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)