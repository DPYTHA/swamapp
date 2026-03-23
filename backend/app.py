
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

# Continue pour tous les imports...

#--------------------------------------------------------------------

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
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

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialisation de l'application
app = Flask(__name__)
CORS(app, origins=['*'], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['*'])

# Charger les variables d'environnement
load_dotenv()

# Configuration
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-dev-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://localhost/swami')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET')
    CLOUDINARY_UPLOAD_PRESET = os.getenv('CLOUDINARY_UPLOAD_PRESET', 'swam_products')

# Utilisation
app.config['SECRET_KEY'] = Config.SECRET_KEY
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
app.config['SQLALCHEMY_DATABASE_URI'] = Config.SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = Config.SQLALCHEMY_TRACK_MODIFICATIONS
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
    date_ajout = db.Column(db.DateTime, default=datetime.utcnow)
    
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
    date_paiement = db.Column(db.DateTime, default=datetime.utcnow)
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Adresse(db.Model):
    __tablename__ = 'adresses'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    nom = db.Column(db.String(100), nullable=False)
    adresse = db.Column(db.Text, nullable=False)
    telephone = db.Column(db.String(20), nullable=False)
    est_principale = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('adresses', lazy=True, cascade='all, delete-orphan'))

class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    produit_id = db.Column(db.Integer, db.ForeignKey('produits.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
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

# ===================== ROUTES HEALTH =====================
@app.route('/')
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'SWAM API is running',
        'timestamp': datetime.utcnow().isoformat(),
        'database': bool(os.getenv('DATABASE_URL'))
    })

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
            'ticket_id': f"SUP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
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
        expires_at=datetime.utcnow() + timedelta(minutes=15)
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
    
    if reset_code.expires_at < datetime.utcnow():
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
    
    if not reset_code or reset_code.expires_at < datetime.utcnow():
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
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=8080)