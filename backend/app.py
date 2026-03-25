import sys
print("=== DÉMARRAGE ===", file=sys.stderr)
sys.stderr.flush()

try:
    from flask import Flask, request, jsonify
    print("✓ Flask importé", file=sys.stderr)
except Exception as e:
    print(f"❌ Erreur import Flask: {e}", file=sys.stderr)
    sys.exit(1)

try:
    from flask_sqlalchemy import SQLAlchemy
    print("✓ SQLAlchemy importé", file=sys.stderr)
except Exception as e:
    print(f"❌ Erreur import SQLAlchemy: {e}", file=sys.stderr)
    sys.exit(1)

from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, 
    create_access_token, 
    jwt_required, 
    get_jwt_identity
)
from datetime import datetime, timedelta, timezone
import re
import json 
import random
import logging
import string
import requests
import os
from functools import wraps
from dotenv import load_dotenv

# ================== LOGGING ==================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================== APP ==================
app = Flask(__name__)

# CORS FIX (important pour mobile / Expo)
CORS(app, supports_credentials=True, origins=['*'], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['*'])

# ================== ENV ==================
load_dotenv()

# ================== DATABASE FIX (RAILWAY) ==================
database_url = os.getenv("DATABASE_URL")

if database_url:
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
else:
    database_url = "sqlite:///local.db"

# ================== CLOUDINARY CONFIG ==================
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET")

# ================== CONFIG ==================
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret')
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# ================== INIT ==================
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# ================== ROUTE TEST ==================
@app.route('/')
@app.route('/api/health')
def health():
    return jsonify({
        "status": "OK",
        "database": database_url is not None,
        "cloudinary": bool(CLOUDINARY_CLOUD_NAME)
    })

# ===================== MODELES =====================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=True)
    telephone = db.Column(db.String(20), unique=True, nullable=False)
    mot_de_passe = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='client')
    date_inscription = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
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
    image_url = db.Column(db.String(500), nullable=True)
    date_ajout = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    details_commandes = db.relationship('CommandeDetail', back_populates='produit', lazy=True)

class NotificationToken(db.Model):
    __tablename__ = 'notification_tokens'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(db.String(50))
    platform = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Commande(db.Model):
    __tablename__ = 'commandes'
    
    id = db.Column(db.Integer, primary_key=True)
    code_suivi = db.Column(db.String(10), unique=True, nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    livreur_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    adresse_livraison = db.Column(db.Text, nullable=False)
    destination_nom = db.Column(db.String(100), nullable=True)
    destination_telephone = db.Column(db.String(20), nullable=True)
    distance = db.Column(db.Integer, default=0)
    frais_livraison = db.Column(db.Float, default=0)
    delivery_option = db.Column(db.String(20), default='asap')
    reduction = db.Column(db.Integer, default=0)
    sous_total = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    statut = db.Column(db.String(50), default='en_attente_paiement')
    statut_paiement = db.Column(db.String(20), default='en_attente')
    date_commande = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    date_livraison = db.Column(db.DateTime, nullable=True)
    recherche_livreur = db.Column(db.Boolean, default=False)
    date_recherche = db.Column(db.DateTime, nullable=True)
    notifications_envoyees = db.Column(db.Integer, default=0)
    
    client = db.relationship('User', foreign_keys=[client_id], back_populates='commandes_client')
    livreur = db.relationship('User', foreign_keys=[livreur_id], back_populates='commandes_livreur')
    details = db.relationship('CommandeDetail', back_populates='commande', lazy=True, cascade='all, delete-orphan')
    paiements = db.relationship('Paiement', back_populates='commande', lazy=True, cascade='all, delete-orphan')

class CommandeDetail(db.Model):
    __tablename__ = 'commande_details'
    
    id = db.Column(db.Integer, primary_key=True)
    commande_id = db.Column(db.Integer, db.ForeignKey('commandes.id'), nullable=False)
    produit_id = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)
    quantite = db.Column(db.Integer, nullable=False)
    prix_unitaire = db.Column(db.Float, nullable=False)
    
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
    date_paiement = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    date_validation = db.Column(db.DateTime, nullable=True)
    valide_par = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    commande = db.relationship('Commande', back_populates='paiements')
    validateur = db.relationship('User', foreign_keys=[valide_par], back_populates='paiements_valides')

