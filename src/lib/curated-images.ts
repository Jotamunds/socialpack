/**
 * Curadoria estrita de termos de busca e catálogo de imagens editoriais Unsplash em alta resolução.
 * Garante que cada nicho receba exclusivamente fotos contextualizadas ao seu segmento
 * (ex: Cafeteria recebe café/espresso/barista, jamais pizza ou lanches).
 */

export const NICHE_SEARCH_QUERIES: Record<string, string[]> = {
  // Alimentação
  cafeteria: ["coffee", "espresso", "barista", "specialty coffee", "latte art", "cafe interior", "coffee beans"],
  restaurante: ["gourmet dish", "fine dining", "restaurant interior", "chef culinary", "food plating", "gastronomy"],
  pizzaria: ["artisanal pizza", "wood fired pizza", "pizza slice", "sourdough pizza", "pizzeria oven", "italian pizza"],
  hamburgueria: ["artisanal burger", "smash burger", "craft burger", "gourmet burger", "brioche burger", "burger fries"],
  confeitaria: ["patisserie cake", "french pastry", "artisanal dessert", "macarons", "confectionery", "bakery sweets"],
  marmitaria: ["healthy meal prep", "healthy lunch box", "fresh bowl", "balanced meal", "organic food", "wholesome meal"],

  // Beleza e Estética
  barbearia: ["barbershop", "haircut", "beard grooming", "fade haircut", "barber styling", "razor shave", "vintage barber"],
  "clinica-de-estetica": ["aesthetic clinic", "skincare facial", "facial massage", "dermatology treatment", "spa wellness", "skincare beauty"],
  "salao-de-beleza": ["hair salon", "hair styling", "balayage", "hair wash", "salon interior", "hairdresser"],
  "nail-designer": ["nail art", "manicure", "gel nails", "nail polish design", "clean nails", "nail salon"],
  "design-de-sobrancelhas": ["eyebrow shaping", "eyebrow design", "lash lift", "microblading", "clean eyebrows"],

  // Saúde e Bem-estar
  academia: ["gym workout", "fitness training", "dumbbell training", "athlete workout", "fitness center", "bodybuilding"],
  "clinica-odontologica": ["dental clinic", "dentistry smile", "dental care", "dentist office", "teeth whitening"],
  nutricionista: ["healthy nutrition", "wholesome food", "fresh vegetables", "balanced diet", "nutrition planning"],
  psicologia: ["mindful therapy", "calm therapy office", "mental health", "wellness reflection", "peaceful space"],
  fisioterapia: ["physiotherapy", "physical therapy exercise", "rehabilitation clinic", "posture therapy"],
  "studio-de-pilates": ["pilates reformer", "pilates workout", "pilates studio", "posture training", "mindful movement"],

  // Serviços Profissionais
  imobiliaria: ["luxury apartment", "modern architecture", "interior design", "real estate property", "contemporary home", "luxury penthouse"],
  arquitetura: ["architectural interior", "minimalist architecture", "modern building interior", "scandinavian home", "architectural space"],
  advocacia: ["corporate law office", "modern law firm library", "professional legal desk", "lawyer meeting"],
  contabilidade: ["financial consulting", "modern office workspace", "analytics laptop desk", "accounting business"],
  "agencia-de-marketing": ["creative studio workspace", "branding design mockup", "modern agency team", "creative strategy"],

  // Varejo e Lojas
  "loja-de-roupas": ["editorial fashion", "boutique clothing", "fashion rack", "minimalist apparel", "designer clothes"],
  "pet-shop": ["happy groomed dog", "cute puppy care", "pet boutique", "veterinary care", "groomed cat"],
  otica: ["designer glasses eyewear", "optical sunglasses display", "spectacles styling", "modern eyeglasses"],
  floricultura: ["botanical flower bouquet", "florist workshop", "fresh flowers", "floral arrangement"],
  "loja-de-cosmeticos": ["cosmetic skincare bottles", "beauty product packaging", "clean cosmetic display"],
};

