import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../../services/api';

export default function ManageProductsScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'Tous' },
        { id: 'Ingrédients', label: 'Ingrédients' },
        { id: 'Boissons', label: 'Boissons' },
        { id: 'Poissons', label: 'Poissons' },
    ];

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchQuery, selectedCategory, products]);

    const loadProducts = async () => {
        try {
            const response = await api.get('/produits');
            setProducts(response.data);
        } catch (error) {
            console.log('❌ Erreur chargement produits:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de charger les produits');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filterProducts = () => {
        let filtered = [...products];

        // Filtre par catégorie
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.categorie === selectedCategory);
        }

        // Filtre par recherche
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.nom.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadProducts();
    };

    const handleDeleteProduct = (product) => {
        Alert.alert(
            'Supprimer le produit',
            `Êtes-vous sûr de vouloir supprimer "${product.nom}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => deleteProduct(product.id)
                }
            ]
        );
    };

    const deleteProduct = async (productId) => {
        try {
            await api.delete(`/produits/${productId}`);
            Alert.alert('Succès', 'Produit supprimé');
            loadProducts();
        } catch (error) {
            console.log('❌ Erreur suppression:', error.response?.data || error.message);
            Alert.alert('Erreur', 'Impossible de supprimer le produit');
        }
    };

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('AddEditProduct', { product: item })}
        >
            <View style={styles.productImage}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                    <Icon name="image" size={30} color="#ccc" />
                )}
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.nom}</Text>
                <Text style={styles.productCategory}>{item.categorie}</Text>
                <Text style={styles.productPrice}>{item.prix.toLocaleString()} FCFA</Text>
                <View style={styles.stockContainer}>
                    <Icon
                        name={item.stock > 0 ? 'check-circle' : 'cancel'}
                        size={16}
                        color={item.stock > 0 ? '#4CAF50' : '#F44336'}
                    />
                    <Text style={[styles.stockText, { color: item.stock > 0 ? '#4CAF50' : '#F44336' }]}>
                        {item.stock > 0 ? `${item.stock} en stock` : 'Rupture'}
                    </Text>
                </View>
            </View>

            <View style={styles.productActions}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('AddEditProduct', { product: item })}
                >
                    <Icon name="edit" size={20} color="#FF6B6B" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteProduct(item)}
                >
                    <Icon name="delete" size={20} color="#F44336" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestion des produits</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AddEditProduct')}>
                    <Icon name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close" size={20} color="#999" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filtres catégories */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filtersContainer}
            >
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[
                            styles.filterChip,
                            selectedCategory === cat.id && styles.filterChipActive
                        ]}
                        onPress={() => setSelectedCategory(cat.id)}
                    >
                        <Text style={[
                            styles.filterText,
                            selectedCategory === cat.id && styles.filterTextActive
                        ]}>
                            {cat.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Liste des produits */}
            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="inventory" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun produit trouvé</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate('AddEditProduct')}
                        >
                            <Text style={styles.addButtonText}>Ajouter un produit</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FF6B6B',
        padding: 35,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        padding:15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 10,
        height: 45,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    filtersContainer: {
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    filterChip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 10,
    },
    filterChipActive: {
        backgroundColor: '#FF6B6B',
    },
    filterText: {
        fontSize: 13,
        color: '#666',
    },
    filterTextActive: {
        color: '#fff',
    },
    list: {
        padding: 15,
    },
    productCard: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    productCategory: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF6B6B',
        marginBottom: 4,
    },
    stockContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stockText: {
        fontSize: 12,
        marginLeft: 4,
    },
    productActions: {
        justifyContent: 'space-between',
    },
    editButton: {
        padding: 8,
        marginBottom: 5,
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 10,
        marginBottom: 20,
    },
    addButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});