// context/CartContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

// 1. Création du contexte
const CartContext = createContext(null);

// 2. Provider component
export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            const savedCart = await AsyncStorage.getItem('@swam_cart');
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            }
        } catch (error) {
            console.log('❌ Erreur chargement panier:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveCart = async (items) => {
        try {
            await AsyncStorage.setItem('@swam_cart', JSON.stringify(items));
        } catch (error) {
            console.log('❌ Erreur sauvegarde panier:', error);
        }
    };

    const addToCart = (product, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);

            let newItems;
            if (existingItem) {
                newItems = prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newItems = [...prevItems, { ...product, quantity }];
            }

            saveCart(newItems);
            return newItems;
        });
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => {
            const newItems = prevItems.filter(item => item.id !== productId);
            saveCart(newItems);
            return newItems;
        });
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems(prevItems => {
            const newItems = prevItems.map(item =>
                item.id === productId ? { ...item, quantity } : item
            );
            saveCart(newItems);
            return newItems;
        });
    };

    const clearCart = () => {
        setCartItems([]);
        saveCart([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.prix * item.quantity), 0);
    };

    const getItemCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            loading,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getItemCount,
        }}>
            {children}
        </CartContext.Provider>
    );
};

// 3. Hook useCart (TRÈS IMPORTANT)
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};