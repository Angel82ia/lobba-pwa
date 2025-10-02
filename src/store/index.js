import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set) => ({
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        role: null,
      },

      ui: {
        theme: 'light',
        language: 'es',
        notifications: [],
      },

      cart: {
        items: [],
        total: 0,
      },

      setUser: (user) =>
        set((state) => ({
          auth: {
            ...state.auth,
            user,
            isAuthenticated: !!user,
            role: user?.role || null,
          },
        })),

      setToken: (token) =>
        set((state) => ({
          auth: {
            ...state.auth,
            token,
          },
        })),

      logout: () =>
        set({
          auth: {
            user: null,
            token: null,
            isAuthenticated: false,
            role: null,
          },
        }),

      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.cart.items.find(
            (item) => item.productId === product.id
          )

          let updatedItems

          if (existingItem) {
            updatedItems = state.cart.items.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          } else {
            updatedItems = [
              ...state.cart.items,
              {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity,
                image: product.images?.[0],
              },
            ]
          }

          const newTotal = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )

          return {
            cart: {
              items: updatedItems,
              total: newTotal,
            },
          }
        }),

      removeFromCart: (productId) =>
        set((state) => {
          const updatedItems = state.cart.items.filter(
            (item) => item.productId !== productId
          )

          const newTotal = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )

          return {
            cart: {
              items: updatedItems,
              total: newTotal,
            },
          }
        }),

      updateCartItemQuantity: (productId, quantity) =>
        set((state) => {
          const updatedItems = state.cart.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          )

          const newTotal = updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          )

          return {
            cart: {
              items: updatedItems,
              total: newTotal,
            },
          }
        }),

      clearCart: () =>
        set({
          cart: {
            items: [],
            total: 0,
          },
        }),

      addNotification: (notification) =>
        set((state) => ({
          ui: {
            ...state.ui,
            notifications: [
              ...state.ui.notifications,
              { ...notification, id: Date.now() },
            ],
          },
        })),

      removeNotification: (id) =>
        set((state) => ({
          ui: {
            ...state.ui,
            notifications: state.ui.notifications.filter((n) => n.id !== id),
          },
        })),

      setLanguage: (language) =>
        set((state) => ({
          ui: {
            ...state.ui,
            language,
          },
        })),
    }),
    {
      name: 'lobba-storage',
      partialize: (state) => ({
        auth: state.auth,
        cart: state.cart,
        ui: { language: state.ui.language },
      }),
    }
  )
)

export default useStore
