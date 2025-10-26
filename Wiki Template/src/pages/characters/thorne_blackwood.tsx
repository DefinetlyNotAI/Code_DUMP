export default {
  title: "Thorne Blackwood",
  order: 4,
  tags: ["human", "archmage", "mentor", "neutral"],
  icon: "📚",
  
  text: {
    "Biography": "Thorne Blackwood has served as the Academy's Master of Forbidden Knowledge for over four decades. His controversial approach to magical education—believing that no knowledge is inherently evil, only its application—has earned him both admirers and enemies within the magical community.\n\nHe personally mentored both Lyra Stormborn and Morrigan the Crow, and carries a deep sense of responsibility for the divergent paths his former students have taken.",
    
    "Appearance": "A tall, thin man with sharp features and graying hair kept in a neat ponytail. His dark eyes seem to hold centuries of knowledge, and he moves with deliberate grace despite his advanced age. Multiple enchanted rings adorn his fingers, each serving a specific purpose in his research.",
    
    "Personality": "Thoughtful and measured in his actions, Thorne believes in teaching students to think critically about magic rather than simply following traditional doctrines. He can be stern when necessary but shows genuine care for his students' development, both magical and moral.",
    
    "Philosophy": "\"Magic is neither good nor evil—it is a tool, like a knife. The same blade that cuts bread can take a life. Our duty is not to hide knowledge, but to teach wisdom in its application.\""
  },
  
  md: true,
  
  stats: {
    strength: 8,
    dexterity: 12,
    constitution: 10,
    intelligence: 20,
    wisdom: 18,
    charisma: 15
  },
  
  affiliations: [
    "Academy of Arcane Arts",
    "Council of Master Mages",
    "Keepers of Forbidden Lore"
  ],
  
  relationships: [
    {
      character: "Lyra Stormborn",
      relationship: "Former Student"
    },
    {
      character: "Morrigan the Crow",
      relationship: "Former Student"
    }
  ],
  
  links: [
    {
      to: "/locations/academy_of_arcane_arts",
      label: "Academy of Arcane Arts",
      type: "residence"
    },
    {
      to: "/items/rings_of_insight",
      label: "Rings of Insight",
      type: "equipment"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/8107066/pexels-photo-8107066.jpeg",
      alt: "Thorne Blackwood",
      caption: "Thorne Blackwood in his study at the Academy"
    }
  ],
  
  meta: {
    created: "2025-01-08",
    updated: "2025-01-15",
  }
};