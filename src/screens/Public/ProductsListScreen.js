import { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const produits = [
    { id: 1, nom: 'Riz parfumé', prix: 3500, categorie: 'Ingrédients' },
    { id: 2, nom: 'Huile Arachide', prix: 2500, categorie: 'Ingrédients' },
    { id: 3, nom: 'Jus de Bissap', prix: 1000, categorie: 'Boissons' },
    { id: 4, nom: 'Thiakry', prix: 1500, categorie: 'Boissons' },
    { id: 5, nom: 'Marlin fumé', prix: 4500, categorie: 'Poissons' },
    { id: 6, nom: 'Requin séché', prix: 5000, categorie: 'Poissons' },
];

export default function ProductsListScreen({ navigation, route }) {
    const [searchQuery, setSearchQuery] = useState('');
    const selectedCategory = route.params?.category;

    const filteredProducts = produits.filter(p =>
        p.nom.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!selectedCategory || p.categorie === selectedCategory)
    );

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
            <View style={styles.productImage} />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.nom}</Text>
                <Text style={styles.productCategory}>{item.categorie}</Text>
                <Text style={styles.productPrice}>{item.prix} F CFA</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FF6B6B" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Icon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {selectedCategory && (
                <View style={styles.filterBar}>
                    <Text style={styles.filterText}>Filtre: {selectedCategory}</Text>
                    <TouchableOpacity onPress={() => navigation.setParams({ category: null })}>
                        <Text style={styles.clearFilter}>✕ Effacer</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="search-off" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>Aucun produit trouvé</Text>
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
        fontSize: 16,
        color: '#333',
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        marginHorizontal: 15,
        marginBottom: 10,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    filterText: {
        fontSize: 14,
        color: '#666',
    },
    clearFilter: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '500',
    },
    list: {
        paddingHorizontal: 15,
    },
    productCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    productImage: {
        width: 60,
        height: 60,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginRight: 15,
    },
    productInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    productCategory: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B6B',
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
    },
});