class ResetCode(db.Model):
    __tablename__ = 'reset_codes'
    
    id = db.Column(db.Integer, primary_key=True)
    telephone = db.Column(db.String(20), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Adresse(db.Model):
    __tablename__ = 'adresses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    adresse = db.Column(db.Text, nullable=False)
    telephone = db.Column(db.String(20), nullable=False)
    est_principale = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    user = db.relationship('User', backref=db.backref('adresses', lazy=True, cascade='all, delete-orphan'))

class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    produit_id = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = db.relationship('User', backref=db.backref('wishlist_items', lazy=True))
    produit = db.relationship('Produit', backref=db.backref('wishlisted_by', lazy=True))

class Avis(db.Model):
    __tablename__ = 'avis'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    commande_id = db.Column(db.Integer, db.ForeignKey('commandes.id'), nullable=False)
    produit_id = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)
    note = db.Column(db.Integer, nullable=False)
    commentaire = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = db.relationship('User', backref=db.backref('avis', lazy=True))
    commande = db.relationship('Commande', backref=db.backref('avis', lazy=True))
    produit = db.relationship('Produit', backref=db.backref('avis', lazy=True))

class CodePromo(db.Model):
    __tablename__ = 'codes_promo'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200))
    reduction_type = db.Column(db.String(20), nullable=False)
    reduction_value = db.Column(db.Float, nullable=False)
    min_commande = db.Column(db.Float, default=0)
    max_utilisations = db.Column(db.Integer, default=1)
    utilisations_actuelles = db.Column(db.Integer, default=0)
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    utilisations = db.relationship('UtilisationCodePromo', backref='code_promo', lazy=True)

class UtilisationCodePromo(db.Model):
    __tablename__ = 'utilisations_codes_promo'
    
    id = db.Column(db.Integer, primary_key=True)
    code_promo_id = db.Column(db.Integer, db.ForeignKey('codes_promo.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    commande_id = db.Column(db.Integer, db.ForeignKey('commandes.id'), nullable=True)
    utilise_le = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# ===================== FONCTIONS UTILES =====================
def generer_code_suivi():
    while True:
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        if not Commande.query.filter_by(code_suivi=code).first():
            return code

def generate_reset_code():
    return ''.join(random.choices(string.digits, k=6))

def validate_telephone(telephone):
    telephone = re.sub(r'[\s\-]', '', telephone)
    pattern = r'^[0-9]{9,15}$'
    return re.match(pattern, telephone) is not None

def calculer_frais_livraison(distance):
    return (distance // 100 + (1 if distance % 100 > 0 else 0)) * 150

# ===================== FONCTIONS NOTIFICATIONS =====================
def send_push_notification(user_id, title, body, data=None, notification_type='default'):
    tokens = NotificationToken.query.filter_by(user_id=user_id).all()
    if not tokens:
        logger.info(f"Aucun token pour l'utilisateur {user_id}")
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
            'channelId': notification_type,
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
            logger.info(f"Notifications envoyées à {len(messages)} appareil(s)")
            result = response.json()
            if 'data' in result:
                for i, res in enumerate(result['data']):
                    if res.get('status') == 'error' and 'DeviceNotRegistered' in res.get('message', ''):
                        NotificationToken.query.filter_by(token=messages[i]['to']).delete()
                        db.session.commit()
            return True
        else:
            logger.error(f"Erreur Expo: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Exception lors de l'envoi: {e}")
        return False

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
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profil mis à jour avec succès',
        'user': {
            'id': user.id,
            'nom': user.nom,
            'telephone': user.telephone,
            'role': user.role,
            'date_inscription': user.date_inscription.isoformat() if user.date_inscription else None
        }
    })

# ===================== ROUTES PRODUITS =====================
@app.route('/api/produits', methods=['GET'])
def get_produits():
    categorie = request.args.get('categorie')
    search = request.args.get('search')
    limit = request.args.get('limit', type=int)
    
    query = Produit.query
    
    if categorie and categorie != 'all' and categorie != 'Tous':
        query = query.filter_by(categorie=categorie)
    
    if search:
        query = query.filter(Produit.nom.ilike(f'%{search}%'))
    
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
        'image_url': p.image_url
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
        'stock': produit.stock,
        'image_url': produit.image_url
    })

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

