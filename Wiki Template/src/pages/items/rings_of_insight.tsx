export default {
  title: "Rings of Insight",
  order: 4,
  tags: ["accessory", "artifact", "divination"],
  icon: "💍",
  
  text: {
    "Description": "A set of seven silver rings, each inscribed with different runes of knowledge and understanding. When worn together, they form an intricate magical circuit that enhances the wearer's mental capabilities and magical perception.",
    
    "History": "Created by Thorne Blackwood over several decades, each ring was crafted to aid in a specific aspect of magical research and understanding. The full set represents his life's work in magical education and knowledge preservation.",
    
    "Powers": "Each ring provides a unique benefit:\n- Ring of Languages: Allows understanding of any written language\n- Ring of Magical Sight: Reveals magical auras and enchantments\n- Ring of Memory: Enhances recall and memory formation\n- Ring of Analysis: Aids in understanding complex magical theories\n- Ring of Protection: Guards against mental manipulation\n- Ring of Teaching: Helps convey complex concepts to others\n- Ring of Wisdom: Provides insight into the consequences of actions",
    
    "Usage": "While individual rings are useful, their true power manifests when worn as a complete set. The rings must be worn in a specific order to properly channel their magic."
  },
  
  md: true,
  
  rarity: "artifact",
  
  stats: {
    "intelligence": "+2",
    "wisdom": "+2",
    "arcana": "advantage",
    "history": "advantage",
    "weight": "0.7 lbs total"
  },
  
  craftable: false,
  
  links: [
    {
      to: "/characters/thorne_blackwood",
      label: "Thorne Blackwood",
      type: "creator-and-wielder"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/9428799/pexels-photo-9428799.jpeg",
      alt: "Rings of Insight",
      caption: "The seven Rings of Insight arranged in their proper order"
    }
  ],
  
  meta: {
    created: "2025-01-08",
    updated: "2025-01-15",
  }
};