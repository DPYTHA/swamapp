// navigation/LivreurStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import des écrans livreur
import DeliveriesScreen from '../screens/Livreur/DeliveriesScreen';
import DeliveryDetailScreen from '../screens/Livreur/DeliveryDetailScreen';
import DeliveryHistoryScreen from '../screens/Livreur/DeliveryHistoryScreen';
import LivreurProfileScreen from '../screens/Livreur/LivreurProfileScreen';
import MyDeliveriesScreen from '../screens/Livreur/MyDeliveriesScreen'; // 🆕 À créer ou importer

const Stack = createNativeStackNavigator();

export default function LivreurStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Écran par défaut après connexion */}
            <Stack.Screen name="LivreurProfile" component={LivreurProfileScreen} />

            {/* Livraisons disponibles */}
            <Stack.Screen
                name="Disponibles"  // ✅ Changé pour correspondre
                component={DeliveriesScreen}
            />

            {/* Mes livraisons en cours */}
            <Stack.Screen
                name="MesLivraisons"  // ✅ Ajouté
                component={MyDeliveriesScreen}
            />

            {/* Historique */}
            <Stack.Screen
                name="Historique"  // ✅ Changé pour correspondre
                component={DeliveryHistoryScreen}
            />

            {/* Détail d'une livraison */}
            <Stack.Screen
                name="DeliveryDetail"
                component={DeliveryDetailScreen}
            />
        </Stack.Navigator>
    );
}