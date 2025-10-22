import { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Define the type for your store's state
interface HomeStore {
  is_authenticated: boolean
  setIsAuthenticated: (is_authenticated: boolean) => void
  current_user: User | null
  setCurrentUser: (current_user: User | null) => void
}

// Create your store with the persist middleware
export const useHomeStore = create<HomeStore>()(
  persist(
    (set) => ({
      is_authenticated: false,
      setIsAuthenticated: (is_authenticated: boolean) => set(() => ({ is_authenticated })),
      current_user: null,
      setCurrentUser: (current_user: User | null) => set(() => ({ current_user }))
    }),
    {
      name: 'raga-home-store', // Unique name for the item in storage
      storage: createJSONStorage(() => localStorage), // Specify the storage mechanism (localStorage by default)
      // You can also partialize the state to only store specific parts:
      // partialize: (state) => ({ bears: state.bears }),
    }
  )
);