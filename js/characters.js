/**
 * ===================================================================
 *  FRIEND SHOWDOWN - CHARACTER CONFIGURATION
 * ===================================================================
 *  You can add, edit, or remove friends here easily!
 *  To add your friend's real face:
 *    1. Cut out a photo of their face (PNG with transparent background)
 *    2. Save it in the "assets/avatars/" folder (e.g. "assets/avatars/karan.png")
 *    3. Update the `avatar` path below!
 *  If no photo is provided, the game automatically draws a stylish cartoon head.
 */

window.CHARACTERS = [
  {
    id: "karan",
    name: "Karan",
    nickname: "Late Latif",
    tagline: "Always '5 minutes away' for the last 2 hours.",
    avatar: "assets/avatars/karan.svg",
    themeColor: "#ff4757",
    body: {
      shirt: "#e84118",
      pants: "#2f3640",
      shoes: "#f5f6fa",
      skin: "#fbc531",
      hair: "#2f3640",
      hairStyle: "spiky"
    },
    quotes: {
      intro: "Bhai bas 2 min me pahuch gaya!",
      super: "ULTIMATE EXCUSE: TRAFFIC JAM BARRAGE!",
      win: "Dekha? I told you I'd come through!",
      roast: "You moved slower than my Uber ride."
    },
    superMove: {
      id: "traffic_barrage",
      name: "5-MINUTE BARRAGE",
      shout: "BHAI BAS 2 MINUTE MEIN AA RAHA HU!",
      auraColor: "#ff4757",
      damage: 42,
      type: "projectile_swarm", // Spawns barrage of alarm clocks & unread WhatsApp icons
      projectileIcon: "⏰",
      speed: 14
    }
  },
  {
    id: "aman",
    name: "Aman",
    nickname: "Gym Bro",
    tagline: "Measures friendship in grams of protein.",
    avatar: "assets/avatars/aman.svg",
    themeColor: "#2ed573",
    body: {
      shirt: "#2ed573",
      pants: "#1e272e",
      shoes: "#ffa502",
      skin: "#f7b731",
      hair: "#1e272e",
      hairStyle: "buzzcut"
    },
    quotes: {
      intro: "Aaj legs day hai, par tujhe pelunga!",
      super: "DIET CRUSH: PROTEIN SHAKER EARTHQUAKE!",
      win: "Pure protein power, no cheat day!",
      roast: "Bro, your defense has fewer reps than your bench press."
    },
    superMove: {
      id: "protein_slam",
      name: "SHAKER EARTHQUAKE",
      shout: "PROTEIN IS LIFE! DIET TOD DI!",
      auraColor: "#2ed573",
      damage: 46,
      type: "ground_slam", // Ground shockwave that launches opponent
      projectileIcon: "🥤",
      speed: 18
    }
  },
  {
    id: "rohan",
    name: "Rohan",
    nickname: "Gamer / 999 Ping",
    tagline: "Blames WiFi lag every time he loses an argument.",
    avatar: "assets/avatars/rohan.svg",
    themeColor: "#3742fa",
    body: {
      shirt: "#3742fa",
      pants: "#57606f",
      shoes: "#70a1ff",
      skin: "#fed330",
      hair: "#2f3542",
      hairStyle: "messy"
    },
    quotes: {
      intro: "Mera ping theek hai na? Let's go!",
      super: "LAG SWITCH: 999 PING TELEPORT STRIKE!",
      win: "GG EZ! No re!",
      roast: "You got disconnected from reality."
    },
    superMove: {
      id: "lag_teleport",
      name: "999 PING LAG SWITCH",
      shout: "BHAI LAG HO RAHA THA! TELEPORT!!",
      auraColor: "#70a1ff",
      damage: 44,
      type: "teleport_rush", // Teleports behind opponent with sudden glitch burst
      projectileIcon: "⚡",
      speed: 22
    }
  },
  {
    id: "sneha",
    name: "Sneha",
    nickname: "Tapri Queen",
    tagline: "Fuelled 90% by cutting chai and 10% gossip.",
    avatar: "assets/avatars/sneha.svg",
    themeColor: "#ffa502",
    body: {
      shirt: "#ffa502",
      pants: "#2f3542",
      shoes: "#ff6b81",
      skin: "#f7b731",
      hair: "#2f3542",
      hairStyle: "ponytail"
    },
    quotes: {
      intro: "Ek cutting chai pi ke aati hu, ruk!",
      super: "KADAK CHAI: 100°C TSUNAMI BLAST!",
      win: "Chai aur charcha dono khatam!",
      roast: "Thanda pad gaya re tu!"
    },
    superMove: {
      id: "chai_blast",
      name: "KADAK CHAI TSUNAMI",
      shout: "EK CUTTING CHAI KI KEEMAT TUM KYA JAANO!",
      auraColor: "#ffa502",
      damage: 45,
      type: "energy_beam", // Giant steaming chai blast wave
      projectileIcon: "☕",
      speed: 16
    }
  }
];

// Helper to look up character by ID
window.getCharacterById = function(id) {
  return window.CHARACTERS.find(c => c.id === id) || window.CHARACTERS[0];
};
