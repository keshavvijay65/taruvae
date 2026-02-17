
import { Product } from './firebaseProducts';

export const DEFAULT_PRODUCTS: Product[] = [
    // A2 Cow Bilona Ghee (5 variants)
    { id: '1', name: 'A2 Cow Bilona Ghee', price: 6540, weight: '5 KG', image: '/images/products/GHEE.png', rating: 4.9, stock: 100, category: 'ghee', showOnHome: false },
    { id: '2', name: 'A2 Cow Bilona Ghee', price: 2890, weight: '2 KG', image: '/images/products/GHEE.png', rating: 4.9, stock: 100, category: 'ghee', showOnHome: false },
    { id: '3', name: 'A2 Cow Bilona Ghee', price: 1530, weight: '1 KG', image: '/images/products/GHEE.png', rating: 4.9, stock: 100, category: 'ghee', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark
    { id: '4', name: 'A2 Cow Bilona Ghee', price: 790, weight: '500 GM', image: '/images/products/GHEE.png', rating: 4.9, stock: 100, category: 'ghee', showOnHome: false },
    { id: '5', name: 'A2 Cow Bilona Ghee', price: 340, weight: '200 GM', image: '/images/products/GHEE.png', rating: 4.9, stock: 100, category: 'ghee', showOnHome: false },

    // Ground Nut Oil (4 variants)
    { id: '6', name: 'Ground Nut Oil', price: 1940, weight: '5 L', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'oil', showOnHome: false },
    { id: '7', name: 'Ground Nut Oil', price: 750, weight: '2 L', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'oil', showOnHome: false },
    { id: '8', name: 'Ground Nut Oil', price: 430, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark
    { id: '9', name: 'Ground Nut Oil', price: 245, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'oil', showOnHome: false },

    // Black Mustard Oil (4 variants)
    { id: '10', name: 'Black Mustard Oil', price: 1940, weight: '5 L', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', showOnHome: false },
    { id: '11', name: 'Black Mustard Oil', price: 750, weight: '2 L', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', showOnHome: false },
    { id: '12', name: 'Black Mustard Oil', price: 430, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark
    { id: '13', name: 'Black Mustard Oil', price: 245, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', showOnHome: false },

    // Yellow Mustard Oil (4 variants)
    { id: '14', name: 'Yellow Mustard Oil', price: 2490, weight: '5 L', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '15', name: 'Yellow Mustard Oil', price: 970, weight: '2 L', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '16', name: 'Yellow Mustard Oil', price: 540, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark
    { id: '17', name: 'Yellow Mustard Oil', price: 310, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },

    // Coconut Oil (4 variants)
    { id: '18', name: 'Coconut Oil', price: 2590, weight: '5 L', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', showOnHome: false },
    { id: '19', name: 'Coconut Oil', price: 1010, weight: '2 L', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', showOnHome: false },
    { id: '20', name: 'Coconut Oil', price: 560, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark
    { id: '21', name: 'Coconut Oil', price: 310, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.6, stock: 100, category: 'oil', showOnHome: false },

    // Black Sesame (Gingelly) Oil (4 variants)
    { id: '22', name: 'Black Sesame (Gingelly) Oil', price: 2240, weight: '5 L', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '23', name: 'Black Sesame (Gingelly) Oil', price: 870, weight: '2 L', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '24', name: 'Black Sesame (Gingelly) Oil', price: 490, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark
    { id: '25', name: 'Black Sesame (Gingelly) Oil', price: 275, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },

    // White Sesame Oil (4 variants)
    { id: '26', name: 'White Sesame Oil', price: 3940, weight: '5 L', image: '/images/products/seasame oil.jpg', rating: 4.8, stock: 100, category: 'oil', showOnHome: false },
    { id: '27', name: 'White Sesame Oil', price: 1550, weight: '2 L', image: '/images/products/seasame oil.jpg', rating: 4.8, stock: 100, category: 'oil', showOnHome: false },
    { id: '28', name: 'White Sesame Oil', price: 830, weight: '1000 ml', image: '/images/products/seasame oil.jpg', rating: 4.8, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark
    { id: '29', name: 'White Sesame Oil', price: 445, weight: '500 ml', image: '/images/products/seasame oil.jpg', rating: 4.8, stock: 100, category: 'oil', showOnHome: false },

    // Virgin Coconut Oil (4 variants)
    { id: '30', name: 'Virgin Coconut Oil', price: 1590, weight: '2 L', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '31', name: 'Virgin Coconut Oil', price: 950, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '32', name: 'Virgin Coconut Oil', price: 570, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '33', name: 'Virgin Coconut Oil', price: 340, weight: '250 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark

    // Castor Oil (4 variants)
    { id: '34', name: 'Castor Oil', price: 690, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.4, stock: 100, category: 'oil', showOnHome: false },
    { id: '35', name: 'Castor Oil', price: 390, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.4, stock: 100, category: 'oil', showOnHome: false },
    { id: '36', name: 'Castor Oil', price: 220, weight: '250 ml', image: '/images/all/products image available soon.png', rating: 4.4, stock: 100, category: 'oil', showOnHome: false },
    { id: '37', name: 'Castor Oil', price: 130, weight: '100 ml', image: '/images/all/products image available soon.png', rating: 4.4, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark

    // Extra Virgin Olive Oil (3 variants)
    { id: '38', name: 'Extra Virgin Olive Oil', price: 1570, weight: '1000 ml', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'oil', showOnHome: false },
    { id: '39', name: 'Extra Virgin Olive Oil', price: 830, weight: '500 ml', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'oil', showOnHome: false },
    { id: '40', name: 'Extra Virgin Olive Oil', price: 460, weight: '250 ml', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark

    // Almond Oil (2 variants)
    { id: '41', name: 'Almond Oil', price: 930.00, weight: '250 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', showOnHome: false },
    { id: '42', name: 'Almond Oil', price: 510.00, weight: '100 ml', image: '/images/all/products image available soon.png', rating: 4.7, stock: 100, category: 'oil', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark

    // Pure Hing (Asafoetida) (3 variants)
    { id: '43', name: 'Pure Hing (Asafoetida)', price: 1230, weight: '50 gm', image: '/images/products/Hing.png', rating: 4.6, stock: 100, category: 'superfoods', showOnHome: false },
    { id: '44', name: 'Pure Hing (Asafoetida)', price: 590, weight: '20 gm', image: '/images/products/Hing.png', rating: 4.6, stock: 100, category: 'superfoods', showOnHome: false },
    { id: '45', name: 'Pure Hing (Asafoetida)', price: 330, weight: '10 gm', image: '/images/products/Hing.png', rating: 4.6, stock: 100, category: 'superfoods', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark

    // Garam Masala (2 variants)
    { id: '46', name: 'Garam Masala', price: 370, weight: '200 gm', image: '/images/products/Garam Masala.jpeg', rating: 4.7, stock: 100, category: 'superfoods', showOnHome: false },
    { id: '47', name: 'Garam Masala', price: 210, weight: '100 gm', image: '/images/products/Garam Masala.jpeg', rating: 4.7, stock: 100, category: 'superfoods', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark

    // Jeeravan Masala (2 variants)
    { id: '48', name: 'Jeeravan Masala', price: 230, weight: '200 gm', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'superfoods', showOnHome: false },
    { id: '49', name: 'Jeeravan Masala', price: 140, weight: '100 gm', image: '/images/all/products image available soon.png', rating: 4.5, stock: 100, category: 'superfoods', isBestseller: true, isPrime: true, showOnHome: true }, // Blue Mark

    // DEALS - Products with discount >= 15% (2 Samples)
    {
        id: '64',
        name: 'Premium Ghee Special Offer',
        price: 1300,
        originalPrice: 1600,
        discount: 18,
        weight: '1 KG',
        image: '/images/products/GHEE.png',
        rating: 4.9,
        stock: 100,
        category: 'ghee',
        description: 'Premium Desi Cow Bilona Ghee at special discounted price. Made from A2 milk using traditional Bilona method.',
        features: ['A2 Milk', 'Bilona Method', '18% Discount'],
        benefits: ['Save ₹300', 'Pure & Natural', 'Rich in Nutrients']
    },
    {
        id: '65',
        name: 'Spice Starter Kit Deal',
        price: 850,
        originalPrice: 1100,
        discount: 22,
        weight: 'Set of 5 Spices',
        image: '/images/all/products image available soon.png',
        rating: 4.7,
        stock: 100,
        category: 'superfoods',
        description: 'Essential spices pack: Hing (25gm), Garam Masala (100gm), Jeeravan (100gm), Turmeric (50gm), Jeera (100gm). Perfect for kitchen essentials.',
        features: ['5 Essential Spices', '22% Discount', 'Kitchen Essentials'],
        benefits: ['Save ₹250', 'Complete Kit', 'Premium Quality']
    },

    // COMBO PACKS - Curated bundles (2 Samples)
    {
        id: '66',
        name: 'Complete Cooking Essentials Combo',
        price: 2500,
        originalPrice: 3200,
        discount: 21,
        weight: 'Oil + Ghee + Spices',
        image: '/images/all/products image available soon.png',
        rating: 4.8,
        stock: 100,
        category: 'combo',
        description: 'Everything you need for daily cooking: Groundnut Oil (500ml), Premium Ghee (500gm), Garam Masala (100gm), Hing (25gm), Jeera (100gm). Complete kitchen essentials in one pack.',
        features: ['5 Products', 'Complete Kitchen', '21% Savings'],
        benefits: ['Save ₹700', 'One Stop Shop', 'Premium Quality']
    },
    {
        id: '67',
        name: 'Healthy Morning Combo Pack',
        price: 1800,
        originalPrice: 2300,
        discount: 21,
        weight: 'Ghee + Coffee + Spices',
        image: '/images/all/products image available soon.png',
        rating: 4.7,
        stock: 100,
        category: 'combo',
        description: 'Start your day right with this wellness combo: Premium Ghee (500gm), 100% Arabica Coffee Powder (100gm), Turmeric Powder (50gm), Black Pepper (50gm). Perfect for healthy mornings.',
        features: ['4 Products', 'Morning Essentials', '21% Savings'],
        benefits: ['Save ₹500', 'Healthy Start', 'Energy Boost']
    }
];
