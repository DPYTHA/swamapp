import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');
const numColumns = 3;
const cardWidth = (width - 80) / numColumns;

// ✅ TOUTES LES CATÉGORIES POSSIBLES
const CATEGORIES = [
    { id: 'ingredients', name: 'Ingrédients', icon: 'restaurant', color: '#FF6B6B' },
    { id: 'boissons', name: 'Boissons', icon: 'local-drink', color: '#4ECDC4' },
    { id: 'poissons', name: 'Poissons', icon: 'set-meal', color: '#FFE66D' },
    { id: 'viandes', name: 'Viandes', icon: 'set-meal', color: '#FF8C42' },
    { id: 'legumes', name: 'Légumes', icon: 'grass', color: '#6B8E23' },
    { id: 'fruits', name: 'Fruits', icon: 'apple', color: '#E84342' },
    { id: 'epices', name: 'Épices', icon: 'local-florist', color: '#8B4513' },
    { id: 'sauces', name: 'Sauces', icon: 'local-dining', color: '#9C27B0' },
    { id: 'patisserie', name: 'Pâtisserie', icon: 'cake', color: '#FF99C8' },
    { id: 'produits-laitiers', name: 'Produits Laitiers', icon: 'egg', color: '#FDFFB6' },
    { id: 'cereales', name: 'Céréales', icon: 'grain', color: '#D4A373' },
    { id: 'conserves', name: 'Conserves', icon: 'inventory', color: '#A7C7E7' },
    { id: 'surgeles', name: 'Surgelés', icon: 'ac-unit', color: '#00CED1' },
    { id: 'bio', name: 'Bio', icon: 'eco', color: '#2E8B57' },
    { id: 'halal', name: 'Halal', icon: 'mosque', color: '#006400' },
    { id: 'produits-du-terroir', name: 'Produits du Terroir', icon: 'terrain', color: '#CD853F' },
];

export default function HomeScreen({ navigation }) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { addToCart, getItemCount } = useCart();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/produits');
            setProduits(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement produits:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProducts();
    };

    // Filtrer les produits par catégorie et recherche
    const filteredProduits = produits.filter(item => {
        const matchesCategory = selectedCategory === 'all' ||
            item.categorie?.toLowerCase() === selectedCategory;
        const matchesSearch = item.nom?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleAddToCart = (product) => {
        addToCart(product, 1);
    };

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.categoryCard,
                selectedCategory === item.id && styles.categoryCardActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
        >
            <View style={[
                styles.categoryIcon,
                selectedCategory === item.id && styles.categoryIconActive,
                { backgroundColor: item.color + '20' }
            ]}>
                <Icon
                    name={item.icon}
                    size={20}
                    color={selectedCategory === item.id ? COLORS.primary : item.color}
                />
            </View>
            <Text style={[
                styles.categoryName,
                selectedCategory === item.id && styles.categoryNameActive,
            ]} numberOfLines={1}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
            <Image
                source={{
                    uri: item.image_url || 'https://via.placeholder.com/300x300?text=SWAM'
                }}
                style={styles.productImage}
                resizeMode="cover"
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.productCategory} numberOfLines={1}>{item.categorie}</Text>
                <Text style={styles.productPrice}>{item.prix?.toLocaleString()} F</Text>
            </View>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
            >
                <Icon name="add-shopping-cart" size={14} color={COLORS.primary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Chargement des produits...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#fff" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bonjour 👋</Text>
                    <Text style={styles.welcomeText}>Que voulez-vous ?</Text>
                </View>
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Panier')}
                >
                    <Icon name="shopping-cart" size={24} color={COLORS.primary} />
                    {getItemCount() > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>
                                {getItemCount() > 9 ? '9+' : getItemCount()}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close" size={20} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Catégories */}
            <View style={styles.categoriesSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Catégories</Text>
                    <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                        <Text style={styles.seeAllText}>Voir tout</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={[
                        { id: 'all', name: 'Tous', icon: 'apps', color: COLORS.primary },
                        ...CATEGORIES
                    ]}
                    renderItem={renderCategory}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesList}
                />
            </View>

            {/* Produits en grille 3 colonnes */}
            <View style={styles.productsSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory === 'all' ? 'Tous les produits' : 'Produits'}
                    </Text>
                    <Text style={styles.productCount}>{filteredProduits.length} produits</Text>
                </View>
                <FlatList
                    key={`flatlist-${numColumns}`} // 👈 AJOUT : key pour forcer le re-render
                    data={filteredProduits}
                    renderItem={renderProduct}
                    keyExtractor={item => item.id.toString()}
                    numColumns={numColumns}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.productsList}
                    columnWrapperStyle={styles.productRow}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="inventory" size={60} color="#ccc" />
                            <Text style={styles.emptyTitle}>Aucun produit</Text>
                            <Text style={styles.emptyText}>
                                Modifiez votre recherche
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15, // 👈 CORRECTION : valeur ajoutée
        paddingTop: 10,
        paddingBottom: 10,
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    welcomeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    cartButton: {
        position: 'relative',
        padding: 8,
    },
    cartBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        marginHorizontal: 15,
        marginVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        height: 40,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    categoriesSection: {
        marginBottom: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllText: {
        fontSize: 12,
        color: '#FF6B6B',
    },
    productCount: {
        fontSize: 12,
        color: '#999',
    },
    categoriesList: {
        paddingLeft: 15,
    },
    categoryCard: {
        alignItems: 'center',
        marginRight: 15,
        width: 60,
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryIconActive: {
        borderWidth: 2,
        borderColor: '#FF6B6B',
    },
    categoryName: {
        fontSize: 10,
        color: '#999',
        textAlign: 'center',
    },
    categoryNameActive: {
        color: '#FF6B6B',
        fontWeight: '500',
    },
    productsSection: {
        flex: 1,
    },
    productsList: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    productRow: {
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    productCard: {
        width: cardWidth,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    productImage: {
        width: '100%',
        height: 80,
        borderRadius: 6,
        backgroundColor: '#f0f0f0',
        marginBottom: 6,
    },
    productInfo: {
        marginBottom: 4,
    },
    productName: {
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    productCategory: {
        fontSize: 9,
        color: '#999',
        marginBottom: 2,
    },
    productPrice: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FF6B6B',
    },
    addButton: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: '#FF6B6B10',
        padding: 4,
        borderRadius: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 30,
    },
});