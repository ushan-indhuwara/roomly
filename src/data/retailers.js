// Roomly - Global Retailers & Country-Specific Furniture Shopping Links
// Direct search links, estimated price ranges, availability hints, and affiliate transparency

export const COUNTRIES = [
  { id: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$' },
  { id: 'UK', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
  { id: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', symbol: 'CA$' },
  { id: 'EU', name: 'European Union (DE)', flag: '🇪🇺', currency: 'EUR', symbol: '€' },
  { id: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', symbol: 'A$' }
];

export const RETAILER_CONFIGS = {
  US: [
    {
      id: 'amazon',
      name: 'Amazon US',
      badge: 'Fast Delivery',
      buildUrl: (query) => `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=furniture`
    },
    {
      id: 'ikea',
      name: 'IKEA US',
      badge: 'Scandinavian Flat-pack',
      buildUrl: (query) => `https://www.ikea.com/us/en/search/?q=${encodeURIComponent(query)}`
    },
    {
      id: 'wayfair',
      name: 'Wayfair',
      badge: 'Wide Selection',
      buildUrl: (query) => `https://www.wayfair.com/keyword.php?keyword=${encodeURIComponent(query)}`
    },
    {
      id: 'target',
      name: 'Target Home',
      badge: 'Budget Friendly',
      buildUrl: (query) => `https://www.target.com/s?searchTerm=${encodeURIComponent(query + ' furniture')}`
    }
  ],
  UK: [
    {
      id: 'amazon',
      name: 'Amazon UK',
      badge: 'Prime Delivery',
      buildUrl: (query) => `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&i=kitchen`
    },
    {
      id: 'ikea',
      name: 'IKEA UK',
      badge: 'Nordic Style',
      buildUrl: (query) => `https://www.ikea.com/gb/en/search/?q=${encodeURIComponent(query)}`
    },
    {
      id: 'wayfair',
      name: 'Wayfair UK',
      badge: 'Home & Living',
      buildUrl: (query) => `https://www.wayfair.co.uk/keyword.php?keyword=${encodeURIComponent(query)}`
    },
    {
      id: 'johnlewis',
      name: 'John Lewis',
      badge: 'Premium Quality',
      buildUrl: (query) => `https://www.johnlewis.com/search?search-term=${encodeURIComponent(query)}`
    }
  ],
  CA: [
    {
      id: 'amazon',
      name: 'Amazon CA',
      badge: 'Fast Shipping',
      buildUrl: (query) => `https://www.amazon.ca/s?k=${encodeURIComponent(query)}`
    },
    {
      id: 'ikea',
      name: 'IKEA Canada',
      badge: 'Scandinavian',
      buildUrl: (query) => `https://www.ikea.com/ca/en/search/?q=${encodeURIComponent(query)}`
    },
    {
      id: 'wayfair',
      name: 'Wayfair CA',
      badge: 'Canadian Delivery',
      buildUrl: (query) => `https://www.wayfair.ca/keyword.php?keyword=${encodeURIComponent(query)}`
    },
    {
      id: 'structube',
      name: 'Structube',
      badge: 'Modern Affordable',
      buildUrl: (query) => `https://www.structube.com/en_ca/search?q=${encodeURIComponent(query)}`
    }
  ],
  EU: [
    {
      id: 'amazon',
      name: 'Amazon DE / EU',
      badge: 'EU Delivery',
      buildUrl: (query) => `https://www.amazon.de/s?k=${encodeURIComponent(query)}`
    },
    {
      id: 'ikea',
      name: 'IKEA DE',
      badge: 'Nordic Design',
      buildUrl: (query) => `https://www.ikea.com/de/de/search/?q=${encodeURIComponent(query)}`
    },
    {
      id: 'wayfair',
      name: 'Wayfair DE',
      badge: 'Möbel & Deko',
      buildUrl: (query) => `https://www.wayfair.de/keyword.php?keyword=${encodeURIComponent(query)}`
    },
    {
      id: 'otto',
      name: 'OTTO Living',
      badge: 'Direct Retailer',
      buildUrl: (query) => `https://www.otto.de/suche/${encodeURIComponent(query)}/`
    }
  ],
  AU: [
    {
      id: 'amazon',
      name: 'Amazon AU',
      badge: 'Fast Delivery',
      buildUrl: (query) => `https://www.amazon.com.au/s?k=${encodeURIComponent(query)}`
    },
    {
      id: 'ikea',
      name: 'IKEA Australia',
      badge: 'Modern Flatpack',
      buildUrl: (query) => `https://www.ikea.com/au/en/search/?q=${encodeURIComponent(query)}`
    },
    {
      id: 'temple',
      name: 'Temple & Webster',
      badge: 'Australian Design',
      buildUrl: (query) => `https://www.templeandwebster.com.au/search?q=${encodeURIComponent(query)}`
    },
    {
      id: 'freedom',
      name: 'Freedom Furniture',
      badge: 'Local Showrooms',
      buildUrl: (query) => `https://www.freedom.com.au/search?q=${encodeURIComponent(query)}`
    }
  ]
};

// Item-specific high-accuracy product search queries & realistic price ranges
export const SPECIFIC_PRODUCT_DATA = {
  sofa_3: {
    exactQuery: 'scandinavian 3 seater sofa tapered legs fabric',
    priceRange: [780, 1150],
    availability: 'In Stock Online · Ready to Ship',
    sampleModels: 'IKEA LANDSKRONA · Article Sven · Castlery Adams'
  },
  sofa_2: {
    exactQuery: 'modern boucle compact loveseat sofa 2 seater',
    priceRange: [540, 820],
    availability: 'In Stock Online · Ready to Ship',
    sampleModels: 'IKEA PÄRUP · West Elm Marin · Target Project 62'
  },
  chair_arm: {
    exactQuery: 'modern nordic accent armchair wooden legs fabric',
    priceRange: [260, 420],
    availability: 'In Stock · Quick Ship',
    sampleModels: 'IKEA STRANDMON · Article Oscuro · Poly & Bark'
  },
  chair_office: {
    exactQuery: 'ergonomic mesh swivel office desk chair lumbar support',
    priceRange: [180, 320],
    availability: 'In Stock · Next Day Delivery',
    sampleModels: 'IKEA MARKUS / JÄRVFJÄLLET · Branch Ergonomic'
  },
  chair_dining: {
    exactQuery: 'minimalist dining chair upholstered curved back wood',
    priceRange: [95, 175],
    availability: 'In Stock (Sets of 2 or 4)',
    sampleModels: 'IKEA LISABO / BERGMUND · Target Threshold'
  },
  bed_queen: {
    exactQuery: 'queen size upholstered platform bed low profile headboard',
    priceRange: [620, 950],
    availability: 'In Stock · Standard Freight',
    sampleModels: 'IKEA IDANÄS · Zinus Suzanne · Thuma Classic'
  },
  bed_king: {
    exactQuery: 'king size fabric platform bed frame cushioned headboard',
    priceRange: [780, 1200],
    availability: 'In Stock · Standard Freight',
    sampleModels: 'IKEA SLATTUM / TUDDENG · Castlery Dawson'
  },
  desk_large: {
    exactQuery: 'solid oak writing desk minimalist home office 140cm',
    priceRange: [340, 520],
    availability: 'In Stock Online',
    sampleModels: 'IKEA BEKANT / IDÅSEN · Article Candra'
  },
  table_coffee: {
    exactQuery: 'scandinavian oval oak coffee table rounded shelf',
    priceRange: [160, 280],
    availability: 'In Stock · 2-3 Day Delivery',
    sampleModels: 'IKEA STOCKHOLM · West Elm Anton · Target Studio McGee'
  },
  table_dining: {
    exactQuery: 'solid wood dining table 6 seater modern rectangular',
    priceRange: [450, 720],
    availability: 'In Stock Online',
    sampleModels: 'IKEA MÖRBYLÅNGA · Article Seno'
  },
  table_dining_round: {
    exactQuery: 'round wood pedestal dining table 110cm bistro',
    priceRange: [360, 550],
    availability: 'In Stock Online',
    sampleModels: 'IKEA DOCKSTA / BILLSTA · West Elm Silhouette'
  },
  nightstand: {
    exactQuery: 'modern oak bedside table nightstand with drawer',
    priceRange: [110, 185],
    availability: 'In Stock · Ready to Ship',
    sampleModels: 'IKEA HEMNES / NORDLI · Article Lignum'
  },
  wardrobe: {
    exactQuery: 'modern 2 door wardrobe closet armoire oak wood',
    priceRange: [580, 890],
    availability: 'In Stock (Flat-pack)',
    sampleModels: 'IKEA PAX / BRIMNES · Wayfair Andover'
  },
  bookshelf: {
    exactQuery: 'tall 5 shelf open bookcase wooden frame minimalist',
    priceRange: [240, 390],
    availability: 'In Stock · Quick Ship',
    sampleModels: 'IKEA BILLY / KALLAX · Target Dauntless'
  },
  media_console: {
    exactQuery: 'slatted wood media console tv stand credenza 160cm',
    priceRange: [340, 580],
    availability: 'In Stock · 3-5 Days',
    sampleModels: 'IKEA BESTÅ · Article Bios · Castlery Harper'
  },
  lamp_floor: {
    exactQuery: 'brass arc floor lamp with linen drum shade warm light',
    priceRange: [120, 220],
    availability: 'In Stock · Next Day Available',
    sampleModels: 'IKEA SKAFTET / HEKTAR · Brightech Sparq'
  },
  plant_large: {
    exactQuery: 'potted live or faux fiddle leaf fig indoor plant 120cm',
    priceRange: [70, 130],
    availability: 'In Stock at Local Nurseries & Online',
    sampleModels: 'IKEA FEJKA · Costa Farms Live Botanical'
  },
  rug_large: {
    exactQuery: 'flat weave wool area rug neutral geometric 8x5 240x170',
    priceRange: [190, 350],
    availability: 'In Stock · Rolled Delivery',
    sampleModels: 'IKEA VOLLERSLEV · Ruggable Kamran · Rugs USA'
  },
  rug_runner: {
    exactQuery: 'hallway runner rug washable woven neutral 160x90',
    priceRange: [60, 120],
    availability: 'In Stock · Ready to Ship',
    sampleModels: 'IKEA TIPHEDE · Ruggable Runner'
  }
};

export const AFFILIATE_DISCLOSURE = 
  'Transparency Notice: Roomly is completely free to use. When you purchase through links on this page, Roomly may earn a modest affiliate referral commission at no additional cost to you. We exclusively link to pieces that match your room\'s architectural measurements.';