# ===================== ROUTES COMMANDES =====================
@app.route('/api/commandes', methods=['POST'])
@jwt_required()
def create_commande():
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if 'items' not in data or not data['items']:
        return jsonify({'message': 'La commande doit contenir des articles'}), 400
    if 'adresse_livraison' not in data:
        return jsonify({'message': 'Adresse de livraison requise'}), 400
    if 'methode_paiement' not in data:
        return jsonify({'message': 'Méthode de paiement requise'}), 400

    client = User.query.get(current_user_id)
    if not client:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404

    code_suivi = generer_code_suivi()

    sous_total = 0
    details_data = []

    for item in data['items']:
        produit = Produit.query.get(item['produit_id'])
        if not produit:
            return jsonify({'message': f'Produit avec ID {item["produit_id"]} non trouvé'}), 400
        
        if 'quantity' not in item:
            return jsonify({'message': 'Quantité manquante dans les articles'}), 400
            
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

    frais_livraison = data.get('frais_livraison', 0)
    reduction = data.get('reduction', 0)
    distance = data.get('distance', 0)
    delivery_option = data.get('delivery_option', 'asap')

    total_final = sous_total + frais_livraison - abs(reduction)

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

    for det in details_data:
        detail = CommandeDetail(
            commande_id=new_commande.id,
            produit_id=det['produit_id'],
            quantite=det['quantite'],
            prix_unitaire=det['prix_unitaire']
        )
        db.session.add(detail)

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

    admins = User.query.filter_by(role='admin').all()
    for admin in admins:
        send_push_notification(
            user_id=admin.id,
            title="Nouvelle commande !",
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
        'adresse': commande.adresse_livraison,
        'articles': [{
            'nom': d.produit.nom,
            'quantite': d.quantite,
            'prix': d.prix_unitaire
        } for d in commande.details]
    })

# ===================== ROUTES ADMIN =====================
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
        'role': u.role,
        'date_inscription': u.date_inscription.isoformat() if u.date_inscription else None
    } for u in users]), 200

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
            'client': {'nom': c.client.nom or 'Client', 'telephone': c.client.telephone},
            'date': c.date_commande.isoformat() if c.date_commande else None,
            'total': c.total,
            'statut': c.statut,
            'statut_paiement': paiement.statut if paiement else 'non_defini',
            'adresse': c.adresse_livraison,
            'articles': [{'nom': d.produit.nom, 'quantite': d.quantite} for d in c.details]
        })
    
    return jsonify(result)

# ===================== ROUTES ADMIN STATS =====================
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
    }), 200

# ===================== ROUTES ADMIN LIVREURS =====================
# GET /api/admin/livreurs - Liste tous les livreurs
@app.route('/api/admin/livreurs', methods=['GET'])
@jwt_required()
def get_all_livreurs():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    livreurs = User.query.filter_by(role='livreur').all()
    
    result = []
    for l in livreurs:
        # Vérifier si le livreur est occupé
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
            'date_inscription': l.date_inscription.isoformat() if l.date_inscription else None
        })
    
    return jsonify(result), 200


# GET /api/admin/livreurs-disponibles - Liste des livreurs disponibles
@app.route('/api/admin/livreurs-disponibles', methods=['GET'])
@jwt_required()
def get_livreurs_disponibles():
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    livreurs = User.query.filter_by(role='livreur').all()
    
    result = []
    for l in livreurs:
        commande_active = Commande.query.filter(
            Commande.livreur_id == l.id,
            Commande.statut.in_(['preparation', 'livraison'])
        ).first()
        
        if not commande_active:
            result.append({
                'id': l.id,
                'nom': l.nom or 'Livreur',
                'telephone': l.telephone,
                'note': 4.8,
                'livraisons_aujourdhui': 0
            })
    
    return jsonify(result), 200

