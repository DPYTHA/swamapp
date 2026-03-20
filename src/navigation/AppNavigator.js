// navigation/AppNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';

// Import des stacks
import SplashScreen from '../screens/SplashScreen';
import AdminStack from './AdminStack';
import AuthStack from './AuthStack';
import ClientTabs from './ClientTabs';
import LivreurStack from './LivreurStack';

// Écrans publics
import CategoriesScreen from '../screens/Public/CategoriesScreen';
import ProductDetailScreen from '../screens/Public/ProductDetailScreen';
import ProductsListScreen from '../screens/Public/ProductsListScreen';
import WelcomeScreen from '../screens/Public/WelcomeScreen';

// IMPORT DES ÉCRANS MODAUX
import ConfirmationScreen from '../screens/Client/ConfirmationScreen';
import DestinationListScreen from '../screens/Client/DestinationListScreen';
import DestinationScreen from '../screens/Client/DestinationScreen';
import OrderDetailScreen from '../screens/Client/OrderDetailScreen';

const Stack = createNativeStackNavigator();

// Vérification de tous les types au chargement
console.log('🔍 ===== VÉRIFICATION DES IMPORTS =====');
console.log('📦 SplashScreen type:', typeof SplashScreen);
console.log('📦 WelcomeScreen type:', typeof WelcomeScreen);
console.log('📦 CategoriesScreen type:', typeof CategoriesScreen);
console.log('📦 ProductsListScreen type:', typeof ProductsListScreen);
console.log('📦 ProductDetailScreen type:', typeof ProductDetailScreen);
console.log('📦 AuthStack type:', typeof AuthStack);
console.log('📦 AdminStack type:', typeof AdminStack);
console.log('📦 ClientTabs type:', typeof ClientTabs);
console.log('📦 LivreurStack type:', typeof LivreurStack);
console.log('📦 DestinationListScreen type:', typeof DestinationListScreen);
console.log('📦 OrderDetailScreen type:', typeof OrderDetailScreen);
console.log('📦 ConfirmationScreen type:', typeof ConfirmationScreen);
console.log('📦 DestinationScreen type:', typeof DestinationScreen);
console.log('🔍 ==================================\n');

function PublicStack() {
    console.log('🏠 Rendu PublicStack');

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="ProductsList" component={ProductsListScreen} />
            <Stack.Screen name="Auth" component={AuthStack} options={{ presentation: 'modal' }} />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ presentation: 'modal' }}
            />

        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    const { user, isLoading } = useAuth();

    console.log('\n🔐 ===== ÉTAT AUTH =====');
    console.log('👤 user:', user);
    console.log('👤 user?.role:', user?.role);
    console.log('⏳ isLoading:', isLoading);
    console.log('🔐 ====================\n');

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                <Stack.Screen name="Public" component={PublicStack} />
            ) : user.role === 'admin' ? (
                <Stack.Screen name="Admin" component={AdminStack} />
            ) : user.role === 'livreur' ? (
                <Stack.Screen name="Livreur" component={LivreurStack} />
            ) : (
                <Stack.Screen name="Client" component={ClientTabs} />
            )}

            {/* ÉCRANS MODAUX ACCESSIBLES PARTOUT */}
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name="DestinationList" component={DestinationListScreen} />
                <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
                <Stack.Screen name="CommandeConfirmation" component={ConfirmationScreen} />
                <Stack.Screen name="Destination" component={DestinationScreen} />
            </Stack.Group>
        </Stack.Navigator>
    );
}