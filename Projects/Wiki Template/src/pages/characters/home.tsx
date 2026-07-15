export default {
  title: "Characters",
  order: 1,
  tags: ["heroes", "villains", "npcs"],
  icon: "👤",
  
  text: {
    "description": "The world of Aetheria is home to countless beings, from humble villagers to mighty heroes and terrible villains. This section catalogs the various characters that players might encounter during their adventures, providing background information and potential storylines.",
    "factions": "Characters in Aetheria often belong to various factions and organizations, each with their own goals and motivations. Understanding these relationships can be crucial for navigating the complex political landscape.",
    "encounters": "When meeting characters in the wild, remember that not everyone is as they seem. Many have hidden agendas or secrets that may only be revealed through careful conversation or completing specific quests."
  },
  
  md: true,
  
  links: [
    {
      to: "/locations/home",
      label: "Locations",
      type: "related-category"
    },
    {
      to: "/factions/home",
      label: "Factions",
      type: "related-category"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/7624342/pexels-photo-7624342.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      alt: "Diverse characters in a tavern",
      caption: "Characters from various backgrounds gather at the Prancing Pegasus tavern"
    }
  ],
  
  meta: {
    created: "2025-01-01",
    updated: "2025-01-15",
  }
};