# GET /api/admin/commandes-en-attente-livreur - Commandes en attente de livreur
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
        recherche_livreur=True
    ).order_by(Commande.date_recherche.desc()).all()
    
    result = []
    for c in commandes:
        result.append({
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
            'gain_livreur': c.frais_livraison * 0.6
        })
    
    return jsonify(result), 200

# POST /api/admin/commandes/<commande_id>/rechercher-livreur - Lancer la recherche de livreur
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
    notifications_envoyees = 0
    
    for livreur in livreurs:
        commande_active = Commande.query.filter(
            Commande.livreur_id == livreur.id,
            Commande.statut.in_(['preparation', 'livraison'])
        ).first()
        
        if not commande_active:
            gain = commande.frais_livraison * 0.6
            
            success = send_push_notification(
                user_id=livreur.id,
                title="🚚 Nouvelle livraison disponible",
                body=f"Commande {commande.code_suivi} - Gain: {gain:.0f} FCFA",
                data={
                    'type': 'livreur_order_available',
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
    
    print(f"📨 {notifications_envoyees} notification(s) envoyée(s)")
    
    return jsonify({
        'message': 'Recherche de livreur lancée',
        'notifications_envoyees': notifications_envoyees,
        'livreurs_disponibles': notifications_envoyees
    }), 200

# POST /api/admin/commandes/<commande_id>/assigner-livreur - Assigner un livreur à une commande
@app.route('/api/admin/commandes/<int:commande_id>/assigner-livreur', methods=['POST'])
@jwt_required()
def assigner_livreur(commande_id):
    current_user_id = get_jwt_identity()
    admin = User.query.get(current_user_id)
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    data = request.get_json()
    livreur_id = data.get('livreur_id')
    
    if not livreur_id:
        return jsonify({'message': 'ID livreur requis'}), 400
    
    commande = Commande.query.get_or_404(commande_id)
    livreur = User.query.get_or_404(livreur_id)
    
    if livreur.role != 'livreur':
        return jsonify({'message': 'L\'utilisateur n\'est pas un livreur'}), 400
    
    if commande.livreur_id:
        return jsonify({'message': 'Cette commande a déjà un livreur assigné'}), 400
    
    commande.livreur_id = livreur_id
    commande.recherche_livreur = False
    db.session.commit()
    
    gain = commande.frais_livraison * 0.6
    
    # Notifier le livreur
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

# GET /api/admin/livreurs/<livreur_id> - Détails d'un livreur
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
    }), 200

# GET /api/admin/livreurs/<livreur_id>/commandes - Commandes d'un livreur
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
            'date_commande': cmd.date_commande.isoformat() if cmd.date_commande else None,
            'client': {
                'nom': cmd.client.nom,
                'telephone': cmd.client.telephone
            }
        })
    
    return jsonify(result), 200

# GET /api/admin/livreurs-en-attente - Livreurs en attente de validation
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
    } for l in livreurs]), 200

