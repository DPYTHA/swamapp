// navigation/ClientTabs.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // 👈 À AJOUTER
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import des écrans client
import AvisScreen from '../screens/Client/AvisScreen';
import CartScreen from '../screens/Client/CartScreen';
import CodesPromoScreen from '../screens/Client/CodesPromoScreen';
import FideliteScreen from '../screens/Client/FideliteScreen';
import HomeScreen from '../screens/Client/HomeScreen';
import OrdersScreen from '../screens/Client/OrdersScreen';
import ProfileScreen from '../screens/Client/ProfileScreen';
import StatistiquesAchatScreen from '../screens/Client/StatistiquesAchatScreen';
import SupportScreen from '../screens/Client/SupportScreen';
import WishlistScreen from '../screens/Client/WishlistScreen';
import ProductDetailScreen from '../screens/Public/ProductDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); // 👈 Stack pour les écrans de détail

// 1. Créez un Stack pour l'accueil et ses détails
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="Avis" component={AvisScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="StatistiquesAchat" component={StatistiquesAchatScreen} />
            <Stack.Screen name="CodesPromo" component={CodesPromoScreen} />
            <Stack.Screen name="Fidelite" component={FideliteScreen} />
        </Stack.Navigator>
    );
}

// 2. Les tabs contiennent le Stack, pas l'écran directement
export default function ClientTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Accueil') iconName = 'home';
                    else if (route.name === 'Commandes') iconName = 'list-alt';
                    else if (route.name === 'Panier') iconName = 'shopping-cart';
                    else if (route.name === 'Profil') iconName = 'person';

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF6B6B',
                tabBarInactiveTintColor: 'gray',
                headerShown: true,
            })}
        >
            {/* ✅ HomeStack au lieu de HomeScreen */}
            <Tab.Screen name="Accueil" component={HomeStack} />
            <Tab.Screen name="Commandes" component={OrdersScreen} />
            <Tab.Screen name="Panier" component={CartScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
        </Tab.Navigator>
    );
}