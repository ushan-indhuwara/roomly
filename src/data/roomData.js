// Roomly - Core Data: Catalog, Presets, Materials, and Journal Articles
// All dimensions stored in centimeters (cm) for precision

export const MATERIALS = [
  { id: 'boucle', name: 'Bouclé Cream', color: '#F4EFEA', type: 'fabric', desc: 'Soft textured wool bouclé' },
  { id: 'sage', name: 'Sage Velvet', color: '#688871', type: 'fabric', desc: 'Plush matte sage velvet' },
  { id: 'terracotta', name: 'Terracotta Linen', color: '#C8785E', type: 'fabric', desc: 'Natural breathable washed linen' },
  { id: 'charcoal', name: 'Charcoal Weave', color: '#3A3F3B', type: 'fabric', desc: 'Durable charcoal heather weave' },
  { id: 'oak', name: 'Natural Oak', color: '#D4B595', type: 'wood', desc: 'Warm European natural oak finish' },
  { id: 'walnut', name: 'Dark Walnut', color: '#6E533E', type: 'wood', desc: 'Rich deep walnut grain' },
  { id: 'black_ash', name: 'Black Ash', color: '#2B2B2B', type: 'wood', desc: 'Sleek matte black stained wood' },
  { id: 'brass', name: 'Brushed Brass', color: '#D4A86A', type: 'metal', desc: 'Warm satin brass accent' },
  { id: 'white', name: 'Matte White', color: '#FAF9F6', type: 'finish', desc: 'Clean architectural matte white' }
];