export const NICHE_PHOTO_POOLS: Record<string, string[]> = {
  // Cafeteria: 100% café especial, xícaras, grãos, extração de espresso e barista
  cafeteria: [
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&q=80", // xícara café aconchegante
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&q=80", // grãos torrados e café
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1080&q=80", // latte art barista
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1080&q=80", // pour over artesanal
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1080&q=80", // ambiente moderno de cafeteria
    "https://images.unsplash.com/photo-1497636577773-f1231844b336?w=1080&q=80", // extração de espresso
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1080&q=80", // grãos e moedor especial
  ],

  // Barbearia: ferramentas de barbear, fade haircut, navalha, cadeira retrô
  barbearia: [
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1080&q=80", // tesouras e pentes clássicos
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1080&q=80", // salão vintage de barbearia
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1080&q=80", // corte de barba e precisão
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1080&q=80", // tesoura e corte masculino
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1080&q=80", // degradê fade impecável
    "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=1080&q=80", // pomada e acessórios artesanais
    "https://images.unsplash.com/photo-1534778356534-d3d45b6df1da?w=1080&q=80", // estilo e grooming masculino
  ],

  // Clínica de Estética: tratamentos faciais, séruns, bem-estar e pele saudável
  "clinica-de-estetica": [
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1080&q=80", // cuidado facial profissional
    "https://images.unsplash.com/photo-1512290900672-1f41443690d7?w=1080&q=80", // séruns e estética dermatológica
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1080&q=80", // massagem facial relaxante
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1080&q=80", // ambiente limpo e iluminado
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1080&q=80", // aplicação estética facial
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1080&q=80", // spa e bem-estar
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1080&q=80", // pele radiante e natural
  ],

  // Imobiliária: arquitetura contemporânea, interiores sofisticados, luz natural
  imobiliaria: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&q=80", // casa de alto padrão moderna
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1080&q=80", // living room espaçoso e elegante
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1080&q=80", // arquitetura minimalista
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1080&q=80", // fachada contemporânea
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1080&q=80", // cozinha gourmet planejada
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&q=80", // suíte master iluminada
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1080&q=80", // varanda com vista panorâmica
  ],

  // Restaurante: alta gastronomia, empratamentos sofisticados, ambiente refinado
  restaurante: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&q=80", // salão sofisticado de jantar
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1080&q=80", // empratamento autoral de chef
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80", // restaurante à meia luz acolhedor
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&q=80", // prato gourmet com cores vivas
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1080&q=80", // chef finalizando o prato
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1080&q=80", // entrada refinada
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=1080&q=80", // mesa posta elegante
  ],

  // Pizzaria
  pizzaria: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1080&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1080&q=80",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1080&q=80",
    "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=1080&q=80",
    "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=1080&q=80",
    "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=1080&q=80",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1080&q=80",
  ],

  // Hamburgueria
  hamburgueria: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1080&q=80",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1080&q=80",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=1080&q=80",
    "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=1080&q=80",
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1080&q=80",
    "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=1080&q=80",
    "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1080&q=80",
  ],

  // Academia
  academia: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1080&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1080&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&q=80",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1080&q=80",
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1080&q=80",
  ],

  // Salão de Beleza
  "salao-de-beleza": [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1080&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1080&q=80",
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1080&q=80",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1080&q=80",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1080&q=80",
    "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1080&q=80",
    "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1080&q=80",
  ],

  // Loja de Roupas / Moda
  "loja-de-roupas": [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1080&q=80",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1080&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&q=80",
    "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=1080&q=80",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1080&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&q=80",
  ],

  // Arquitetura e Interiores
  arquitetura: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1080&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1080&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1080&q=80",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1080&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1080&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1080&q=80",
  ],
};

export const CATEGORY_PHOTO_POOLS: Record<string, string[]> = {
  alimentacao: [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1080&q=80",
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1080&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&q=80",
    "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1080&q=80",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&q=80",
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1080&q=80",
    "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=1080&q=80",
  ],
  beleza: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1080&q=80",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1080&q=80",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1080&q=80",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1080&q=80",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1080&q=80",
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1080&q=80",
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1080&q=80",
  ],
  saude: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&q=80",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1080&q=80",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1080&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80",
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1080&q=80",
    "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1080&q=80",
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&q=80",
  ],
  servicos: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1080&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1080&q=80",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1080&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1080&q=80",
  ],
  varejo: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080&q=80",
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=1080&q=80",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1080&q=80",
    "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=1080&q=80",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&q=80",
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1080&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&q=80",
  ],
};

const DEFAULT_POOL = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080&q=80",
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1080&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1080&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&q=80",
  "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1080&q=80",
];

/**
 * Retorna a imagem curada mais apropriada para o nicho/categoria com resolução 1080x1080.
 */
export function getCuratedPhoto(
  nicheId?: string,
  categoryId?: string,
  index = 0,
): string {
  if (nicheId && NICHE_PHOTO_POOLS[nicheId]) {
    const pool = NICHE_PHOTO_POOLS[nicheId];
    return pool[index % pool.length];
  }

  if (categoryId && CATEGORY_PHOTO_POOLS[categoryId]) {
    const pool = CATEGORY_PHOTO_POOLS[categoryId];
    return pool[index % pool.length];
  }

  return DEFAULT_POOL[index % DEFAULT_POOL.length];
}
