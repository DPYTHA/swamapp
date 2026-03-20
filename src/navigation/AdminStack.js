// navigation/AdminStack.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import des écrans admin
import AddEditProductScreen from '../screens/Admin/AddEditProductScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import AssignLivreurScreen from '../screens/Admin/AssignLivreurScreen';
import LivreurDetailsScreen from '../screens/Admin/LivreurDetailsScreen';
import ManageLivreursScreen from '../screens/Admin/ManageLivreursScreen';
import ManageOrdersScreen from '../screens/Admin/ManageOrdersScreen';
import ManageProductsScreen from '../screens/Admin/ManageProductsScreen';
import ManageUsersScreen from '../screens/Admin/ManageUsersScreen';
import OrderDetailsAdminScreen from '../screens/Admin/OrderDetailsAdminScreen';
import SelectLivreurScreen from '../screens/Admin/SelectLivreurScreen';
import SettingsScreen from '../screens/Admin/SettingsScreen';
import StatsScreen from '../screens/Admin/StatsScreen';
import ValidateLivreursScreen from '../screens/Admin/ValidateLivreursScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AdminTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = 'dashboard';
                    else if (route.name === 'Commandes') iconName = 'list-alt';
                    else if (route.name === 'Produits') iconName = 'inventory';
                    else if (route.name === 'Livreurs') iconName = 'local-shipping';
                    else if (route.name === 'Stats') iconName = 'bar-chart';
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF6B6B',
                tabBarInactiveTintColor: 'gray',
                headerShown: true,
            })}
        >
            <Tab.Screen name="Dashboard" component={AdminDashboardScreen} />
            <Tab.Screen name="Commandes" component={ManageOrdersScreen} />
            <Tab.Screen name="Produits" component={ManageProductsScreen} />
            <Tab.Screen name="Livreurs" component={ManageLivreursScreen} />
            <Tab.Screen name="Stats" component={StatsScreen} />
            <Tab.Screen name="Utilisateurs" component={ManageUsersScreen} />
        </Tab.Navigator>
    );
}

export default function AdminStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminTabs" component={AdminTabs} />
            <Stack.Screen name="OrderDetailsAdmin" component={OrderDetailsAdminScreen} />
            <Stack.Screen name="AddEditProduct" component={AddEditProductScreen} />
            <Stack.Screen name="AssignLivreur" component={AssignLivreurScreen} />
            <Stack.Screen name="SelectLivreur" component={SelectLivreurScreen} />
            <Stack.Screen name="ValidateLivreurs" component={ValidateLivreursScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
            <Stack.Screen name="LivreurDetails" component={LivreurDetailsScreen} />
            <Tab.Screen name="Utilisateurs" component={ManageUsersScreen} />
        </Stack.Navigator>
    );
}