export const CATALOG = {
  // SEATING
  sofa_3: {
    id: 'sofa_3',
    name: 'Lounge 3-Seater Sofa',
    category: 'Seating',
    icon: '🛋️',
    price: 920,
    width: 210,
    depth: 92,
    height: 82,
    defaultMaterial: 'sage',
    description: 'Generous 3-cushion Scandinavian sofa with tapered wood legs.',
    searchKeyword: 'scandinavian 3 seater fabric sofa'
  },
  sofa_2: {
    id: 'sofa_2',
    name: 'Cozy Loveseat (2-Seater)',
    category: 'Seating',
    icon: '🛋️',
    price: 680,
    width: 155,
    depth: 88,
    height: 82,
    defaultMaterial: 'boucle',
    description: 'Compact two-seater sofa ideal for apartments and reading nooks.',
    searchKeyword: 'boucle compact loveseat sofa'
  },
  chair_arm: {
    id: 'chair_arm',
    name: 'Nordic Accent Armchair',
    category: 'Seating',
    icon: '🪑',
    price: 340,
    width: 82,
    depth: 82,
    height: 78,
    defaultMaterial: 'terracotta',
    description: 'Curved lounge armchair with ergonomic lumbar support and soft upholstery.',
    searchKeyword: 'modern accent armchair wooden legs'
  },
  chair_office: {
    id: 'chair_office',
    name: 'Ergonomic Desk Chair',
    category: 'Seating',
    icon: '💺',
    price: 240,
    width: 62,
    depth: 62,
    height: 92,
    defaultMaterial: 'charcoal',
    description: 'Breathable swivel desk chair with lumbar cushion and silent castors.',
    searchKeyword: 'ergonomic mesh office chair'
  },
  chair_dining: {
    id: 'chair_dining',
    name: 'Curved Dining Chair',
    category: 'Seating',
    icon: '🪑',
    price: 135,
    width: 48,
    depth: 52,
    height: 84,
    defaultMaterial: 'boucle',
    description: 'Minimalist dining chair with upholstered seat pad and curved back.',
    searchKeyword: 'modern scandinavian dining chair fabric'
  },

  // BEDS
  bed_queen: {
    id: 'bed_queen',
    name: 'Nordic Queen Bed',
    category: 'Beds',
    icon: '🛏️',
    price: 760,
    width: 160,
    depth: 205,
    height: 105,
    defaultMaterial: 'boucle',
    description: 'Low-profile queen platform bed with cushioned upholstered headboard.',
    searchKeyword: 'queen platform bed upholstered headboard'
  },
  bed_king: {
    id: 'bed_king',
    name: 'Cloud King Bed',
    category: 'Beds',
    icon: '🛏️',
    price: 920,
    width: 195,
    depth: 215,
    height: 110,
    defaultMaterial: 'boucle',
    description: 'Generous king platform bed with plush pillowed headboard.',
    searchKeyword: 'king bed frame modern fabric'
  },

  // TABLES & DESKS
  desk_large: {
    id: 'desk_large',
    name: 'Solid Oak Writing Desk',
    category: 'Tables & Desks',
    icon: '🪵',
    price: 420,
    width: 140,
    depth: 70,
    height: 75,
    defaultMaterial: 'oak',
    description: 'Minimalist solid oak desk with beveled edge and cable cutout.',
    searchKeyword: 'solid oak writing desk minimalist'
  },
  table_coffee: {
    id: 'table_coffee',
    name: 'Organic Coffee Table',
    category: 'Tables & Desks',
    icon: '☕',
    price: 210,
    width: 120,
    depth: 60,
    height: 42,
    defaultMaterial: 'oak',
    description: 'Soft rounded coffee table with lower magazine shelf.',
    searchKeyword: 'oval modern coffee table wood'
  },
  table_dining: {
    id: 'table_dining',
    name: 'Family Dining Table',
    category: 'Tables & Desks',
    icon: '🍽️',
    price: 560,
    width: 160,
    depth: 90,
    height: 76,
    defaultMaterial: 'walnut',
    description: 'Comfortably seats 6, finished with warm natural wood grain.',
    searchKeyword: 'dining table wood 6 seater'
  },
  table_dining_round: {
    id: 'table_dining_round',
    name: 'Round Bistro Dining Table',
    category: 'Tables & Desks',
    icon: '⭕',
    price: 440,
    width: 110,
    depth: 110,
    height: 76,
    defaultMaterial: 'oak',
    description: 'Pedestal base dining table perfect for kitchen nooks and intimate dinners.',
    searchKeyword: 'round pedestal dining table wood'
  },
  nightstand: {
    id: 'nightstand',
    name: 'Bedside Nightstand',
    category: 'Tables & Desks',
    icon: '🗄️',
    price: 145,
    width: 50,
    depth: 42,
    height: 52,
    defaultMaterial: 'oak',
    description: 'Clean bedside table with single soft-close drawer and open cubby.',
    searchKeyword: 'modern nightstand wood with drawer'
  },

  // STORAGE
  wardrobe: {
    id: 'wardrobe',
    name: 'Double Wardrobe',
    category: 'Storage',
    icon: '🚪',
    price: 720,
    width: 120,
    depth: 60,
    height: 200,
    defaultMaterial: 'oak',
    description: 'Two-door wardrobe with integrated hanging rail and lower shelving.',
    searchKeyword: 'wooden 2 door wardrobe closet'
  },
  bookshelf: {
    id: 'bookshelf',
    name: 'Tall Architectural Bookshelf',
    category: 'Storage',
    icon: '📚',
    price: 310,
    width: 100,
    depth: 36,
    height: 185,
    defaultMaterial: 'walnut',
    description: 'Five-tier open shelving unit with solid hardwood frame.',
    searchKeyword: 'tall open bookcase bookshelf modern'
  },
  media_console: {
    id: 'media_console',
    name: 'Media Console & Sideboard',
    category: 'Storage',
    icon: '📻',
    price: 430,
    width: 160,
    depth: 45,
    height: 54,
    defaultMaterial: 'walnut',
    description: 'Low credenza with slatted sliding doors and cord management.',
    searchKeyword: 'slatted wood media console tv stand'
  },

  // LIGHTING & DECOR
  lamp_floor: {
    id: 'lamp_floor',
    name: 'Warm Arc Floor Lamp',
    category: 'Lighting & Decor',
    icon: '💡',
    price: 165,
    width: 45,
    depth: 45,
    height: 165,
    defaultMaterial: 'brass',
    description: 'Sweeping brass floor lamp with linen drum shade and warm diffused glow.',
    searchKeyword: 'brass arc floor lamp with linen shade'
  },
  plant_large: {
    id: 'plant_large',
    name: 'Fiddle Leaf Fig & Pot',
    category: 'Lighting & Decor',
    icon: '🪴',
    price: 95,
    width: 50,
    depth: 50,
    height: 130,
    defaultMaterial: 'sage',
    description: 'Lush potted botanical with broad architectural leaves.',
    searchKeyword: 'potted fiddle leaf fig indoor plant'
  },
  rug_large: {
    id: 'rug_large',
    name: 'Woven Wool Area Rug',
    category: 'Lighting & Decor',
    icon: '🧶',
    price: 260,
    width: 240,
    depth: 170,
    height: 2,
    defaultMaterial: 'boucle',
    description: 'Textured flat-weave wool rug that anchors seating arrangements.',
    searchKeyword: 'wool area rug woven neutral 8x5'
  },
  rug_runner: {
    id: 'rug_runner',
    name: 'Geometric Runner Rug',
    category: 'Lighting & Decor',
    icon: '🟫',
    price: 130,
    width: 160,
    depth: 90,
    height: 2,
    defaultMaterial: 'terracotta',
    description: 'Accent runner rug adding warmth to hallways and office desks.',
    searchKeyword: 'accent runner rug neutral modern'
  },
  tv_unit: {
    id: 'tv_unit',
    name: 'Smart 4K OLED TV (65")',
    category: 'Lighting & Decor',
    icon: '📺',
    price: 890,
    width: 145,
    depth: 20,
    height: 85,
    defaultElevation: 54,
    defaultMountType: 'console',
    defaultMaterial: 'charcoal',
    description: 'Ultra-thin 65-inch 4K OLED smart television for media console or wall mounting.',
    searchKeyword: '65 inch 4K OLED TV slim wall mount'
  },
  window_casement: {
    id: 'window_casement',
    name: 'Architectural Window',
    category: 'Lighting & Decor',
    icon: '🪟',
    price: 280,
    width: 160,
    depth: 16,
    height: 140,
    defaultElevation: 85,
    defaultMountType: 'wall',
    defaultMaterial: 'white',
    description: 'Realistic double-sash architectural window with deep oak sill, divided panes, and outdoor view.',
    searchKeyword: 'architectural casement window'
  },
  door_passage: {
    id: 'door_passage',
    name: 'Architectural Door',
    category: 'Lighting & Decor',
    icon: '🚪',
    price: 320,
    width: 90,
    depth: 16,
    height: 210,
    defaultElevation: 0,
    defaultMountType: 'wall',
    defaultMaterial: 'oak',
    description: 'Realistic architectural passage door with perimeter moulded casing, beveled panel leaf, dual-side brushed brass lever handle, and threshold plate.',
    searchKeyword: 'interior architectural wooden door with lever'
  }
};

