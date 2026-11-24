import type { MenuCategory, MenuItem, OrderRecord } from '../types/kiosk';

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  makanan: 'Makanan',
  dessert: 'Dessert',
  minuman: 'Minuman',
  paket_combo: 'Paket Combo',
};

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // MAKANAN
  {
    id: 'mkn-01',
    name: 'Nasi Goreng Wagyu',
    category: 'makanan',
    price: 54000,
    image: './src/assets/images/menu_nasi_goreng_wagyu_1795504405151.jpg',
    description: 'Nasi goreng rempah dengan irisan wagyu panggang, telur mata sapi, dan emping.',
    isAvailable: true,
  },
  {
    id: 'mkn-02',
    name: 'Double Smoked Beef Burger',
    category: 'makanan',
    price: 58000,
    image: './src/assets/images/menu_burger_smoked_beef_1795504406981.jpg',
    description: 'Dua lapis patty daging sapi asap, keju cheddar leleh, bawang karamel, brioche bun.',
    isAvailable: true,
  },
  {
    id: 'mkn-03',
    name: 'Chicken Katsu Curry',
    category: 'makanan',
    price: 48000,
    image: './src/assets/images/menu_chicken_katsu_curry_1795504405626.jpg',
    description: 'Ayam katsu renyah disajikan dengan nasi hangat dan saus kari Jepang kental.',
    isAvailable: true,
  },

  // DESSERT
  {
    id: 'dst-01',
    name: 'Classic Tiramisu',
    category: 'dessert',
    price: 36000,
    image: './src/assets/images/menu_tiramisu_classic_1795504405923.jpg',
    description: 'Lapisan ladyfinger espresso, krim mascarpone lembut, dan taburan bubuk kakao.',
    isAvailable: true,
  },
  {
    id: 'dst-02',
    name: 'Basque Burnt Cheesecake',
    category: 'dessert',
    price: 39000,
    image: './src/assets/images/menu_burnt_cheesecake_1795504406401.jpg',
    description: 'Cheesecake panggang karamel dengan tekstur lumer lembut di bagian tengah.',
    isAvailable: true,
  },
  {
    id: 'dst-03',
    name: 'Molten Choco Lava Cake',
    category: 'dessert',
    price: 42000,
    image: './src/assets/images/menu_choco_lava_cake_1795504407176.jpg',
    description: 'Kue cokelat hangat isi lelehan dark chocolate dengan satu scoop es krim vanila.',
    isAvailable: true,
  },

  // MINUMAN
  {
    id: 'mnm-01',
    name: 'Es Kopi Susu Gula Aren',
    category: 'minuman',
    price: 28000,
    image: './src/assets/images/menu_es_kopi_aren_1795504404858.jpg',
    description: 'Double shot espresso arabika, susu segar creamy, dan gula aren organik.',
    isAvailable: true,
  },
  {
    id: 'mnm-02',
    name: 'Iced Ceremonial Matcha',
    category: 'minuman',
    price: 32000,
    image: './src/assets/images/menu_matcha_latte_iced_1795504405431.jpg',
    description: 'Matcha Jepang grade seremonial dikocok lembut dengan susu segar dingin.',
    isAvailable: true,
  },
  {
    id: 'mnm-03',
    name: 'Orange Espresso Tonic',
    category: 'minuman',
    price: 34000,
    image: './src/assets/images/menu_orange_espresso_tonic_1795504405671.jpg',
    description: 'Perpaduan segar espresso dingin, sirup jeruk valencia, dan irisan jeruk kering.',
    isAvailable: true,
  },

  // PAKET COMBO
  {
    id: 'cmb-01',
    name: 'Combo Wagyu & Kopi Aren',
    category: 'paket_combo',
    price: 76000,
    image: './src/assets/images/menu_combo_wagyu_kopi_1795504407608.jpg',
    description: 'Paket hemat Nasi Goreng Wagyu, kentang goreng renyah, dan Es Kopi Susu Gula Aren.',
    isAvailable: true,
  },
  {
    id: 'cmb-02',
    name: 'Combo Burger & Citrus Brew',
    category: 'paket_combo',
    price: 82000,
    image: './src/assets/images/menu_combo_burger_fries_1795504405795.jpg',
    description: 'Double Smoked Beef Burger lengkap dengan kentang goreng berbumbu dan minuman dingin.',
    isAvailable: true,
  },
  {
    id: 'cmb-03',
    name: 'Combo Sweet Afternoon',
    category: 'paket_combo',
    price: 68000,
    image: './src/assets/images/menu_combo_sweet_break_1795504406262.jpg',
    description: 'Basque Burnt Cheesecake, butter croissant hangat, dan iced caramel latte.',
    isAvailable: true,
  },
];

export function createSeedOrders(nowMs: number = Date.now()): OrderRecord[] {
  const m10 = 10 * 60 * 1000;
  const m6 = 6 * 60 * 1000;
  const m2 = 2 * 60 * 1000;

  return [
    {
      id: 'ord-seed-001',
      queueNumber: 'A-001',
      items: [
        {
          menuId: 'cmb-01',
          name: 'Combo Wagyu & Kopi Aren',
          category: 'paket_combo',
          price: 76000,
          qty: 1,
          lineTotal: 76000,
        },
        {
          menuId: 'dst-01',
          name: 'Classic Tiramisu',
          category: 'dessert',
          price: 36000,
          qty: 1,
          lineTotal: 36000,
        },
      ],
      totalQty: 2,
      subtotal: 112000,
      ppn: 12320,
      grandTotal: 124320,
      status: 'finished',
      createdAt: nowMs - m10,
      startedAt: nowMs - m10 + 25000,
      finishedAt: nowMs - m10 + 285000,
      durationSeconds: 260,
    },
    {
      id: 'ord-seed-002',
      queueNumber: 'A-002',
      items: [
        {
          menuId: 'mkn-02',
          name: 'Double Smoked Beef Burger',
          category: 'makanan',
          price: 58000,
          qty: 2,
          lineTotal: 116000,
        },
        {
          menuId: 'mnm-03',
          name: 'Orange Espresso Tonic',
          category: 'minuman',
          price: 34000,
          qty: 2,
          lineTotal: 68000,
        },
      ],
      totalQty: 4,
      subtotal: 184000,
      ppn: 20240,
      grandTotal: 204240,
      status: 'processing',
      createdAt: nowMs - m6,
      startedAt: nowMs - 85000,
      finishedAt: null,
      durationSeconds: 0,
    },
    {
      id: 'ord-seed-003',
      queueNumber: 'A-003',
      items: [
        {
          menuId: 'mkn-03',
          name: 'Chicken Katsu Curry',
          category: 'makanan',
          price: 48000,
          qty: 1,
          lineTotal: 48000,
        },
        {
          menuId: 'mnm-01',
          name: 'Es Kopi Susu Gula Aren',
          category: 'minuman',
          price: 28000,
          qty: 2,
          lineTotal: 56000,
        },
      ],
      totalQty: 3,
      subtotal: 104000,
      ppn: 11440,
      grandTotal: 115440,
      status: 'waiting',
      createdAt: nowMs - m2,
      startedAt: null,
      finishedAt: null,
      durationSeconds: 0,
    },
  ];
}
