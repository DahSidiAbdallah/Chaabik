import { Category, Listing } from './types';

export const categories: Category[] = [
  {
    id: 'vehicles',
    name: 'Vehicles',
    icon: 'Car',
    subcategories: [
      { id: 'cars', name: 'Cars' },
      { id: 'motorcycles', name: 'Motorcycles' },
      { id: 'trucks', name: 'Trucks' },
      { id: 'boats', name: 'Boats' },
      { id: 'parts', name: 'Parts & Accessories' }
    ]
  },
  {
    id: 'real-estate',
    name: 'RealEstate',
    icon: 'Building',
    subcategories: [
      { id: 'apartments', name: 'Apartments' },
      { id: 'houses', name: 'Houses' },
      { id: 'land', name: 'Land' },
      { id: 'commercial', name: 'Commercial' }
    ]
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: 'Smartphone',
    subcategories: [
      { id: 'phones', name: 'Phones' },
      { id: 'computers', name: 'Computers' },
      { id: 'gaming', name: 'Gaming' },
      { id: 'tv-audio', name: 'TV & Audio' }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: 'Shirt',
    subcategories: [
      { id: 'men', name: 'Men' },
      { id: 'women', name: 'Women' },
      { id: 'kids', name: 'Kids' },
      { id: 'accessories', name: 'Accessories' }
    ]
  },
  {
    id: 'home',
    name: 'Home',
    icon: 'Home',
    subcategories: [
      { id: 'furniture', name: 'Furniture' },
      { id: 'appliances', name: 'Appliances' },
      { id: 'garden', name: 'Garden' },
      { id: 'tools', name: 'Tools' }
    ]
  },
  {
    id: 'jobs',
    name: 'Jobs',
    icon: 'Briefcase',
    subcategories: [
      { id: 'full-time', name: 'Full Time' },
      { id: 'part-time', name: 'Part Time' },
      { id: 'freelance', name: 'Freelance' },
      { id: 'internship', name: 'Internship' }
    ]
  },
  {
    id: 'services',
    name: 'Services',
    icon: 'Tool',
    subcategories: [
      { id: 'cleaning', name: 'Cleaning' },
      { id: 'repair', name: 'Repair' },
      { id: 'transport', name: 'Transport' },
      { id: 'education', name: 'Education' }
    ]
  }
];

export const listings: Listing[] = [
  {
    id: '1',
    title: 'MacBook Pro 16" M1 Pro',
    description: 'Like new MacBook Pro with M1 Pro chip, 16GB RAM, and 512GB SSD. Includes original charger and box. Perfect for professional work and creative tasks.',
    price: 1899,
    category: 'computers',
    location: 'San Francisco, CA',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Like New',
    features: ['M1 Pro Chip', '16GB RAM', '512GB SSD', 'Original Box & Charger', 'AppleCare+ until 2024'],
    seller: {
      name: 'John D.',
      rating: 4.9,
      phone: '+1 (415) 555-0123',
      joinedDate: '2021-03-15',
      totalSales: 47,
      responseRate: 98
    }
  },
  {
    id: '2',
    title: 'Modern Leather Sofa',
    description: 'Beautiful genuine leather sofa in excellent condition. Perfect for modern living rooms. Features premium Italian leather and solid wood frame.',
    price: 899,
    category: 'furniture',
    location: 'Los Angeles, CA',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Excellent',
    features: ['Genuine Italian Leather', 'Solid Wood Frame', '3-Seater', 'Removable Cushions', 'Stain-Resistant'],
    seller: {
      name: 'Sarah M.',
      rating: 4.7,
      phone: '+1 (310) 555-0456',
      joinedDate: '2020-08-22',
      totalSales: 31,
      responseRate: 95
    }
  },
  {
    id: '3',
    title: 'Vintage Denim Jacket',
    description: 'Authentic vintage Levi\'s denim jacket from the 90s. Size M. Perfect distressing and fading, classic fit.',
    price: 120,
    category: 'men',
    location: 'Brooklyn, NY',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Vintage',
    features: ['Original Levi\'s', '90s Era', 'Size M', 'Distressed Look', 'Copper Buttons'],
    seller: {
      name: 'Mike R.',
      rating: 4.8,
      phone: '+1 (718) 555-0789',
      joinedDate: '2022-01-10',
      totalSales: 89,
      responseRate: 99
    }
  },
  {
    id: '4',
    title: 'PS5 Gaming Console Bundle',
    description: 'PlayStation 5 Digital Edition with extra controller and 3 games. Perfect condition, barely used.',
    price: 549,
    category: 'gaming',
    location: 'Seattle, WA',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Like New',
    features: ['Digital Edition', 'Extra Controller', '3 Games Included', 'Original Box', 'Warranty Valid'],
    seller: {
      name: 'Alex K.',
      rating: 4.9,
      phone: '+1 (206) 555-0321',
      joinedDate: '2022-06-15',
      totalSales: 23,
      responseRate: 100
    }
  },
  {
    id: '5',
    title: 'iPhone 14 Pro Max',
    description: 'Latest iPhone model in perfect condition. 256GB storage, graphite color. Includes original accessories and AppleCare+.',
    price: 999,
    category: 'phones',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Like New',
    features: ['256GB Storage', 'Graphite Color', 'AppleCare+', 'Original Box', 'All Accessories'],
    seller: {
      name: 'David M.',
      rating: 4.7,
      phone: '+1 (512) 555-0147',
      joinedDate: '2021-09-20',
      totalSales: 156,
      responseRate: 95
    }
  },
  {
    id: '6',
    title: 'Tesla Model 3 2022',
    description: 'Tesla Model 3 Long Range, White exterior, Black interior. Full self-driving capability, 15k miles.',
    price: 45900,
    category: 'cars',
    location: 'San Jose, CA',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Excellent',
    features: ['Long Range', 'Full Self-Driving', 'White Exterior', 'Black Interior', '15k Miles'],
    seller: {
      name: 'Tom W.',
      rating: 4.9,
      phone: '+1 (408) 555-0852',
      joinedDate: '2021-11-30',
      totalSales: 12,
      responseRate: 100
    }
  },
  {
    id: '7',
    title: 'Luxury Apartment for Rent',
    description: '2-bedroom luxury apartment in downtown. Modern amenities, great view, parking included.',
    price: 2500,
    category: 'apartments',
    location: 'Miami, FL',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Excellent',
    features: ['2 Bedrooms', 'Downtown Location', 'Parking Included', 'Modern Amenities', 'Great View'],
    seller: {
      name: 'Maria L.',
      rating: 4.8,
      phone: '+1 (305) 555-0741',
      joinedDate: '2022-03-01',
      totalSales: 67,
      responseRate: 96
    }
  },
  {
    id: '8',
    title: 'Professional Cleaning Service',
    description: 'Experienced cleaning service for homes and offices. Eco-friendly products, flexible scheduling.',
    price: 80,
    category: 'cleaning',
    location: 'Portland, OR',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
    condition: 'Service',
    features: ['Eco-friendly Products', 'Flexible Schedule', 'Experienced Staff', 'Insured', 'Free Estimates'],
    seller: {
      name: 'Lisa R.',
      rating: 4.9,
      phone: '+1 (503) 555-0963',
      joinedDate: '2021-07-15',
      totalSales: 234,
      responseRate: 98
    }
  }
];