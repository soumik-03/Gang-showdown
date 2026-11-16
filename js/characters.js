/**
 * ===================================================================
 *  ROSTER CONFIGURATION - 4 DISTINCT 3D CHARACTERS
 * ===================================================================
 *  1. Detective Bot ("Inspector Clue")
 *  2. Cyber Mage ("Chrono Wizard")
 *  3. Compass Scout ("The Navigator")
 *  4. Magma Golem ("Pyre Titan")
 */

window.CHARACTERS = [
  {
    id: "detective",
    name: "Inspector Clue",
    nickname: "Detective Bot",
    tagline: "Every crime scene solved, every combo calculated.",
    avatar: "assets/avatars/detective_head.png",
    fullImage: "assets/avatars/detective.png",
    themeColor: "#00d2d3",
    body: {
      type: "detective",
      primary: "#2e86de",      // Teal robot metal
      secondary: "#dcdde1",    // Khaki trench coat
      hat: "#8395a7",          // Fedora
      glow: "#10ac84"          // LED eye screen
    },
    quotes: {
      intro: "Scanning target... elementary, my dear friend!",
      super: "CASE CLOSED: ULTIMATE DEDUCTION BEAM!",
      win: "Guilty of underestimating me!",
      roast: "You left more clues than a rookie burglar."
    },
    superMove: {
      id: "detective_beam",
      name: "MAGNIFYING SOLAR BEAM",
      shout: "ELEMENTARY! CASE IS OFFICIALLY CLOSED!",
      auraColor: "#00d2d3",
      damage: 85,
      type: "energy_beam",
      projectileIcon: "🔍",
      speed: 16
    }
  },
  {
    id: "wizard",
    name: "Cyber Mage",
    nickname: "Chrono Wizard",
    tagline: "Master of search algorithms and digital sorcery.",
    avatar: "assets/avatars/wizard_head.png",
    fullImage: "assets/avatars/wizard.png",
    themeColor: "#3742fa",
    body: {
      type: "wizard",
      primary: "#1e3799",      // Blue starry velvet robe
      secondary: "#ffffff",    // Flowing white beard
      hat: "#0c2461",          // Wizard hat
      glow: "#00f2fe"          // Cyber visor glow
    },
    quotes: {
      intro: "Querying the arcane databases... Let's duel!",
      super: "404 DEFENSE NOT FOUND: COSMIC OVERRIDE!",
      win: "Spell compiled with zero errors.",
      roast: "Your technique was deprecated in the 90s."
    },
    superMove: {
      id: "wizard_vortex",
      name: "CYBER STORM VORTEX",
      shout: "ERROR 404: DEFENSE NOT FOUND! TORNADO!!",
      auraColor: "#3742fa",
      damage: 85,
      type: "projectile_swarm",
      projectileIcon: "🔮",
      speed: 15
    }
  },
  {
    id: "explorer",
    name: "Compass Scout",
    nickname: "The Navigator",
    tagline: "Never lost in the wild, never misses a roundhouse.",
    avatar: "assets/avatars/explorer_head.png",
    fullImage: "assets/avatars/explorer.png",
    themeColor: "#ffa502",
    body: {
      type: "explorer",
      primary: "#c8d6e5",      // Compass casing
      secondary: "#e67e22",    // Safari utility vest
      hat: "#f39c12",          // Safari sun hat
      glow: "#00d2d3"          // Glowing compass needle
    },
    quotes: {
      intro: "Heading true North — straight into battle!",
      super: "TRUE NORTH STRIKE: 360° STORM!",
      win: "Just another uncharted territory conquered!",
      roast: "You need a compass just to find your guard."
    },
    superMove: {
      id: "compass_strike",
      name: "TRUE NORTH MAGNETIC CRUSH",
      shout: "HEADING TRUE NORTH! 360 DEGREE IMPACT!!",
      auraColor: "#ffa502",
      damage: 85,
      type: "energy_beam",
      projectileIcon: "🧭",
      speed: 16
    }
  },
  {
    id: "golem",
    name: "Pyre Titan",
    nickname: "Magma Golem",
    tagline: "Forged in tectonic lava, unyielding as obsidian stone.",
    avatar: "assets/avatars/golem_head.png",
    fullImage: "assets/avatars/golem.png",
    themeColor: "#ff4757",
    body: {
      type: "golem",
      primary: "#2f3640",      // Obsidian rock armor
      secondary: "#ff4757",    // Molten magma seams
      hat: "#eb2f06",          // Core
      glow: "#ffa502"          // Molten eye slit
    },
    quotes: {
      intro: "Core temperature rising! Feel the volcanic heat!",
      super: "TECTONIC CATACLYSM: MOLTEN SHIELD SLAM!",
      win: "Solid as rock, burning as fire!",
      roast: "Turned to ash before you could even ignite."
    },
    superMove: {
      id: "golem_slam",
      name: "VOLCANIC SHIELD SLAM",
      shout: "MOLTEN ERUPTION! CRUSH TO ASHES!!",
      auraColor: "#ff4757",
      damage: 85,
      type: "ground_slam",
      projectileIcon: "🛡️",
      speed: 18
    }
  }
];

window.getCharacterById = function(id) {
  return window.CHARACTERS.find(c => c.id === id) || window.CHARACTERS[0];
};
