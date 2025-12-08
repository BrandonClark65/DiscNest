declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      password?: string;
      hasOnboarded?: boolean;
      role?: string;
      favoriteBrands?: string[];
      preferredTypes?: string[];
      stability?: string;
      throwingStyle?: string;
      maxDistance?: number;
      favoriteCourse?: string;
      discCount?: number;
      lastLogin?: Date;
    };
  }

  interface User {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    password?: string;
    hasOnboarded?: boolean;
    role?: string;
    favoriteBrands?: string[];
    preferredTypes?: string[];
    stability?: string;
    throwingStyle?: string;
    maxDistance?: number;
    favoriteCourse?: string;
    discCount?: number;
    lastLogin?: Date;
  }
}