export const ROOM_PRESETS = [
  {
    id: 'living',
    name: 'Living Room',
    icon: '🛋️',
    category: 'Living',
    description: 'Airy, conversational lounge with sofa, coffee table, media console, TV, and greenery.',
    width: 500,  // cm = 5.0m
    length: 420, // cm = 4.2m
    height: 260, // cm
    wallColor: '#F5F2EB',
    floorType: 'wood_oak',
    windows: [{ wall: 'top', offset: 160, width: 180, height: 140, elevation: 90 }],
    doors: [{ wall: 'bottom', offset: 380, width: 90, height: 210, swing: 'in-right' }],
    items: [
      { id: 'item-win-1', type: 'window_casement', x: 160, y: 0, w: 180, d: 16, rot: 0, elevation: 90, material: 'white', zIndex: 1 },
      { id: 'item-door-1', type: 'door_passage', x: 380, y: 404, w: 90, d: 16, rot: 0, elevation: 0, material: 'oak', zIndex: 1 },
      { id: 'item-1', type: 'rug_large', x: 130, y: 120, w: 240, d: 170, rot: 0, material: 'boucle', zIndex: 1 },
      { id: 'item-2', type: 'sofa_3', x: 145, y: 95, w: 210, d: 92, rot: 0, material: 'sage', zIndex: 2 },
      { id: 'item-3', type: 'table_coffee', x: 185, y: 175, w: 120, d: 60, rot: 0, material: 'oak', zIndex: 3 },
      { id: 'item-4', type: 'chair_arm', x: 85, y: 180, w: 82, d: 82, rot: 60, material: 'boucle', zIndex: 2 },
      { id: 'item-5', type: 'media_console', x: 170, y: 350, w: 160, d: 45, rot: 0, material: 'walnut', zIndex: 2 },
      { id: 'item-6', type: 'tv_unit', x: 178, y: 355, w: 145, d: 20, rot: 0, material: 'charcoal', elevation: 54, mountType: 'console', zIndex: 4 },
      { id: 'item-7', type: 'lamp_floor', x: 60, y: 90, w: 45, d: 45, rot: 0, material: 'brass', zIndex: 3 },
      { id: 'item-8', type: 'plant_large', x: 420, y: 80, w: 50, d: 50, rot: 0, material: 'sage', zIndex: 3 }
    ]
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: '🛏️',
    category: 'Sleeping',
    description: 'Serene retreat anchored by a plush queen bed and warm bedside lighting.',
    width: 450,
    length: 400,
    height: 260,
    wallColor: '#EFECE4',
    floorType: 'wood_oak',
    windows: [{ wall: 'top', offset: 140, width: 170, height: 140, elevation: 90 }],
    doors: [{ wall: 'bottom', offset: 60, width: 90, height: 210, swing: 'in-left' }],
    items: [
      { id: 'item-win-b1', type: 'window_casement', x: 140, y: 0, w: 170, d: 16, rot: 0, elevation: 90, material: 'white', zIndex: 1 },
      { id: 'item-door-b1', type: 'door_passage', x: 60, y: 384, w: 90, d: 16, rot: 0, elevation: 0, material: 'oak', zIndex: 1 },
      { id: 'item-b1', type: 'bed_queen', x: 145, y: 60, w: 160, d: 205, rot: 0, material: 'boucle', zIndex: 2 },
      { id: 'item-b2', type: 'rug_large', x: 105, y: 140, w: 240, d: 170, rot: 0, material: 'terracotta', zIndex: 1 },
      { id: 'item-b3', type: 'nightstand', x: 80, y: 60, w: 50, d: 42, rot: 0, material: 'oak', zIndex: 2 },
      { id: 'item-b4', type: 'nightstand', x: 320, y: 60, w: 50, d: 42, rot: 0, material: 'oak', zIndex: 2 },
      { id: 'item-b5', type: 'wardrobe', x: 310, y: 260, w: 120, d: 60, rot: 0, material: 'oak', zIndex: 2 },
      { id: 'item-b6', type: 'chair_arm', x: 75, y: 280, w: 80, d: 80, rot: 35, material: 'sage', zIndex: 2 },
      { id: 'item-b7', type: 'plant_large', x: 380, y: 70, w: 45, d: 45, rot: 0, material: 'sage', zIndex: 3 }
    ]
  },
  {
    id: 'office',
    name: 'Home Office',
    icon: '🖥️',
    category: 'Work',
    description: 'Focused ergonomic workspace with ample natural light and smart storage.',
    width: 380,
    length: 360,
    height: 260,
    wallColor: '#ECEFEA',
    floorType: 'wood_light',
    windows: [{ wall: 'top', offset: 110, width: 160, height: 140, elevation: 90 }],
    doors: [{ wall: 'right', offset: 230, width: 85, height: 210, swing: 'in-left' }],
    items: [
      { id: 'item-win-o1', type: 'window_casement', x: 110, y: 0, w: 160, d: 16, rot: 0, elevation: 90, material: 'white', zIndex: 1 },
      { id: 'item-door-o1', type: 'door_passage', x: 364, y: 230, w: 16, d: 85, rot: 0, elevation: 0, material: 'oak', zIndex: 1 },
      { id: 'item-o1', type: 'desk_large', x: 120, y: 70, w: 140, d: 70, rot: 0, material: 'oak', zIndex: 2 },
      { id: 'item-o2', type: 'chair_office', x: 160, y: 150, w: 62, d: 62, rot: 0, material: 'charcoal', zIndex: 3 },
      { id: 'item-o3', type: 'bookshelf', x: 40, y: 70, w: 100, d: 36, rot: 90, material: 'walnut', zIndex: 2 },
      { id: 'item-o4', type: 'rug_runner', x: 110, y: 110, w: 160, d: 90, rot: 0, material: 'boucle', zIndex: 1 },
      { id: 'item-o5', type: 'lamp_floor', x: 280, y: 65, w: 45, d: 45, rot: 0, material: 'brass', zIndex: 3 },
      { id: 'item-o6', type: 'plant_large', x: 50, y: 270, w: 45, d: 45, rot: 0, material: 'sage', zIndex: 3 }
    ]
  },
  {
    id: 'dining',
    name: 'Dining Room',
    icon: '🍽️',
    category: 'Dining',
    description: 'Harmonious gathering space centered around a generous dining table.',
    width: 440,
    length: 400,
    height: 260,
    wallColor: '#F7F3EC',
    floorType: 'wood_oak',
    windows: [{ wall: 'top', offset: 130, width: 180, height: 140, elevation: 90 }],
    doors: [{ wall: 'bottom', offset: 50, width: 90, height: 210, swing: 'in-left' }],
    items: [
      { id: 'item-win-d1', type: 'window_casement', x: 130, y: 0, w: 180, d: 16, rot: 0, elevation: 90, material: 'white', zIndex: 1 },
      { id: 'item-door-d1', type: 'door_passage', x: 50, y: 384, w: 90, d: 16, rot: 0, elevation: 0, material: 'oak', zIndex: 1 },
      { id: 'item-d1', type: 'rug_large', x: 100, y: 115, w: 240, d: 170, rot: 0, material: 'boucle', zIndex: 1 },
      { id: 'item-d2', type: 'table_dining', x: 140, y: 155, w: 160, d: 90, rot: 0, material: 'walnut', zIndex: 2 },
      { id: 'item-d3', type: 'chair_dining', x: 155, y: 95, w: 48, d: 52, rot: 180, material: 'boucle', zIndex: 2 },
      { id: 'item-d4', type: 'chair_dining', x: 235, y: 95, w: 48, d: 52, rot: 180, material: 'boucle', zIndex: 2 },
      { id: 'item-d5', type: 'chair_dining', x: 155, y: 255, w: 48, d: 52, rot: 0, material: 'boucle', zIndex: 2 },
      { id: 'item-d6', type: 'chair_dining', x: 235, y: 255, w: 48, d: 52, rot: 0, material: 'boucle', zIndex: 2 },
      { id: 'item-d7', type: 'media_console', x: 140, y: 340, w: 160, d: 45, rot: 0, material: 'walnut', zIndex: 2 },
      { id: 'item-d8', type: 'plant_large', x: 360, y: 70, w: 50, d: 50, rot: 0, material: 'sage', zIndex: 3 }
    ]
  },
  {
    id: 'kitchen',
    name: 'Kitchen & Nook',
    icon: '🍳',
    category: 'Kitchen',
    description: 'Functional cooking zone paired with an inviting breakfast corner.',
    width: 420,
    length: 380,
    height: 260,
    wallColor: '#F2EFEB',
    floorType: 'tile_terrazzo',
    windows: [{ wall: 'left', offset: 110, width: 150, height: 130, elevation: 100 }],
    doors: [{ wall: 'bottom', offset: 280, width: 90, height: 210, swing: 'in-left' }],
    items: [
      { id: 'item-win-k1', type: 'window_casement', x: 0, y: 110, w: 16, d: 150, rot: 0, elevation: 100, material: 'white', zIndex: 1 },
      { id: 'item-door-k1', type: 'door_passage', x: 280, y: 364, w: 90, d: 16, rot: 0, elevation: 0, material: 'oak', zIndex: 1 },
      { id: 'item-k1', type: 'media_console', x: 60, y: 50, w: 180, d: 65, rot: 0, material: 'white', zIndex: 2 },
      { id: 'item-k2', type: 'table_dining_round', x: 270, y: 130, w: 110, d: 110, rot: 0, material: 'oak', zIndex: 2 },
      { id: 'item-k3', type: 'chair_dining', x: 230, y: 130, w: 48, d: 52, rot: 90, material: 'boucle', zIndex: 2 },
      { id: 'item-k4', type: 'chair_dining', x: 310, y: 130, w: 48, d: 52, rot: 270, material: 'boucle', zIndex: 2 },
      { id: 'item-k5', type: 'plant_large', x: 340, y: 40, w: 45, d: 45, rot: 0, material: 'sage', zIndex: 3 }
    ]
  },
  {
    id: 'custom',
    name: 'Custom Room',
    icon: '📐',
    category: 'Custom',
    description: 'A blank room canvas ready for your bespoke floor plan.',
    width: 400,
    length: 400,
    height: 260,
    wallColor: '#FAF8F5',
    floorType: 'wood_oak',
    windows: [{ wall: 'top', offset: 120, width: 160, height: 140, elevation: 90 }],
    doors: [{ wall: 'bottom', offset: 60, width: 90, height: 210, swing: 'in-left' }],
    items: [
      { id: 'item-win-c1', type: 'window_casement', x: 120, y: 0, w: 160, d: 16, rot: 0, elevation: 85, material: 'white', zIndex: 1 },
      { id: 'item-door-c1', type: 'door_passage', x: 60, y: 384, w: 90, d: 16, rot: 0, elevation: 0, material: 'oak', zIndex: 1 }
    ]
  }
];

