export default {
  title: "Academy of Arcane Arts",
  order: 2,
  tags: ["institution", "magic", "education"],
  icon: "🏰",
  
  text: {
    "Description": "The Academy of Arcane Arts is the premier magical institution in the realm, housed in a sprawling castle complex that seamlessly blends ancient architecture with magical innovations. Floating towers and impossible geometries mark it as a place where the normal rules of reality hold less sway.",
    
    "History": "Founded over five centuries ago by the legendary Archmage Celestia, the Academy has served as the central hub of magical education and research in the realm. Its libraries contain the largest collection of magical knowledge outside the Royal Archives.",
    
    "Layout": "The Academy consists of several distinct areas:\n- The Grand Hall: Central gathering place and administrative center\n- The Spire of Elements: Where practical magic is taught and practiced\n- The Forbidden Archives: Repository of dangerous magical knowledge\n- The Gardens of Meditation: Magical gardens for study and reflection\n- The Dormitories: Housing for students and faculty\n- The Research Wings: Specialized facilities for advanced magical study",
    
    "Current Status": "Under the leadership of Archmage Valeriana, the Academy continues to train new generations of mages while conducting cutting-edge magical research. Recent events involving former student Morrigan have led to increased security around dangerous magical knowledge."
  },
  
  md: true,
  
  coordinates: {
    x: 120,
    y: 450
  },
  
  inhabitants: [
    "Archmage Valeriana",
    "Thorne Blackwood",
    "Various Faculty Members",
    "Hundreds of Students"
  ],
  
  pointsOfInterest: [
    "The Celestial Observatory",
    "The Eternal Flame",
    "The Wall of Names",
    "The Whispering Fountain",
    "The Portal Nexus"
  ],
  
  dangerLevel: 3,
  
  links: [
    {
      to: "/characters/thorne_blackwood",
      label: "Thorne Blackwood",
      type: "resident"
    },
    {
      to: "/characters/lyra_stormborn",
      label: "Lyra Stormborn",
      type: "alumnus"
    },
    {
      to: "/characters/morrigan",
      label: "Morrigan the Crow",
      type: "former-student"
    }
  ],
  
  images: [
    {
      src: "https://images.pexels.com/photos/5059918/pexels-photo-5059918.jpeg",
      alt: "Academy of Arcane Arts",
      caption: "The main towers of the Academy against a stormy sky"
    }
  ],
  
  meta: {
    created: "2025-01-05",
    updated: "2025-01-15",
  }
};