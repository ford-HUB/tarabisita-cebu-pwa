/** Prefix used to detect already-seeded rows and avoid duplicates on re-run. */
export const restaurantMenuSeedNamePrefix = '[TB Seed]'

const placeholderImages = [
    'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
]

const item = (name, description, flavor, price, extras = {}) => ({
    name: `${restaurantMenuSeedNamePrefix} ${name}`,
    description,
    flavor,
    price,
    category: extras.category ?? 'Mains',
    preparationTime: extras.preparationTime ?? '20–30 min',
    servingSize: extras.servingSize ?? '1 serving',
    spiceLevel: extras.spiceLevel ?? 'No Spice',
    allergens: extras.allergens ?? '',
    isAvailable: extras.isAvailable ?? true,
    stockStatus: extras.stockStatus ?? 'AVAILABLE_TO_ORDER',
    isDeleted: false,
    deletedAt: null,
    images: Array.isArray(extras.images) && extras.images.length >= 2 ? extras.images : placeholderImages,
})

/** At least 20 Filipino-style restaurant dishes for Tara Bisita demo data. */
export const restaurantMenuSeedItems = [
    item(
        'Chicken Adobo',
        'Classic soy-vinegar braise with garlic, bay leaf, and black pepper. Served with steamed rice.',
        'Savory, tangy, lightly sweet',
        189,
        { category: 'Mains', spiceLevel: 'Mild' }
    ),
    item(
        'Pork Sinigang',
        'Tamarind soup with pork ribs, sitaw, radish, and kangkong. Comforting and sour-forward.',
        'Sour, umami, herbaceous',
        215,
        { category: 'Soups', preparationTime: '35–45 min' }
    ),
    item(
        'Beef Kare-Kare',
        'Oxtail and tripe stew in rich peanut sauce with bagoong on the side and seasonal vegetables.',
        'Nutty, savory, deep umami',
        265,
        { category: 'Mains', allergens: 'Peanuts, shellfish (bagoong)' }
    ),
    item(
        'Crispy Pata',
        'Deep-fried pork knuckle until crackling outside and tender inside. Comes with spiced vinegar.',
        'Rich, salty, crisp',
        320,
        { category: 'Mains', servingSize: 'Good for 2–3' }
    ),
    item(
        'Lechon Kawali',
        'Twice-cooked pork belly with blistered skin and juicy layers. Liver sauce optional.',
        'Salty, fatty, crunchy',
        245,
        { category: 'Mains' }
    ),
    item(
        'Pancit Canton Guisado',
        'Stir-fried wheat noodles with chicken, shrimp, and crisp vegetables.',
        'Smoky wok, savory, citrus finish',
        165,
        { category: 'Noodles', preparationTime: '15–25 min', allergens: 'Shellfish, wheat, soy' }
    ),
    item(
        'Pancit Bihon',
        'Rice noodles tossed with fish sauce, garlic, and mixed meats.',
        'Light umami, garlic-forward',
        155,
        { category: 'Noodles', allergens: 'Fish, soy' }
    ),
    item(
        'Bangus Sisig',
        'Flaked milkfish on a sizzling plate with onions, chili, and calamansi.',
        'Smoky, tangy, medium heat',
        195,
        { category: 'Starters', spiceLevel: 'Medium', allergens: 'Fish' }
    ),
    item(
        'Lumpiang Shanghai',
        'Crispy pork spring rolls with sweet chili dip. Six pieces per order.',
        'Crisp, savory, lightly sweet dip',
        125,
        { category: 'Starters', preparationTime: '15–20 min', allergens: 'Wheat, soy' }
    ),
    item(
        'Fresh Lumpia',
        'Soft crepe roll with ubod, lettuce, and garlicky peanut-brown sauce.',
        'Fresh, sweet-savory sauce',
        135,
        { category: 'Starters', allergens: 'Peanuts, wheat (wrapper)' }
    ),
    item(
        'Inihaw na Liempo',
        'Charcoal-grilled pork belly with toyomansi and spiced vinegar.',
        'Charred, citrus-soy glaze',
        210,
        { category: 'Grill', allergens: 'Soy' }
    ),
    item(
        'Inihaw na Pusit',
        'Whole grilled squid stuffed with tomatoes and onions, brushed with calamansi butter.',
        'Briny, smoky, bright citrus',
        275,
        { category: 'Grill', allergens: 'Shellfish, dairy' }
    ),
    item(
        'Tinolang Manok',
        'Ginger chicken soup with green papaya and chili leaves.',
        'Warming ginger, clean broth',
        175,
        { category: 'Soups' }
    ),
    item(
        'Bicol Express',
        'Pork stewed in coconut milk, shrimp paste, and siling labuyo.',
        'Creamy, funky, spicy',
        205,
        { category: 'Mains', spiceLevel: 'Hot', allergens: 'Shellfish, coconut' }
    ),
    item(
        'Laing',
        'Dried taro leaves slow-cooked in coconut cream with ginger and chili.',
        'Earthy, creamy, gentle heat',
        165,
        { category: 'Mains', spiceLevel: 'Mild', allergens: 'Coconut' }
    ),
    item(
        'Gising-Gising',
        'Chopped yard-long beans and ground pork in coconut milk with shrimp paste.',
        'Creamy, savory, spicy',
        155,
        { category: 'Vegetables', spiceLevel: 'Medium', allergens: 'Shellfish, coconut' }
    ),
    item(
        'Halo-Halo',
        'Shaved ice with leche flan, ube halaya, beans, nata, and evaporated milk.',
        'Milky, nutty ube, mixed textures',
        145,
        { category: 'Desserts', preparationTime: '10–15 min', allergens: 'Dairy, eggs' }
    ),
    item(
        'Leche Flan',
        'Caramel custard made with egg yolks and vanilla. Single slice.',
        'Caramel, vanilla, silky',
        95,
        { category: 'Desserts', allergens: 'Dairy, eggs' }
    ),
    item(
        'Turon with Langka',
        'Banana and jackfruit lumpia fried crisp and rolled in brown sugar.',
        'Crisp, caramelized, tropical',
        85,
        { category: 'Desserts', preparationTime: '12–18 min', allergens: 'Wheat' }
    ),
    item(
        'Garlic Fried Rice',
        'Day-old rice wok-fried with plenty of toasted garlic and spring onion.',
        'Garlicky, smoky, savory',
        65,
        { category: 'Sides', preparationTime: '10–15 min' }
    ),
    item(
        'Plain Steamed Rice',
        'Jasmine rice steamed until fluffy. Per cup.',
        'Clean, subtle floral',
        45,
        { category: 'Sides', preparationTime: '10–15 min' }
    ),
    item(
        'Iced Calamansi Juice',
        'Fresh calamansi, simple syrup, and cold water over ice.',
        'Tart, refreshing, lightly sweet',
        75,
        { category: 'Beverages', preparationTime: '5 min' }
    ),
]
