export default {
  title: "Sword of Truth",
  order: 2,
  tags: ["weapon", "legendary", "quest item"],
  icon: "⚔️",
  
  text: {
    "Description": "The Sword of Truth is a legendary blade forged by the ancient elven smith Elorin during the Age of Wonders. Its blade glows with a pale blue light when danger is near, and it can cut through magical barriers as if they were mist.",
    
    "History": "Created over a thousand years ago, the Sword of Truth was wielded by the hero Aranthir during the Demon Wars. It was thought lost after Aranthir's final battle with the demon lord Maelrok, but rumors persist that it lies hidden in the Forgotten Temple deep within the Shadow Forest.",
    
    "Powers": "The Sword of Truth grants its wielder +5 to attack rolls and deals 2d8+3 damage. Additionally, it ignores magical resistance and can dispel illusions with a touch. The blade's warning glow provides advantage on initiative rolls when ambushed.",
    
    "Quest Information": "Players can obtain the Sword of Truth by completing the quest **'Echoes of Truth'** which begins in the village of Mirefall when speaking with the elder Gwendolyn. The quest requires characters to be at least level 12."
  },
  
  md: true,
  
  rarity: "legendary",
  stats: {
    "damage": "2d8+3",
    "type": "slashing",
    "weight": "3 lbs",
    "properties": "finesse, magical, two-handed"
  },
  
  links: [
    {
      to: "/characters/aranthir",
      label: "Aranthir the Brave",
      type: "previous-wielder"
    },
    {
      to: "/locations/shadow_forest",
      label: "Shadow Forest",
      type: "found-at"
    },
    {
      to: "/quests/echoes_of_truth",
      label: "Echoes of Truth",
      type: "related-quest"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/7886852/pexels-photo-7886852.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      alt: "Sword of Truth",
      caption: "The Sword of Truth, its blade glowing with ethereal light"
    }
  ],
  
  meta: {
    created: "2025-01-05",
    updated: "2025-01-10",
  }
};