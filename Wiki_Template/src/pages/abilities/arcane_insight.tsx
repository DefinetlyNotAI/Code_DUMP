export default {
  title: "Arcane Insight",
  order: 4,
  tags: ["spell", "divination", "utility"],
  icon: "👁️",
  
  text: {
    "Description": "A complex divination spell that grants the caster deep understanding of magical phenomena. When cast, the caster's eyes glow with inner light as they perceive the flowing currents of magical energy.",
    
    "Casting": "Casting Time: 1 action\nRange: Self\nComponents: Verbal, Somatic\nDuration: Concentration, up to 1 hour",
    
    "Effects": "For the duration, you gain the following benefits:\n- You can see magical auras around creatures and objects\n- You can identify spells as they're being cast without using a reaction\n- You have advantage on Arcana checks\n- You can determine the properties of magical items by studying them for 1 minute",
    
    "Enhanced Casting": "When cast while wearing the Rings of Insight, the spell no longer requires concentration and you can share its effects with up to three other creatures you can see within 30 feet."
  },
  
  md: true,
  
  damage: "N/A",
  manaCost: 25,
  cooldown: 60,
  range: "Self",
  
  upgrades: [
    {
      name: "Penetrating Sight",
      description: "Can see through magical illusions and invisibility",
      level: 5
    },
    {
      name: "Magical Memory",
      description: "Can perfectly recall any magical phenomenon observed while the spell is active",
      level: 10
    },
    {
      name: "True Understanding",
      description: "Can comprehend the purpose and function of any magical effect observed",
      level: 15
    }
  ],
  
  links: [
    {
      to: "/characters/thorne_blackwood",
      label: "Thorne Blackwood",
      type: "known-by"
    },
    {
      to: "/items/rings_of_insight",
      label: "Rings of Insight",
      type: "enhanced-by"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/3214958/pexels-photo-3214958.jpeg",
      alt: "Arcane Insight",
      caption: "A mage using Arcane Insight to study magical phenomena"
    }
  ],
  
  meta: {
    created: "2025-01-08",
    updated: "2025-01-15",
  }
};