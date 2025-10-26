export default {
  title: "Locations",
  order: 1,
  tags: ["cities", "dungeons", "wilderness"],
  icon: "🗺️",
  
  text: {
    "description": "The world of Aetheria is vast and varied, from sprawling cities to mysterious dungeons and untamed wilderness. This section provides information about the various locations adventurers might visit on their journeys, including points of interest, notable NPCs, and potential quests.",
    
    "exploration": "Exploring Aetheria can be rewarding but dangerous. Each region has its own climate, inhabitants, and challenges. Urban areas offer relative safety and access to services, while dungeons and wilderness areas contain valuable treasures guarded by formidable foes.",
    
    "travel": "Travel between locations typically requires several days, depending on the distance and terrain. Roads connect major settlements and are generally safe, though bandits sometimes prey on unwary travelers. Off-road travel is slower and more dangerous, but may lead to undiscovered locations and resources."
  },
  
  md: true,
  
  links: [
    {
      to: "/characters/home",
      label: "Characters",
      type: "related-category"
    },
    {
      to: "/quests/home",
      label: "Quests",
      type: "related-category"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/5842248/pexels-photo-5842248.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      alt: "Map of Aetheria",
      caption: "An ancient map of the known lands of Aetheria"
    }
  ],
  
  meta: {
    created: "2025-01-01",
    updated: "2025-01-15",
  }
};