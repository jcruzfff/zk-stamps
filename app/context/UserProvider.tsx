'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define the User type
export type User = {
  isPassportVerified: boolean;
  userId?: string;
  address?: string;
};

// Define the UserContext type
type UserContextType = {
  user: User | null;
  mutate: (newUserData: User) => void;
};

// Create the context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  mutate: () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// UserProvider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Check for user data in localStorage on mount
  useEffect(() => {
    const savedUserString = localStorage.getItem('user');
    if (savedUserString) {
      try {
        const savedUser = JSON.parse(savedUserString);
        setUser(savedUser);
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Update user data and persist to localStorage
  const mutate = (newUserData: User) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  return (
    <UserContext.Provider value={{ user, mutate }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserProvider; 