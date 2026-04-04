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

// ✅ TOUTES LES CATÉGORIES DISPONIBLES
const ALL_CATEGORIES = [
    { id: 'Ingrédients', label: 'Ingrédients', icon: 'restaurant', color: '#FF6B6B' },
    { id: 'Boissons', label: 'Boissons', icon: 'local-drink', color: '#4ECDC4' },
    { id: 'Poissons', label: 'Poissons', icon: 'set-meal', color: '#FFE66D' },
    { id: 'Viandes', label: 'Viandes', icon: 'set-meal', color: '#FF8C42' },
    { id: 'Légumes', label: 'Légumes', icon: 'grass', color: '#6B8E23' },
    { id: 'Fruits', label: 'Fruits', icon: 'apple', color: '#E84342' },
    { id: 'Épices', label: 'Épices', icon: 'local-florist', color: '#8B4513' },
    { id: 'Sauces', label: 'Sauces', icon: 'local-dining', color: '#9C27B0' },
    { id: 'Pâtisserie', label: 'Pâtisserie', icon: 'cake', color: '#FF99C8' },
    { id: 'Produits laitiers', label: 'Produits laitiers', icon: 'egg', color: '#FDFFB6' },
    { id: 'Céréales', label: 'Céréales', icon: 'grain', color: '#D4A373' },
    { id: 'Conserves', label: 'Conserves', icon: 'inventory', color: '#A7C7E7' },
    { id: 'Surgelés', label: 'Surgelés', icon: 'ac-unit', color: '#00CED1' },
    { id: 'Bio', label: 'Bio', icon: 'eco', color: '#2E8B57' },
    { id: 'Halal', label: 'Halal', icon: 'mosque', color: '#006400' },
    { id: 'Produits du terroir', label: 'Produits du terroir', icon: 'terrain', color: '#CD853F' },
];

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

    const selectImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission refusée', 'Nous avons besoin d\'accéder à vos photos pour ajouter des images.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: false,
            });

            console.log('📱 Résultat:', result);

            if (!result.canceled && result.assets && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
                console.log('✅ Image sélectionnée:', result.assets[0].uri);
            }
        } catch (error) {
            console.log('❌ Erreur:', error);
            Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
        }
    };

    const uploadImageToCloudinary = async (imageUri) => {
        try {
            const formData = new FormData();

            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: `product_${Date.now()}.jpg`,
            });

            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
            formData.append('folder', 'swam/products');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, url: data.secure_url };
            } else {
                return { success: false, error: data.error?.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const handleUploadImage = async () => {
        if (!selectedImage) return null;

        setUploading(true);
        try {
            const result = await uploadImageToCloudinary(selectedImage);

            if (result.success) {
                setFormData(prev => ({ ...prev, image_url: result.url }));
                Alert.alert('Succès', 'Image uploadée avec succès');
                return result.url;
            } else {
                Alert.alert('Erreur', "Impossible d'uploader l'image");
                return null;
            }
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'uploader l'image");
            return null;
        } finally {
            setUploading(false);
        }
    };

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

    const handleSave = async () => {
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
            let imageUrl = formData.image_url;
            if (selectedImage) {
                const uploadResult = await handleUploadImage();
                if (uploadResult) {
                    imageUrl = uploadResult;
                }
            }

            const productData = {
                ...formData,
                prix: parseFloat(formData.prix),
                stock: parseInt(formData.stock) || 0,
                image_url: imageUrl,
            };

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

    const displayImage = selectedImage || formData.image_url;

    return (
        <View style={styles.container}>
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
                                    <Text style={styles.uploadText}>Upload...</Text>
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

                {formData.image_url && !selectedImage && !uploading && (
                    <Text style={styles.infoText}>Image actuelle: ✓</Text>
                )}

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
                            {ALL_CATEGORIES.map(cat => (
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
         paddingTop:50,
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
        justifyContent: 'space-between',
    },
    categoryChip: {
        width: '48%',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginBottom: 10,
        alignItems: 'center',
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