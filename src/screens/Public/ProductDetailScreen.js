import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ navigation, route }) {
    const { productId } = route.params;
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    const { addToCart } = useCart();

    useEffect(() => {
        loadProductDetails();
    }, [productId]);

    const loadProductDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/produits/${productId}`);
            setProduct(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement produit:', error);
            Alert.alert(
                'Erreur',
                'Impossible de charger les détails du produit',
                [
                    { text: 'Retour', onPress: () => navigation.goBack() }
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
        Alert.alert(
            '✅ Ajouté au panier',
            `${product.nom} (x${quantity}) a été ajouté`,
            [
                { text: 'Continuer', style: 'cancel' },
                { text: 'Voir le panier', onPress: () => navigation.navigate('Panier') } // ✅ "Panier" avec P majuscule
            ]
        );
    };

    const handleBuyNow = () => {
        addToCart(product, quantity);
        navigation.navigate('Panier'); // ✅ "Panier" avec P majuscule
    };



    const incrementQuantity = () => {
        if (quantity < (product?.stock || 10)) {
            setQuantity(prev => prev + 1);
        } else {
            Alert.alert('Stock limité', `Désolé, seulement ${product?.stock} disponibles`);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement du produit...</Text>
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="error-outline" size={60} color="#FF6B6B" />
                <Text style={styles.errorTitle}>Produit non trouvé</Text>
                <TouchableOpacity
                    style={styles.errorButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.errorButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Images simulées (à remplacer par de vraies images multiples plus tard)
    const images = [
        product.image_url,
        product.image_url,
        product.image_url,
    ].filter(Boolean);

    return (
        <View style={styles.container}>
            {/* Header personnalisé */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Détail du produit</Text>
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Panier')}
                >
                    <Icon name="shopping-cart" size={24} color="#FF6B6B" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image principale */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: images[selectedImage] || 'https://via.placeholder.com/400' }}
                        style={styles.mainImage}
                        resizeMode="cover"
                    />

                    {/* Indicateur d'images multiples */}
                    {images.length > 1 && (
                        <View style={styles.imagePagination}>
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.paginationDot,
                                        selectedImage === index && styles.paginationDotActive
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Miniatures (si plusieurs images) */}
                {images.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.thumbnailContainer}
                    >
                        {images.map((img, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedImage(index)}
                                style={[
                                    styles.thumbnailWrapper,
                                    selectedImage === index && styles.thumbnailWrapperActive
                                ]}
                            >
                                <Image
                                    source={{ uri: img }}
                                    style={styles.thumbnailImage}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Informations produit */}
                <View style={styles.infoContainer}>
                    {/* Catégorie et stock */}
                    <View style={styles.metaRow}>
                        <View style={styles.categoryBadge}>
                            <Icon name="label" size={14} color="#FF6B6B" />
                            <Text style={styles.categoryText}>{product.categorie}</Text>
                        </View>
                        <View style={[
                            styles.stockBadge,
                            { backgroundColor: product.stock > 0 ? '#4CAF5020' : '#F4433620' }
                        ]}>
                            <Icon
                                name={product.stock > 0 ? 'check-circle' : 'error'}
                                size={14}
                                color={product.stock > 0 ? '#4CAF50' : '#F44336'}
                            />
                            <Text style={[
                                styles.stockText,
                                { color: product.stock > 0 ? '#4CAF50' : '#F44336' }
                            ]}>
                                {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                            </Text>
                        </View>
                    </View>

                    {/* Nom et prix */}
                    <Text style={styles.productName}>{product.nom}</Text>
                    <Text style={styles.productPrice}>
                        {product.prix?.toLocaleString()} F CFA
                    </Text>

                    {/* Note (simulée) */}
                    <View style={styles.ratingContainer}>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                    key={star}
                                    name="star"
                                    size={18}
                                    color={star <= 4 ? '#FFD700' : '#E0E0E0'}
                                />
                            ))}
                        </View>
                        <Text style={styles.ratingText}>(24 avis)</Text>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Text style={styles.description}>
                            {product.description || 'Aucune description disponible pour ce produit.'}
                        </Text>
                    </View>

                    {/* Sélecteur de quantité */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quantité</Text>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={decrementQuantity}
                                disabled={quantity <= 1}
                            >
                                <Icon
                                    name="remove"
                                    size={20}
                                    color={quantity <= 1 ? '#ccc' : '#FF6B6B'}
                                />
                            </TouchableOpacity>

                            <Text style={styles.quantityText}>{quantity}</Text>

                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={incrementQuantity}
                                disabled={quantity >= (product.stock || 10)}
                            >
                                <Icon
                                    name="add"
                                    size={20}
                                    color={quantity >= (product.stock || 10) ? '#ccc' : '#FF6B6B'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Informations supplémentaires */}
                    <View style={styles.infoGrid}>
                        <View style={styles.infoCard}>
                            <Icon name="local-shipping" size={24} color="#FF6B6B" />
                            <Text style={styles.infoCardTitle}>Livraison</Text>
                            <Text style={styles.infoCardText}>24h - 48h</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Icon name="verified" size={24} color="#4CAF50" />
                            <Text style={styles.infoCardTitle}>Qualité</Text>
                            <Text style={styles.infoCardText}>Produit frais</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Icon name="support-agent" size={24} color="#2196F3" />
                            <Text style={styles.infoCardTitle}>Support</Text>
                            <Text style={styles.infoCardText}>24/7</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom sheet avec actions */}
            <View style={styles.bottomSheet}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>
                        {(product.prix * quantity).toLocaleString()} F CFA
                    </Text>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={handleAddToCart}
                        disabled={product.stock === 0}
                    >
                        <Icon name="add-shopping-cart" size={20} color="#FF6B6B" />
                        <Text style={styles.addToCartText}>Ajouter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.buyNowButton}
                        onPress={handleBuyNow}
                        disabled={product.stock === 0}
                    >
                        <Text style={styles.buyNowText}>Acheter maintenant</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: 20,
    },
    errorButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 8,
    },
    errorButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cartButton: {
        padding: 8,
    },
    imageContainer: {
        width: '100%',
        height: width,
        backgroundColor: '#f5f5f5',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    imagePagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 15,
        alignSelf: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        marginHorizontal: 4,
        opacity: 0.5,
    },
    paginationDotActive: {
        opacity: 1,
        width: 20,
    },
    thumbnailContainer: {
        position: 'absolute',
        bottom: -30,
        left: 20,
        right: 0,
        height: 70,
    },
    thumbnailWrapper: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    thumbnailWrapperActive: {
        borderColor: '#FF6B6B',
    },
    thumbnailImage: {
        width: 56,
        height: 56,
        borderRadius: 6,
    },
    infoContainer: {
        padding: 20,
        marginTop: 40,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B6B20',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    categoryText: {
        fontSize: 12,
        color: '#FF6B6B',
        marginLeft: 4,
        fontWeight: '500',
    },
    stockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    stockText: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '500',
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 15,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    stars: {
        flexDirection: 'row',
        marginRight: 10,
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 20,
        minWidth: 40,
        textAlign: 'center',
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    infoCard: {
        alignItems: 'center',
    },
    infoCardTitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    infoCardText: {
        fontSize: 11,
        color: '#999',
    },
    bottomSheet: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        padding: 15,
        paddingBottom: 30,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    totalLabel: {
        fontSize: 16,
        color: '#666',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    addToCartButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B6B20',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    addToCartText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
        marginLeft: 8,
    },
    buyNowButton: {
        flex: 1,
        backgroundColor: '#FF6B6B',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buyNowText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});