// screens/Public/CategoriesScreen.js
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

// Liste complète des catégories
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

export default function CategoriesScreen({ navigation }) {
    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.getParent()?.navigate('Public', {
                screen: 'ProductsList',
                params: { category: item.name }
            })}
        >
            <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                <Icon name={item.icon} size={40} color={item.color} />
            </View>
            <Text style={styles.categoryName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Toutes les catégories</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={ALL_CATEGORIES}
                renderItem={renderCategory}
                keyExtractor={item => item.id.toString()}
                numColumns={3}
                contentContainerStyle={styles.list}
                columnWrapperStyle={styles.row}
            />
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
        padding: 70,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    list: {
        padding: 10,
    },
    row: {
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: (width - 60) / 3,
        alignItems: 'center',
        marginBottom: 20,
    },
    categoryIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
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
});