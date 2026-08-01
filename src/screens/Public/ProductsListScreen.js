import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// URL de votre backend
const API_URL = 'https://swamapp-production.up.railway.app';

export default function ProductsListScreen({ navigation, route }) {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const selectedCategory = route.params?.category;

    // Récupérer les produits depuis l'API
    const fetchProducts = useCallback(async () => {
        try {
            setError(null);
            const token = await AsyncStorage.getItem('userToken');

            // Construire l'URL avec les paramètres
            let url = `${API_URL}/api/produits`;
            if (selectedCategory && selectedCategory !== 'Tous' && selectedCategory !== 'all') {
                url += `?categorie=${encodeURIComponent(selectedCategory)}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setProducts(data);
            setFilteredProducts(data);
        } catch (err) {
            console.error('Erreur chargement produits:', err);
            setError(err.message || 'Impossible de charger les produits');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCategory]);

    // Charger les produits au montage
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Filtrer les produits lors de la recherche
    useEffect(() => {
        const filtered = products.filter(p =>
            p.nom.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchQuery, products]);

    // Rafraîchir la liste
    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    // Rendu d'un produit
    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', {
                productId: item.id,
                product: item
            })}
            activeOpacity={0.8}
        >
            <View style={styles.productImageContainer}>
                {item.image_url ? (
                    <Image
                        source={{ uri: item.image_url }}
                        style={styles.productImage}
                        defaultSource={require('../assets/placeholder.png')}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Icon name="image" size={30} color="#ccc" />
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.productCategory}>{item.categorie}</Text>
                <Text style={styles.productPrice}>{item.prix.toLocaleString()} FCFA</Text>
                {item.stock !== undefined && (
                    <Text style={[
                        styles.stockText,
                        item.stock > 0 ? styles.inStock : styles.outOfStock
                    ]}>
                        {item.stock > 0 ? `✅ ${item.stock} en stock` : '❌ Rupture de stock'}
                    </Text>
                )}
            </View>
            <Icon name="chevron-right" size={24} color="#FF6B6B" />
        </TouchableOpacity>
    );

    // Affichage du chargement
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Chargement des produits...</Text>
            </View>
        );
    }

    // Affichage de l'erreur
    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Icon name="error-outline" size={60} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
                    <Text style={styles.retryButtonText}>🔄 Réessayer</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filtre par catégorie */}
            {selectedCategory && (
                <View style={styles.filterBar}>
                    <Text style={styles.filterText}>
                        📂 Catégorie: <Text style={styles.filterCategory}>{selectedCategory}</Text>
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            navigation.setParams({ category: null });
                            fetchProducts();
                        }}
                    >
                        <Text style={styles.clearFilter}>✕ Effacer</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Compteur de produits */}
            <View style={styles.counterContainer}>
                <Text style={styles.counterText}>
                    {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
                </Text>
            </View>

            {/* Liste des produits */}
            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#FF6B6B']}
                        tintColor="#FF6B6B"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="search-off" size={60} color="#ccc" />
                        <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Aucun produit disponible'}
                        </Text>
                        {searchQuery && (
                            <TouchableOpacity
                                style={styles.clearSearchButton}
                                onPress={() => setSearchQuery('')}
                            >
                                <Text style={styles.clearSearchText}>Effacer la recherche</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 20,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 15,
        marginBottom: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 10,
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginBottom: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ffe0f0',
    },
    filterText: {
        fontSize: 14,
        color: '#666',
    },
    filterCategory: {
        fontWeight: '600',
        color: '#FF6B6B',
    },
    clearFilter: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
    },
    counterContainer: {
        paddingHorizontal: 15,
        paddingBottom: 5,
    },
    counterText: {
        fontSize: 12,
        color: '#999',
    },
    list: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 15,
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },
    productImageContainer: {
        marginRight: 15,
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: '#f5f5f5',
    },
    imagePlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 2,
    },
    stockText: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    inStock: {
        color: '#28a745',
    },
    outOfStock: {
        color: '#dc3545',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 15,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
        textAlign: 'center',
    },
    clearSearchButton: {
        marginTop: 15,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FF6B6B',
    },
    clearSearchText: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '500',
    },
});