# PUT /api/admin/livreurs/<livreur_id>/valider - Valider un livreur
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
# ===================== ROUTES ADMIN STATS DÉTAILLÉES =====================
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
            if detail.produit:
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
    
    # Commandes par jour
    commandes_par_jour = []
    for i in range(7):
        jour = (maintenant - timedelta(days=6-i)).date()
        count = sum(1 for c in commandes if c.date_commande and c.date_commande.date() == jour)
        commandes_par_jour.append({'jour': jour.strftime('%a')[:3], 'count': count})
    
    max_commandes = max([c['count'] for c in commandes_par_jour]) if commandes_par_jour else 10
    
    # Top 5 produits
    top_5 = sorted(top_produits.values(), key=lambda x: x['total'], reverse=True)[:5]
    
    # Livraisons
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
    
    # Ventes par catégorie formatée
    categories_list = [
        {'nom': cat, 'total': ventes_par_categorie.get(cat, 0)} 
        for cat in ['Ingrédients', 'Boissons', 'Poissons']
    ]
    
    return jsonify({
        'total_commandes': total_commandes,
        'nouveaux_clients': nouveaux_clients,
        'produits_vendus': produits_vendus,
        'chiffre_affaires': chiffre_affaires,
        'commandes_par_jour': commandes_par_jour,
        'max_commandes': max_commandes,
        'ventes_par_categorie': categories_list,
        'total_articles': produits_vendus or 1,
        'top_produits': top_5,
        'livraisons': {
            'moyenne': temps_moyen,
            'distance_moyenne': distance_moyenne,
            'frais_moyens': round(frais_moyens, 2),
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
    }), 200

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
        'adresse': commande.adresse_livraison,
        'paiement': {
            'id': paiement.id if paiement else None,
            'statut': paiement.statut if paiement else 'non_defini',
            'methode': paiement.methode if paiement else None,
            'montant': paiement.montant if paiement else None
        },
        'articles': [{
            'nom': d.produit.nom,
            'quantite': d.quantite,
            'prix': d.prix_unitaire
        } for d in commande.details]
    })

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
    
    if not admin or admin.role != 'admin':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    data = request.get_json()
    paiement = Paiement.query.get_or_404(paiement_id)
    
    paiement.statut = 'valide'
    paiement.date_validation = datetime.now(timezone.utc)
    paiement.valide_par = current_user_id
    if data and data.get('numero_transaction'):
        paiement.numero_transaction = data['numero_transaction']
    
    commande = paiement.commande
    commande.statut = 'preparation'
    commande.statut_paiement = 'valide'
    
    for detail in commande.details:
        produit = Produit.query.get(detail.produit_id)
        produit.stock -= detail.quantite
    
    db.session.commit()
    
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

# ===================== ROUTES ADMIN - MISE À JOUR STATUT =====================
@app.route('/api/commandes/<int:commande_id>/statut', methods=['PUT'])
@jwt_required()
def update_commande_statut(commande_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    commande = Commande.query.get_or_404(commande_id)
    
    if user.role != 'admin' and commande.livreur_id != current_user_id:
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    data = request.get_json()
    if 'statut' not in data:
        return jsonify({'message': 'Statut requis'}), 400
    
    nouveau_statut = data['statut']
    ancien_statut = commande.statut
    
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
        'code_suivi': commande.code_suivi,
        'statut': commande.statut,
        'date_livraison': commande.date_livraison.isoformat() if commande.date_livraison else None
    }), 200

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

@app.route('/api/livreur/mes-livraisons', methods=['GET'])
@jwt_required()
def livreur_mes_livraisons():
    current_user_id = get_jwt_identity()
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

# ===================== ROUTES LIVREUR - ACCEPTER LIVRAISON =====================
# ===================== ROUTES LIVREUR - ACCEPTER LIVRAISON (CORRIGÉE) =====================
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
    
    # 🔍 LOGS POUR DÉBOGUER
    print(f"🔍 Tentative d'acceptation par livreur ID: {current_user_id}")
    print(f"📦 Commande ID: {commande_id}, Code: {commande.code_suivi}")
    print(f"📦 Livreur actuel: {commande.livreur_id}, Statut: {commande.statut}")
    
    # Vérifier que la commande n'a pas déjà de livreur
    if commande.livreur_id is not None and commande.livreur_id > 0:
        return jsonify({'message': 'Cette commande a déjà un livreur'}), 400
    
    # Vérifier que la commande est disponible
    if commande.statut != 'preparation':
        return jsonify({'message': 'Cette commande n\'est pas disponible'}), 400
    
    # ✅ ASSIGNER LE LIVREUR À LA COMMANDE
    commande.livreur_id = current_user_id
    db.session.commit()
    
    # 🔍 VÉRIFICATION APRÈS SAUVEGARDE
    print(f"✅ Après sauvegarde - livreur_id: {commande.livreur_id}")
    
    return jsonify({
        'message': 'Livraison acceptée avec succès',
        'commande_id': commande.id,
        'code_suivi': commande.code_suivi,
        'livreur_id': current_user_id
    }), 200
