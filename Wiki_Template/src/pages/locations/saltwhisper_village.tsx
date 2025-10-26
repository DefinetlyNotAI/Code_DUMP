export default {
  title: "Saltwhisper Village",
  order: 4,
  tags: ["settlement", "coastal", "peaceful"],
  icon: "🏖️",
  
  text: {
    "Description": "A picturesque fishing village nestled along the coast, known for its resilient people and mysterious connection to the sea. The village gets its name from the peculiar whispers heard in the salty breeze, which locals claim carry messages from the ocean itself.",
    
    "History": "Founded by seafaring families centuries ago, Saltwhisper has survived countless storms and maritime threats thanks to its residents' deep understanding of the sea and weather patterns. It gained particular renown as the birthplace of Lyra Stormborn during the Great Tempest.",
    
    "Layout": "The village features several distinct areas:\n- The Harbor: Heart of the village's fishing industry\n- The Market Square: Where fresh catches are sold daily\n- The Storm Shrine: A temple dedicated to weather spirits\n- The Lighthouse: Ancient and rumored to be magical\n- Residential Area: Cozy homes with ocean views\n- The Tidepools: Sacred pools used for meditation",
    
    "Culture": "Life in Saltwhisper revolves around the sea and its moods. The villagers maintain many unique traditions, including the annual Storm Festival celebrating their survival of the Great Tempest. They are known for their weather-prediction abilities and their skill at crafting sea-glass charms."
  },
  
  md: true,
  
  coordinates: {
    x: 45,
    y: 890
  },
  
  inhabitants: [
    "Elder Marina",
    "The Fishing Families",
    "Storm Priests",
    "Craftspeople",
    "Merchants"
  ],
  
  pointsOfInterest: [
    "The Ancient Lighthouse",
    "Storm Shrine",
    "Tidepool Gardens",
    "The Whispering Cliffs",
    "Market Square"
  ],
  
  dangerLevel: 1,
  
  links: [
    {
      to: "/characters/lyra_stormborn",
      label: "Lyra Stormborn",
      type: "birthplace"
    },
    {
      to: "/items/sea_glass_charms",
      label: "Sea Glass Charms",
      type: "local-craft"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/4215113/pexels-photo-4215113.jpeg",
      alt: "Saltwhisper Village",
      caption: "Saltwhisper Village at dawn, with fishing boats heading out to sea"
    }
  ],
  
  meta: {
    created: "2025-01-14",
    updated: "2025-01-15",
  }
};