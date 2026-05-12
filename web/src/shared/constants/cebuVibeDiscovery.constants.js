/** Curated Cebu highlights (editorial). */
export const CEBU_VIBE_CATEGORIES = [
  {
    id: 'restaurant',
    label: 'Restaurant',
    blurb: 'Silog, seafood, and chef-led dining',
    gradient: 'from-[#c45c1a] to-[#8b3a0f]'
  },
  {
    id: 'beach',
    label: 'Beach',
    blurb: 'White sand, island hops, sunsets',
    gradient: 'from-[#0d9488] to-[#115e59]'
  },
  {
    id: 'heritage',
    label: 'Heritage',
    blurb: 'Churches, monuments, old streets',
    gradient: 'from-[#7c3aed] to-[#4c1d95]'
  },
  {
    id: 'hotel',
    label: 'Hotel',
    blurb: 'Stays from city to shoreline',
    gradient: 'from-[#b45309] to-[#78350f]'
  },
  {
    id: 'market',
    label: 'Market',
    blurb: 'Dried fish, fruits, local finds',
    gradient: 'from-[#ca8a04] to-[#854d0e]'
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    blurb: 'Rooftops, live bands, late bites',
    gradient: 'from-[#be185d] to-[#831843]'
  }
]

export const mapsUrlForQuery = (query) => {
  const q = encodeURIComponent(String(query || '').trim())
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

export const CEBU_CURATED_SPOTS_BY_VIBE = {
  restaurant: [
    {
      id: 'cebu-lechon-strip',
      name: 'Cebu Lechon trail',
      area: 'Talamban · Cebu City',
      description:
        'Crispy-skinned roast pig—pair with puso and mango for the full island lunch.',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=80',
      rating: 4.9,
      tags: ['Local favorite', 'Family-style']
    },
    {
      id: 'seafood-banquet',
      name: 'Larsian-style grills',
      area: 'Fuente area',
      description: 'Smoke-kissed seafood skewers and sizzling plates after sunset.',
      image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
      rating: 4.7,
      tags: ['Street food', 'Budget-friendly']
    },
    {
      id: 'cafe-rooftops',
      name: 'Third-wave cafés',
      area: 'IT Park · Cebu City',
      description: 'Specialty coffee, pastries, and AC-cooled work-friendly corners.',
      image: 'https://images.unsplash.com/photo-1495474472887-224ef2a3e689?w=800&q=80',
      rating: 4.8,
      tags: ['Coffee', 'Remote-work friendly']
    }
  ],
  beach: [
    {
      id: 'mactan-beaches',
      name: 'Mactan beach clubs',
      area: 'Lapu-Lapu City',
      description: 'Kayaks, cabanas, and reef views a short hop from the airport.',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      rating: 4.8,
      tags: ['Swim', 'Half-day trip']
    },
    {
      id: 'bantayan',
      name: 'Bantayan Island shores',
      area: 'Santa Fe',
      description: 'Powder sand, bike rentals, and quiet sunrise walks.',
      image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
      rating: 4.9,
      tags: ['Island', 'Weekend']
    },
    {
      id: 'moalboal',
      name: 'Moalboal sardine run',
      area: 'South Cebu',
      description: 'Snorkel with shimmering bait balls just off the beach.',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
      rating: 4.9,
      tags: ['Snorkel', 'Adventure']
    }
  ],
  heritage: [
    {
      id: 'magellan-cross',
      name: 'Magellan’s Cross & Basilica',
      area: 'Cebu City downtown',
      description: 'Historic markers and one of the oldest churches in the country.',
      image: 'https://images.unsplash.com/photo-1548625149-fc4a29c7092f?w=800&q=80',
      rating: 4.6,
      tags: ['Walking tour', 'Photo spot']
    },
    {
      id: 'fort-san-pedro',
      name: 'Fort San Pedro',
      area: 'Pier area',
      description: 'Spanish-era fort with gardens and harbor views.',
      image: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&q=80',
      rating: 4.5,
      tags: ['Museum', 'History']
    },
    {
      id: 'carbon-market',
      name: 'Colon heritage walk',
      area: 'Colon Street',
      description: 'Old storefronts, street food, and stories of trade-era Cebu.',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
      rating: 4.3,
      tags: ['Culture', 'Street scene']
    }
  ],
  hotel: [
    {
      id: 'cebu-city-stays',
      name: 'Cebu City skyline hotels',
      area: 'Ayala · IT Park',
      description: 'Rooftop pools, gyms, and quick access to malls and dining.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      rating: 4.7,
      tags: ['City center', 'Business travel']
    },
    {
      id: 'mactan-resorts',
      name: 'Mactan resort strip',
      area: 'Lapu-Lapu',
      description: 'Beachfront rooms, spas, and airport transfers.',
      image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
      rating: 4.8,
      tags: ['Resort', 'Airport nearby']
    },
    {
      id: 'south-cebu-hideaways',
      name: 'South Cebu boutique stays',
      area: 'Dalaguete · Oslob',
      description: 'Hillside inns and coastal guesthouses near whale sharks and falls.',
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
      rating: 4.6,
      tags: ['Boutique', 'Nature']
    }
  ],
  market: [
    {
      id: 'taboan',
      name: 'Taboan dried fish market',
      area: 'Carbon area',
      description: 'Famous for danggit and pusit—bring a tote and haggle politely.',
      image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
      rating: 4.5,
      tags: ['Pasalubong', 'Local']
    },
    {
      id: 'sugbo-mercado',
      name: 'Night food markets',
      area: 'IT Park',
      description: 'Weekend stalls with grilled skewers, desserts, and live acoustic sets.',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80',
      rating: 4.6,
      tags: ['Food hall', 'Evening']
    },
    {
      id: 'sidewalk-fruits',
      name: 'Sidewalk fruit stands',
      area: 'Fuente Osmena',
      description: 'Mangoes, lanzones, and buko juice for tropical snacks on the go.',
      image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=80',
      rating: 4.4,
      tags: ['Fresh', 'Budget']
    }
  ],
  nightlife: [
    {
      id: 'roofdeck-cebu',
      name: 'Rooftop lounges',
      area: 'Cebu Business Park',
      description: 'Craft cocktails, skyline views, and DJ sets on weekends.',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
      rating: 4.6,
      tags: ['Cocktails', 'Views']
    },
    {
      id: 'live-music',
      name: 'Live band bars',
      area: 'Mango Square area',
      description: 'Cover bands, beer buckets, and late-night street food nearby.',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      rating: 4.4,
      tags: ['Live music', 'Night out']
    },
    {
      id: 'late-bites',
      name: 'Late-night tapsilog spots',
      area: 'Across metro',
      description: '24-hour diners for tapsilog, batchoy, and hot tsokolate after hours.',
      image: 'https://images.unsplash.com/photo-1551218807-94f36778b4d3?w=800&q=80',
      rating: 4.5,
      tags: ['24/7', 'Comfort food']
    }
  ]
}
