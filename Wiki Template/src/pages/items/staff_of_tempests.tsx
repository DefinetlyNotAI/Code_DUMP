import { ItemPage } from '../../types/WikiTypes';

const item: ItemPage = {
  title: "Staff of Tempests",
  order: 2,
  tags: ["weapon", "artifact", "weather magic"],
  icon: "⚡",
  rating: 5, // Legendary item
  
  text: {
    "Description": "A masterwork of weather magic crafted from ancient driftwood and crowned with a perpetually stormy orb. The staff pulses with barely contained electrical energy, and small clouds form in its wake when its power is awakened.",
    
    "History": "Created by the legendary storm mage Aldren during the Age of Tempests, this staff was specifically designed to help control and direct the Great Storms that once plagued the coastal regions.",
    
    "Powers": "The Staff of Tempests grants its wielder extraordinary control over weather phenomena. It can be used to call lightning, create localized storms, or calm natural tempests. In the hands of a skilled weather mage, it can even create small hurricanes or part storm clouds.",
    
    "Current Status": "Currently wielded by Lyra Stormborn, who uses its powers to protect coastal communities from dangerous weather patterns. The staff seems to have formed a particular bond with her, possibly due to her birth during the Great Tempest."
  },
  
  md: true,
  
  rarity: "legendary",
  
  stats: {
    "damage": "1d6+4 lightning",
    "type": "magical staff",
    "weight": "4 lbs",
    "properties": ["magical", "requires attunement by a spellcaster"]
  },
  
  craftable: false,
  
  links: [
    {
      to: "/characters/lyra_stormborn",
      label: "Lyra Stormborn",
      type: "current-wielder"
    },
    {
      to: "/abilities/call_lightning",
      label: "Call Lightning",
      type: "granted-ability"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/5755160/pexels-photo-5755160.jpeg",
      alt: "Staff of Tempests",
      caption: "The Staff of Tempests crackling with electrical energy"
    }
  ],
  
  meta: {
    created: "2025-01-05",
    updated: "2025-01-12",
  }
};

export default item;