# ===================== ROUTES LIVREUR - MISE À JOUR STATUT =====================
@app.route('/api/livreur/commandes/<int:commande_id>/statut', methods=['PUT'])
@jwt_required()
def livreur_update_statut(commande_id):
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commande = Commande.query.get_or_404(commande_id)
    
    # Vérifier que le livreur est bien assigné à cette commande
    print(f"🔍 Vérification - Livreur ID: {current_user_id}, Commande livreur_id: {commande.livreur_id}")
    
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
    
    print(f"✅ Statut mis à jour: commande {commande.code_suivi} - {ancien_statut} -> {nouveau_statut}")
    
    return jsonify({
        'message': 'Statut mis à jour avec succès',
        'commande_id': commande.id,
        'code_suivi': commande.code_suivi,
        'nouveau_statut': commande.statut
    }), 200


# ===================== ROUTE DE TEST - VÉRIFIER LA COMMANDE =====================
@app.route('/api/debug/commande/<int:commande_id>/livreur', methods=['GET'])
@jwt_required()
def debug_commande_livreur(commande_id):
    current_user_id = get_jwt_identity()
    commande = Commande.query.get_or_404(commande_id)
    
    return jsonify({
        'commande_id': commande.id,
        'code_suivi': commande.code_suivi,
        'statut': commande.statut,
        'livreur_id': commande.livreur_id,
        'current_user_id': int(current_user_id),
        'est_assigne': commande.livreur_id == int(current_user_id)
    }), 200

    
@app.route('/api/livreur/stats', methods=['GET'])
@jwt_required()
def livreur_stats():
    current_user_id = get_jwt_identity()
    livreur = User.query.get(current_user_id)
    
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    total_livraisons = Commande.query.filter_by(livreur_id=current_user_id).count()
    
    commandes = Commande.query.filter_by(livreur_id=current_user_id).all()
    gains_total = sum(c.frais_livraison * 0.6 for c in commandes if c.frais_livraison)
    
    livraisons_aujourdhui = Commande.query.filter(
        Commande.livreur_id == current_user_id,
        Commande.date_commande >= datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    ).count()
    
    return jsonify({
        'total_livraisons': total_livraisons,
        'livraisons_aujourdhui': livraisons_aujourdhui,
        'gains_total': gains_total,
        'note_moyenne': 4.8
    }), 200

# ===================== ROUTES LIVREUR - DÉTAILS COMMANDE =====================
@app.route('/api/livreur/commandes/<int:commande_id>', methods=['GET'])
@jwt_required()
def livreur_detail_commande(commande_id):
    current_user_id = get_jwt_identity()
    
    try:
        current_user_id = int(current_user_id)
    except (ValueError, TypeError):
        return jsonify({'message': 'ID utilisateur invalide'}), 400
    
    livreur = User.query.get(current_user_id)
    if not livreur or livreur.role != 'livreur':
        return jsonify({'message': 'Accès non autorisé'}), 403
    
    commande = Commande.query.get_or_404(commande_id)
    
    # Vérifier que le livreur a le droit de voir cette commande
    if commande.livreur_id != current_user_id:
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
        'date_commande': commande.date_commande.isoformat() if commande.date_commande else None
    }), 200

# ===================== ROUTES ADRESSES =====================
@app.route('/api/client/adresses', methods=['GET'])
@jwt_required()
def get_client_adresses():
    try:
        current_user_id = get_jwt_identity()
        adresses = Adresse.query.filter_by(user_id=current_user_id).order_by(Adresse.est_principale.desc(), Adresse.created_at.desc()).all()
        
        return jsonify([{
            'id': a.id,
            'nom': a.nom,
            'adresse': a.adresse,
            'telephone': a.telephone,
            'est_principale': a.est_principale,
            'created_at': a.created_at.isoformat() if a.created_at else None
        } for a in adresses]), 200
    except Exception as e:
        return jsonify({'message': 'Erreur serveur'}), 500

