export default {
  title: "Shadowmere Tower",
  order: 3,
  tags: ["dungeon", "landmark", "dark magic"],
  icon: "🗼",
  
  text: {
    "Description": "A towering spire of black stone that seems to absorb both light and sound, Shadowmere Tower stands as a foreboding presence on the edge of the Shadow Wastes. The very air around it feels heavy with dark magic, and shadows move in ways they shouldn't.",
    
    "History": "Built during the reign of the Shadow Queen as a focus point for her dark rituals, the tower was abandoned after her defeat and fell into ruin. Recently claimed by Morrigan the Crow as her base of operations, it has been restored to its former dark glory and now serves as both laboratory and fortress.",
    
    "Layout": "The tower consists of several key areas:\n- The Entrance Hall: A trap-filled maze of shadows\n- The Whispering Gallery: Where spirits congregate\n- The Ritual Chambers: Multiple rooms for different types of dark magic\n- The Observatory: Used for astronomical alignments\n- The Living Quarters: Where Morrigan and her followers reside\n- The Void Chamber: A room where reality itself seems uncertain",
    
    "Current Status": "Under Morrigan's control, the tower has become a center for necromantic research and dark magic experimentation. Strange lights and sounds are often reported by those brave or foolish enough to venture near."
  },
  
  md: true,
  
  coordinates: {
    x: 666,
    y: 333
  },
  
  inhabitants: [
    "Morrigan the Crow",
    "Shadow Cultists",
    "Bound Spirits",
    "Various Undead"
  ],
  
  pointsOfInterest: [
    "The Whispering Gallery",
    "The Void Chamber",
    "The Black Library",
    "The Spirit Well",
    "The Shadow Garden"
  ],
  
  dangerLevel: 8,
  
  links: [
    {
      to: "/characters/morrigan",
      label: "Morrigan the Crow",
      type: "resident"
    },
    {
      to: "/items/staff_of_whispers",
      label: "Staff of Whispers",
      type: "artifact-location"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/6862365/pexels-photo-6862365.jpeg",
      alt: "Shadowmere Tower",
      caption: "Shadowmere Tower piercing the perpetually dark sky"
    }
  ],
  
  meta: {
    created: "2025-01-13",
    updated: "2025-01-15",
  }
};