export const ARTICLES = [
  {
    id: 'small-living-rooms',
    category: 'Small Spaces',
    readTime: '5 min read',
    tag: 'Layout Masterclass',
    title: 'The Art of Floating Furniture: Why Pushing Sofas Against Walls Shrinks Your Space',
    summary: 'Our natural instinct in compact living rooms is to glue all furniture to the perimeter. Here is why stepping your sofa just 15 cm into the room makes it feel twice as expansive.',
    date: 'Autumn 2026',
    heroIcon: '🛋️',
    gradient: 'linear-gradient(135deg, #E6EFEA 0%, #D8E5DC 100%)',
    featuredPieces: ['sofa_3', 'rug_large', 'table_coffee'],
    content: `
      <p class="lead">When decorating a room with limited square footage, almost everyone makes the same unconscious mistake: shoving every single chair, sofa, and bookshelf flush against the drywall in an attempt to create a wide "clearing" in the middle.</p>
      
      <h3>The "Perimeter Trap"</h3>
      <p>In interior architecture, this is known as the perimeter trap. Rather than making a room feel spacious, wall-to-wall hugging draws attention directly to the boundary lines, making the room feel like an empty hallway with furniture parked on the edges.</p>

      <blockquote>“Floating your seating creates depth and shadow behind the pieces, tricking the eye into perceiving the room as layered rather than constricted.”</blockquote>

      <h3>3 Rules for Floating Furniture</h3>
      <ol>
        <li><strong>The 15-Centimeter Breathing Gap:</strong> Pull your main sofa at least 15 to 20 cm away from the back wall. Place a slender console table or floor lamp in the slipway to create intentional depth.</li>
        <li><strong>Anchor with the Front-Leg Rule:</strong> Ensure that at least the two front legs of your sofa and accent chairs rest firmly on your area rug. A floating rug isolates furniture; an anchored rug ties the conversation circle together.</li>
        <li><strong>Define the Primary Walkway:</strong> Leave a clear 75–90 cm path from the doorway to the seating area. If visitors have to sidestep a coffee table to reach a chair, the layout feels crowded regardless of room size.</li>
      </ol>
    `
  },
  {
    id: 'lighting-layers',
    category: 'Lighting & Mood',
    readTime: '4 min read',
    tag: 'Atmosphere',
    title: 'The Three Layers of Interior Lighting: Ambient, Task, and Accent',
    summary: 'Never rely on a single overhead ceiling fixture. Discover how layering warm light pools creates depth, tranquility, and sanctuary after dusk.',
    date: 'October 2026',
    heroIcon: '💡',
    gradient: 'linear-gradient(135deg, #FAF1DF 0%, #F0DEC2 100%)',
    featuredPieces: ['lamp_floor', 'media_console'],
    content: `
      <p class="lead">Architects frequently call the single bright center ceiling fixture the "interrogation light." To make a home feel warm and relaxing in the evening, lighting must be cast at varied heights across three distinct layers.</p>

      <h3>Layer 1: Ambient Light (The Base)</h3>
      <p>Ambient light replaces daylight when the sun goes down. Instead of an unshielded bulb, opt for frosted shades, cove lighting, or dimmable recessed lights that wash walls rather than beaming directly downward.</p>

      <h3>Layer 2: Task Light (The Function)</h3>
      <p>Task lighting targets specific work surfaces: an angled lamp on your writing desk, under-cabinet strips on kitchen counters, or an adjustable reading sconce nestled beside the bed headboard.</p>

      <h3>Layer 3: Accent Light (The Magic)</h3>
      <p>Accent lighting is the emotional glue of interior styling. Think of a brass floor lamp washing upward across a potted olive tree, or a low-wattage warm lamp perched atop a wooden media console. This creates soft focal points that draw the gaze and unwind the nervous system.</p>
    `
  },
  {
    id: 'ergonomic-home-office',
    category: 'Work From Home',
    readTime: '6 min read',
    tag: 'Productivity',
    title: 'Ergonomic & Elegant: Designing a Work From Home Corner You Actually Love',
    summary: 'Balancing spinal health and aesthetic harmony. How to position your desk relative to windows, manage cord clutter, and keep work separate from downtime.',
    date: 'September 2026',
    heroIcon: '🖥️',
    gradient: 'linear-gradient(135deg, #EAECE6 0%, #DFE4D8 100%)',
    featuredPieces: ['desk_large', 'chair_office', 'bookshelf'],
    content: `
      <p class="lead">The greatest challenge of modern home offices is preventing utilitarian office gear from ruining the serene, residential feel of your living space or bedroom.</p>

      <h3>Window Placement: Perpendicular is King</h3>
      <p>Never place your desk directly facing a bright window (causes pupil strain during screen work) or with your back directly against it (causes screen glare on Zoom calls). Instead, align your desk perpendicular to the window so soft natural light illuminates your work surface sideways.</p>

      <h3>The 90-Degree Ergonomic Triangle</h3>
      <ul>
        <li><strong>Elbows:</strong> Should rest at 90–100 degrees flat on the desk surface without raising your shoulders.</li>
        <li><strong>Eyes:</strong> The top third of your computer display should align horizontally with your resting eye level.</li>
        <li><strong>Feet:</strong> Must rest flat on the floor or on an angled wooden footrest.</li>
      </ul>
    `
  },
  {
    id: 'biophilic-design',
    category: 'Wellbeing',
    readTime: '4 min read',
    tag: 'Biophilic Living',
    title: 'Biophilic Interior Design: Bringing Nature Indoors with Foliage & Earth Tones',
    summary: 'Scientific studies show that incorporating natural textures, terracotta pottery, and live botanicals lowers resting heart rates by up to 12%.',
    date: 'August 2026',
    heroIcon: '🪴',
    gradient: 'linear-gradient(135deg, #E2EDE3 0%, #CDE0D0 100%)',
    featuredPieces: ['plant_large', 'chair_arm'],
    content: `
      <p class="lead">Biophilic design is more than just buying a houseplant; it is the deliberate practice of connecting our built indoor environments to the natural world through tactile materials, filtered light, and living organisms.</p>

      <h3>The Rule of Odd Botanical Groupings</h3>
      <p>Plants appear most natural when grouped in odd numbers (1, 3, or 5) with varying foliage heights. Pair a tall vertical statement plant (like a Fiddle Leaf Fig) with a mid-height bushy plant and a cascading trailing plant on a shelf.</p>

      <h3>Earthy Material Textures</h3>
      <p>Counteract synthetic screens and plastic casings with raw tactile elements: unglazed terracotta pots, slatted oak furniture, nubby bouclé or linen fabrics, and woven jute floor rugs.</p>
    `
  },
  {
    id: 'traffic-flow-clearances',
    category: 'Architecture',
    readTime: '5 min read',
    tag: 'Floor Planning',
    title: 'The 3-Foot Clearance Rule: Walkways and Rhythms in Home Planning',
    summary: 'Every comfortable home has subconscious rhythmic pacing. Learn the essential millimeter clearances architects use for doors, chairs, and coffee tables.',
    date: 'July 2026',
    heroIcon: '📐',
    gradient: 'linear-gradient(135deg, #F1ECE6 0%, #E2D7CC 100%)',
    featuredPieces: ['table_dining', 'chair_dining', 'table_coffee'],
    content: `
      <p class="lead">Have you ever visited a home that felt frustratingly tight, even though the rooms were technically huge? The culprit is almost always clearance spacing.</p>

      <h3>Standard Interior Clearances</h3>
      <ul>
        <li><strong>Coffee Table to Sofa:</strong> Exactly 40 to 45 cm. Close enough to set down a cup of tea without standing up, yet wide enough to slide your legs through comfortably.</li>
        <li><strong>Dining Chair Pull-Out:</strong> Minimum 90 cm from the dining table edge to the nearest wall or sideboard so a seated guest can push their chair back without striking obstacles.</li>
        <li><strong>Primary Walkways:</strong> 90 cm to 100 cm between major furniture masses to allow two people to cross paths without turning sideways.</li>
      </ul>
    `
  }
];