@app.route('/api/client/adresses', methods=['POST'])
@jwt_required()
def create_client_adresse():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data.get('nom') or not data.get('adresse') or not data.get('telephone'):
            return jsonify({'message': 'Tous les champs sont requis'}), 400
        
        if data.get('est_principale'):
            Adresse.query.filter_by(user_id=current_user_id, est_principale=True).update({'est_principale': False})
        
        nouvelle_adresse = Adresse(
            user_id=current_user_id,
            nom=data['nom'],
            adresse=data['adresse'],
            telephone=data['telephone'],
            est_principale=data.get('est_principale', False)
        )
        
        db.session.add(nouvelle_adresse)
        db.session.commit()
        
        return jsonify({'message': 'Adresse créée avec succès'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur serveur'}), 500

@app.route('/api/client/adresses/<int:adresse_id>', methods=['PUT'])
@jwt_required()
def update_client_adresse(adresse_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        adresse = Adresse.query.filter_by(id=adresse_id, user_id=current_user_id).first()
        if not adresse:
            return jsonify({'message': 'Adresse non trouvée'}), 404
        
        if data.get('est_principale') and not adresse.est_principale:
            Adresse.query.filter_by(user_id=current_user_id, est_principale=True).update({'est_principale': False})
        
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
        return jsonify({'message': 'Erreur serveur'}), 500

@app.route('/api/client/adresses/<int:adresse_id>', methods=['DELETE'])
@jwt_required()
def delete_client_adresse(adresse_id):
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
        return jsonify({'message': 'Erreur serveur'}), 500

# ===================== ROUTES WISHLIST =====================
@app.route('/api/client/wishlist', methods=['GET'])
@jwt_required()
def get_wishlist():
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
        return jsonify({'message': 'Erreur serveur'}), 500

@app.route('/api/client/wishlist', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        produit_id = data.get('produit_id')
        
        if not produit_id:
            return jsonify({'message': 'ID produit requis'}), 400
        
        existing = Wishlist.query.filter_by(user_id=current_user_id, produit_id=produit_id).first()
        if existing:
            return jsonify({'message': 'Produit déjà dans la liste'}), 400
        
        produit = Produit.query.get(produit_id)
        if not produit:
            return jsonify({'message': 'Produit non trouvé'}), 404
        
        wishlist_item = Wishlist(user_id=current_user_id, produit_id=produit_id)
        db.session.add(wishlist_item)
        db.session.commit()
        
        return jsonify({'message': 'Produit ajouté à la liste de souhaits'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur serveur'}), 500

@app.route('/api/client/wishlist/<int:wishlist_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(wishlist_id):
    try:
        current_user_id = get_jwt_identity()
        wishlist_item = Wishlist.query.filter_by(id=wishlist_id, user_id=current_user_id).first()
        
        if not wishlist_item:
            return jsonify({'message': 'Élément non trouvé'}), 404
        
        db.session.delete(wishlist_item)
        db.session.commit()
        return jsonify({'message': 'Produit retiré de la liste'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur serveur'}), 500

# ===================== ROUTES SUPPORT =====================
@app.route('/api/client/support', methods=['POST'])
@jwt_required()
def envoyer_demande_support():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        sujet = data.get('sujet')
        message = data.get('message')
        
        if not sujet or not message:
            return jsonify({'message': 'Sujet et message requis'}), 400
        
        user = User.query.get(current_user_id)
        logger.info(f"Demande support - User: {user.telephone}, Sujet: {sujet}")
        
        return jsonify({
            'message': 'Demande envoyée avec succès',
            'ticket_id': f"SUP-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        }), 200
    except Exception as e:
        return jsonify({'message': 'Erreur serveur'}), 500

# ===================== ROUTES STATISTIQUES =====================
@app.route('/api/client/statistiques', methods=['GET'])
@jwt_required()
def get_statistiques_achat():
    try:
        current_user_id = get_jwt_identity()
        commandes = Commande.query.filter_by(client_id=current_user_id).all()
        
        if not commandes:
            return jsonify({
                'total_commandes': 0,
                'total_depense': 0,
                'moyenne_commande': 0,
                'points_fidelite': 0
            }), 200
        
        total_depense = sum(c.total for c in commandes)
        points_fidelite = int(total_depense / 1000)
        
        return jsonify({
            'total_commandes': len(commandes),
            'total_depense': total_depense,
            'moyenne_commande': total_depense / len(commandes),
            'points_fidelite': points_fidelite
        }), 200
    except Exception as e:
        return jsonify({'message': 'Erreur serveur'}), 500

# ===================== ROUTES MOT DE PASSE OUBLIÉ =====================
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    telephone = data.get('telephone')
    
    if not telephone:
        return jsonify({'message': 'Numéro de téléphone requis'}), 400
    
    user = User.query.filter_by(telephone=telephone).first()
    if not user:
        return jsonify({'message': 'Aucun compte trouvé avec ce numéro'}), 404
    
    code = generate_reset_code()
    
    reset_code = ResetCode(
        telephone=telephone,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15)
    )
    
    ResetCode.query.filter_by(telephone=telephone).delete()
    db.session.add(reset_code)
    db.session.commit()
    
    logger.info(f"Code de réinitialisation pour {telephone}: {code}")
    
    return jsonify({'message': 'Code envoyé avec succès', 'debug_code': code}), 200

@app.route('/api/verify-reset-code', methods=['POST'])
def verify_reset_code():
    data = request.get_json()
    telephone = data.get('telephone')
    code = data.get('code')
    
    if not telephone or not code:
        return jsonify({'message': 'Téléphone et code requis'}), 400
    
    reset_code = ResetCode.query.filter_by(telephone=telephone, code=code, used=False).first()
    
    if not reset_code:
        return jsonify({'message': 'Code invalide'}), 400
    
    if reset_code.expires_at < datetime.now(timezone.utc):
        return jsonify({'message': 'Code expiré'}), 400
    
    return jsonify({'message': 'Code valide'}), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    telephone = data.get('telephone')
    code = data.get('code')
    new_password = data.get('new_password')
    
    if not telephone or not code or not new_password:
        return jsonify({'message': 'Tous les champs sont requis'}), 400
    
    reset_code = ResetCode.query.filter_by(telephone=telephone, code=code, used=False).first()
    
    if not reset_code or reset_code.expires_at < datetime.now(timezone.utc):
        return jsonify({'message': 'Code invalide ou expiré'}), 400
    
    if len(new_password) < 4:
        return jsonify({'message': 'Le mot de passe doit contenir au moins 4 caractères'}), 400
    
    user = User.query.filter_by(telephone=telephone).first()
    if not user:
        return jsonify({'message': 'Utilisateur non trouvé'}), 404
    
    user.mot_de_passe = bcrypt.generate_password_hash(new_password).decode('utf-8')
    reset_code.used = True
    db.session.commit()
    
    return jsonify({'message': 'Mot de passe réinitialisé avec succès'}), 200

# ===================== ROUTES ADMIN PRODUITS =====================
@app.route('/api/admin/produits', methods=['GET'])
@jwt_required()
def admin_get_produits():
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
            'image_url': p.image_url
        } for p in produits]), 200
    except Exception as e:
        return jsonify({'message': 'Erreur serveur'}), 500

@app.route('/api/admin/produits', methods=['POST'])
@jwt_required()
def create_produit():
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        data = request.get_json()
        
        if not data.get('nom') or not data.get('prix'):
            return jsonify({'message': 'Nom et prix requis'}), 400
        
        nouveau_produit = Produit(
            nom=data['nom'],
            description=data.get('description', ''),
            prix=float(data['prix']),
            categorie=data.get('categorie', 'Ingrédients'),
            stock=int(data.get('stock', 0)),
            image_url=data.get('image_url')
        )
        
        db.session.add(nouveau_produit)
        db.session.commit()
        
        return jsonify({'message': 'Produit créé avec succès'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur serveur'}), 500

@app.route('/api/admin/produits/<int:produit_id>', methods=['PUT'])
@jwt_required()
def update_produit(produit_id):
    try:
        current_user_id = get_jwt_identity()
        admin = User.query.get(current_user_id)
        
        if not admin or admin.role != 'admin':
            return jsonify({'message': 'Accès non autorisé'}), 403
        
        produit = Produit.query.get_or_404(produit_id)
        data = request.get_json()
        
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
        return jsonify({'message': 'Produit modifié avec succès'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Erreur serveur'}), 500

# ===================== CRÉATION DES TABLES =====================
with app.app_context():
    try:
        db.create_all()
        logger.info("Tables créées avec succès")
        
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
            logger.info("Admin par défaut créé: 771234567 / admin123")
    except Exception as e:
        logger.error(f"Erreur création tables: {e}")

# ===================== LANCEMENT =====================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)