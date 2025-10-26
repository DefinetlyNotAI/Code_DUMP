export default {
  title: "Morrigan the Crow",
  order: 3,
  tags: ["human", "necromancer", "antagonist"],
  icon: "🦅",
  
  text: {
    "Biography": "Once a promising student at the Academy of Arcane Arts, Morrigan's obsession with death magic led her down a dark path. After discovering ancient texts about soul manipulation in the academy's restricted section, she began conducting forbidden experiments in secret. When her activities were discovered, she fled rather than face judgment, taking several powerful artifacts with her.\n\nNow she resides in Shadowmere Tower, continuing her research into the boundaries between life and death, gathering followers who share her vision of transcending mortality.",
    
    "Appearance": "Tall and imposing with raven-black hair that seems to move of its own accord, Morrigan cuts a striking figure. Her eyes, once brown, now gleam with an unnatural silver light—a side effect of her necromantic experiments. She favors elaborate black robes adorned with crow feathers and silver runes.",
    
    "Personality": "Calculating and ruthless, yet deeply intellectual, Morrigan views her experiments as necessary steps toward understanding the fundamental nature of existence. She shows little regard for conventional morality but maintains a strict code of intellectual honesty and keeps meticulous records of her research.",
    
    "Goals": "Morrigan seeks to unravel the mysteries of life and death, believing that mortality itself is a flaw that can be corrected through sufficient understanding of soul magic. She dreams of creating a world where death is merely an inconvenience rather than a final end."
  },
  
  md: true,
  
  stats: {
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 20,
    wisdom: 16,
    charisma: 18
  },
  
  affiliations: ["Shadowmere Covenant", "Academy of Arcane Arts (former)"],
  
  relationships: [
    {
      character: "Lyra Stormborn",
      relationship: "Rival"
    },
    {
      character: "Thorne Blackwood",
      relationship: "Former Mentor"
    }
  ],
  
  links: [
    {
      to: "/locations/shadowmere_tower",
      label: "Shadowmere Tower",
      type: "base-of-operations"
    },
    {
      to: "/items/staff_of_whispers",
      label: "Staff of Whispers",
      type: "equipment"
    },
    {
      to: "/abilities/soul_drain",
      label: "Soul Drain",
      type: "signature-spell"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/8132755/pexels-photo-8132755.jpeg",
      alt: "Morrigan the Crow",
      caption: "Morrigan conducting a ritual in Shadowmere Tower"
    }
  ],
  
  meta: {
    created: "2025-01-10",
    updated: "2025-01-15",
  }
};