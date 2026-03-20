import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

const { width } = Dimensions.get('window');
const numColumns = 2;
const cardWidth = (width - 60) / numColumns;

// ✅ TOUTES LES CATÉGORIES POSSIBLES
const ALL_CATEGORIES = [
    { id: 1, name: 'Ingrédients', icon: 'restaurant', color: '#FF6B6B' },
    { id: 2, name: 'Boissons', icon: 'local-drink', color: '#4ECDC4' },
    { id: 3, name: 'Poissons', icon: 'set-meal', color: '#FFE66D' },
    { id: 4, name: 'Viandes', icon: 'set-meal', color: '#FF8C42' },
    { id: 5, name: 'Légumes', icon: 'grass', color: '#6B8E23' },
    { id: 6, name: 'Fruits', icon: 'apple', color: '#E84342' },
    { id: 7, name: 'Épices', icon: 'local-florist', color: '#8B4513' },
    { id: 8, name: 'Sauces', icon: 'local-dining', color: '#9C27B0' },
    { id: 9, name: 'Pâtisserie', icon: 'cake', color: '#FF99C8' },
    { id: 10, name: 'Produits Laitiers', icon: 'egg', color: '#FDFFB6' },
    { id: 11, name: 'Céréales', icon: 'grain', color: '#D4A373' },
    { id: 12, name: 'Conserves', icon: 'inventory', color: '#A7C7E7' },
];

export default function WelcomeScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    // Afficher seulement les 6 premières catégories sur la page d'accueil
    const [displayCategories, setDisplayCategories] = useState(ALL_CATEGORIES.slice(0, 6));

    // Charger les produits depuis l'API
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/produits?limit=100');
            setProducts(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement produits:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fonctions de navigation
    const handleNavigateToAuth = (screenName) => {
        navigation.getParent()?.navigate('Public', {
            screen: 'Auth',
            params: { screen: screenName }
        });
    };

    const handleNavigateToProducts = (category = null) => {
        const params = category ? { category } : undefined;
        navigation.getParent()?.navigate('Public', {
            screen: 'ProductsList',
            params: params,
        });
    };

    const handleNavigateToProductDetail = (productId) => {
        navigation.navigate('ProductDetail', { productId });
    };

    const handleNavigateToCategories = () => {
        navigation.getParent()?.navigate('Public', { screen: 'Categories' });
    };

    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleNavigateToProductDetail(item.id)}
        >
            {item.image_url ? (
                <Image
                    source={{ uri: item.image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.productImage, styles.placeholderImage]}>
                    <Icon name="image" size={30} color="#ccc" />
                </View>
            )}
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.nom}</Text>
                <Text style={styles.productCategory}>{item.categorie}</Text>
                <Text style={styles.productPrice}>{item.prix?.toLocaleString()} F CFA</Text>
            </View>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleNavigateToAuth('Login')}
            >
                <Icon name="add-shopping-cart" size={18} color="#FF6B6B" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des produits...</Text>
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Hero Section */}
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>SWAM</Text>
                    <Text style={styles.heroSubtitle}>M'a bougé m'ba</Text>
                    <Text style={styles.heroDescription}>
                        Découvrez nos ingrédients, boissons, poissons frais et plus
                    </Text>

                    <TouchableOpacity
                        style={styles.heroButton}
                        onPress={() => handleNavigateToProducts()}
                    >
                        <Text style={styles.heroButtonText}>Voir nos produits</Text>
                    </TouchableOpacity>
                </View>

                {/* Catégories */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nos Catégories</Text>
                        <TouchableOpacity onPress={handleNavigateToCategories}>
                            <Text style={styles.seeAllText}>Voir tout ({ALL_CATEGORIES.length})</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoriesGrid}>
                        {displayCategories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={styles.categoryCard}
                                onPress={() => handleNavigateToProducts(cat.name)}
                            >
                                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                                    <Icon name={cat.icon} size={30} color={cat.color} />
                                </View>
                                <Text style={styles.categoryName}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Produits */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nos Produits</Text>
                        <TouchableOpacity onPress={() => handleNavigateToProducts()}>
                            <Text style={styles.seeAllText}>Voir tout</Text>
                        </TouchableOpacity>
                    </View>

                    {products.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="inventory" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>Aucun produit disponible</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={products}
                            renderItem={renderProductItem}
                            keyExtractor={item => item.id.toString()}
                            numColumns={numColumns}
                            scrollEnabled={false}
                            columnWrapperStyle={styles.productRow}
                            contentContainerStyle={styles.productGrid}
                        />
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* CTA Connexion */}
            <View style={styles.fixedCTA}>
                <View style={styles.ctaSection}>
                    <Text style={styles.ctaTitle}>Prêt à commander ?</Text>
                    <Text style={styles.ctaText}>
                        Connectez-vous pour passer commande et suivre vos livraisons
                    </Text>
                    <View style={styles.ctaButtons}>
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => handleNavigateToAuth('Login')}
                        >
                            <Text style={styles.loginButtonText}>Se connecter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={() => handleNavigateToAuth('Register')}
                        >
                            <Text style={styles.registerButtonText}>S'inscrire</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
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
    hero: {
        backgroundColor: '#FF6B6B',
        padding: 30,
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    heroTitle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    heroSubtitle: {
        fontSize: 18,
        color: '#fff',
        fontStyle: 'italic',
        marginBottom: 15,
    },
    heroDescription: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    heroButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    heroButtonText: {
        color: '#FF6B6B',
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        padding: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '500',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        alignItems: 'center',
        width: (width - 45) / 3, // 3 catégories par ligne
        marginBottom: 15,
    },
    categoryIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        color: '#333',
        textAlign: 'center',
        fontWeight: '500',
    },
    productGrid: {
        paddingBottom: 10,
    },
    productRow: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    productCard: {
        width: cardWidth,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    productImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 10,
    },
    placeholderImage: {
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        marginBottom: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    productCategory: {
        fontSize: 11,
        color: '#999',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    addButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#FF6B6B10',
        padding: 6,
        borderRadius: 15,
    },
    bottomSpacer: {
        height: 20,
    },
    fixedCTA: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: 5,
    },
    ctaSection: {
        backgroundColor: '#f8f8f8',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FF6B6B',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    ctaTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    ctaText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    ctaButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    loginButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
        marginRight: 10,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    registerButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    registerButtonText: {
        color: '#FF6B6B',
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
    },
});