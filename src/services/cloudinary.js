import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

// Configuration Cloudinary
const CLOUDINARY_CLOUD_NAME = 'dowbp5hh5';
const CLOUDINARY_UPLOAD_PRESET = 'swam_products';

export default function AddEditProductScreen({ navigation, route }) {
    const product = route.params?.product;
    const isEditing = !!product;

    const [formData, setFormData] = useState({
        nom: product?.nom || '',
        description: product?.description || '',
        prix: product?.prix ? product.prix.toString() : '',
        categorie: product?.categorie || 'Ingrédients',
        stock: product?.stock ? product.stock.toString() : '0',
        image_url: product?.image_url || '',
    });

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const categories = [
        { id: 'Ingrédients', label: 'Ingrédients' },
        { id: 'Boissons', label: 'Boissons' },
        { id: 'Poissons', label: 'Poissons' },
    ];

    // ✅ NOUVELLE FONCTION selectImage (sans dépréciation)
    const selectImage = async () => {
        try {
            // 1. Demander la permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos pour ajouter des images.');
                return;
            }

            // 2. Lancer la sélection d'image (NOUVELLE SYNTAXE)
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // ✅ Nouvelle syntaxe
                allowsEditing: true,
                quality: 0.8,
                base64: false,
            });

            console.log('📱 Résultat:', result);

            if (!result.canceled && result.assets && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
                console.log('✅ Image sélectionnée:', result.assets[0].uri);

                // Upload automatique après sélection
                await handleUploadImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log('❌ Erreur:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
        }
    };

    // ✅ Fonction pour uploader l'image vers Cloudinary (améliorée)
    const uploadImageToCloudinary = async (imageUri) => {
        console.log('🚀 ===== DÉBUT UPLOAD =====');
        console.log('📸 URI:', imageUri);

        try {
            // Vérifier que l'URI existe
            if (!imageUri) {
                console.log('❌ URI vide');
                return { success: false, error: 'URI vide' };
            }

            // Créer le FormData
            const formData = new FormData();

            // Créer l'objet fichier
            const fileObject = {
                uri: imageUri,
                type: 'image/jpeg',
                name: `product_${Date.now()}.jpg`,
            };
            console.log('📁 Objet fichier:', fileObject);

            formData.append('file', fileObject);
            formData.append('upload_preset', 'swam_products');
            formData.append('cloud_name', 'dowbp5hh5');
            formData.append('folder', 'swam/products');

            // Afficher le contenu du FormData (impossible directement, mais on peut voir les clés)
            console.log('📦 FormData créé avec les champs:', [
                'file', 'upload_preset', 'cloud_name', 'folder'
            ]);

            const url = `https://api.cloudinary.com/v1_1/dowbp5hh5/image/upload`;
            console.log('🌐 URL:', url);

            console.log('📤 Envoi de la requête...');

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            console.log('📥 Statut HTTP:', response.status);
            console.log('📥 Headers:', response.headers);

            const responseText = await response.text();
            console.log('📥 Réponse brute:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.log('❌ La réponse n\'est pas du JSON valide');
                return { success: false, error: 'Réponse invalide du serveur' };
            }

            if (response.ok) {
                console.log('✅ Upload réussi!');
                console.log('🔗 URL:', data.secure_url);
                console.log('🆔 Public ID:', data.public_id);
                return { success: true, url: data.secure_url, publicId: data.public_id };
            } else {
                console.log('❌ Erreur Cloudinary:', data);
                return { success: false, error: data.error?.message || 'Erreur inconnue' };
            }
        } catch (error) {
            console.log('❌ Exception:', error);
            console.log('❌ Stack:', error.stack);
            return { success: false, error: error.message };
        } finally {
            console.log('🏁 ===== FIN UPLOAD =====');
        }
    };
    // ✅ Upload l'image sélectionnée (avec gestion de progression simulée)
    const handleUploadImage = async (uri) => {
        if (!uri) return null;

        setUploading(true);
        setUploadProgress(0);

        // Simuler une progression
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 300);

        try {
            const result = await uploadImageToCloudinary(uri);

            clearInterval(interval);

            if (result.success) {
                setUploadProgress(100);
                setFormData(prev => ({ ...prev, image_url: result.url }));
                Alert.alert('Succès', 'Image uploadée avec succès');
                return result.url;
            } else {
                setUploadProgress(0);
                Alert.alert('Erreur', result.error || "Impossible d'uploader l'image");
                return null;
            }
        } catch (error) {
            setUploadProgress(0);
            Alert.alert('Erreur', "Impossible d'uploader l'image");
            return null;
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };

    // ✅ Supprimer l'image sélectionnée
    const removeSelectedImage = () => {
        Alert.alert(
            'Supprimer',
            'Voulez-vous supprimer cette image ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    onPress: () => {
                        setSelectedImage(null);
                        setFormData(prev => ({ ...prev, image_url: '' }));
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    // ✅ Sauvegarder le produit
    const handleSave = async () => {
        // Validation
        if (!formData.nom.trim()) {
            Alert.alert('Erreur', 'Le nom du produit est requis');
            return;
        }
        if (!formData.prix || parseFloat(formData.prix) <= 0) {
            Alert.alert('Erreur', 'Le prix doit être supérieur à 0');
            return;
        }

        setLoading(true);
        try {
            const productData = {
                ...formData,
                prix: parseFloat(formData.prix),
                stock: parseInt(formData.stock) || 0,
                image_url: formData.image_url,
            };

            console.log('📤 Enregistrement produit:', productData);

            if (isEditing) {
                await api.put(`/admin/produits/${product.id}`, productData);
                Alert.alert('Succès', 'Produit modifié avec succès');
            } else {
                await api.post('/admin/produits', productData);
                Alert.alert('Succès', 'Produit ajouté avec succès');
            }
            navigation.goBack();
        } catch (error) {
            console.log('❌ Erreur sauvegarde:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de sauvegarder le produit');
        } finally {
            setLoading(false);
        }
    };

    // Afficher l'image (sélectionnée ou existante)
    const displayImage = selectedImage || formData.image_url;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
                </Text>
                <TouchableOpacity onPress={handleSave} disabled={loading || uploading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Icon name="save" size={24} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Zone d'image cliquable */}
                <TouchableOpacity
                    style={styles.imageContainer}
                    onPress={selectImage}
                    disabled={uploading}
                >
                    {displayImage ? (
                        <View style={styles.imageWrapper}>
                            <Image source={{ uri: displayImage }} style={styles.image} />
                            {!uploading && (
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={removeSelectedImage}
                                >
                                    <Icon name="close" size={20} color="#fff" />
                                </TouchableOpacity>
                            )}
                            {uploading && (
                                <View style={styles.uploadOverlay}>
                                    <ActivityIndicator size="large" color="#FF6B6B" />
                                    <Text style={styles.uploadText}>
                                        Upload... {uploadProgress}%
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Icon name="add-photo-alternate" size={40} color="#999" />
                            <Text style={styles.imageText}>Ajouter une image</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Message d'information */}
                {formData.image_url && !selectedImage && !uploading && (
                    <Text style={styles.infoText}>
                        Image actuelle: ✓
                    </Text>
                )}

                {/* Formulaire */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nom du produit *</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.nom}
                            onChangeText={(text) => setFormData({ ...formData, nom: text })}
                            placeholder="Ex: Riz parfumé"
                            placeholderTextColor="#999"
                            editable={!loading && !uploading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            placeholder="Description du produit..."
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={4}
                            editable={!loading && !uploading}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                            <Text style={styles.label}>Prix (FCFA) *</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.prix}
                                onChangeText={(text) => setFormData({ ...formData, prix: text })}
                                placeholder="3500"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                editable={!loading && !uploading}
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Stock</Text>
                            <TextInput
                                style={styles.input}
                                value={formData.stock}
                                onChangeText={(text) => setFormData({ ...formData, stock: text })}
                                placeholder="50"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                                editable={!loading && !uploading}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Catégorie</Text>
                        <View style={styles.categoriesContainer}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.categoryChip,
                                        formData.categorie === cat.id && styles.categoryChipActive
                                    ]}
                                    onPress={() => setFormData({ ...formData, categorie: cat.id })}
                                    disabled={loading || uploading}
                                >
                                    <Text style={[
                                        styles.categoryText,
                                        formData.categorie === cat.id && styles.categoryTextActive
                                    ]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        padding: 20,
        alignItems: 'center',
    },
    imageWrapper: {
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    imageText: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
    },
    removeButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 15,
        padding: 5,
    },
    uploadOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    uploadText: {
        fontSize: 14,
        color: '#FF6B6B',
        marginTop: 5,
        fontWeight: '500',
    },
    infoText: {
        fontSize: 12,
        color: '#4CAF50',
        textAlign: 'center',
        marginTop: -10,
        marginBottom: 10,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 10,
        marginBottom: 10,
    },
    categoryChipActive: {
        backgroundColor: '#FF6B6B',
    },
    categoryText: {
        fontSize: 13,
        color: '#666',
    },
    categoryTextActive: {
        color: '#fff',
    },
});