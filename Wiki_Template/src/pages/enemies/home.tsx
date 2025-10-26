export default {
  title: "Items",
  order: 1,
  tags: ["equipment", "consumables", "quest items"],
  icon: "🛠️",
  
  text: {
    "description": "The world of Aetheria contains countless magical items and artifacts. From simple health potions to legendary weapons of immense power, this section catalogs the various items adventurers may encounter on their journey.",
    "crafting": "Many items can be crafted by characters with the appropriate skills and materials. Crafting recipes and required skills are listed on each item's page.",
    "rarity": "Items in Aetheria are classified by rarity: Common (white), Uncommon (green), Rare (blue), Epic (purple), and Legendary (orange). Higher rarity items typically offer greater power but are more difficult to obtain."
  },
  
  md: true,
  
  links: [
    {
      to: "/characters/home",
      label: "Character Equipment",
      type: "related-category"
    },
    {
      to: "/locations/merchant_district",
      label: "Merchant District",
      type: "related-location"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/5767577/pexels-photo-5767577.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      alt: "Assorted magical items",
      caption: "Various magical items commonly found throughout Aetheria"
    }
  ],
  
  meta: {
    created: "2025-01-01",
    updated: "2025-01-15",
  }
};