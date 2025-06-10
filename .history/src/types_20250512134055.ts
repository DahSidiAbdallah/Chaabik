export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  image: string;
  condition: string;
  features: string[];
  seller: {
    name: string;
    rating: number;
    phone: string;
    joinedDate: string;
    totalSales: number;
    responseRate: number;
  };
}