> [!WARNING]
>
> This is close to be complete, but I lost motivation, it works but not using the provided JSON, rather uses hard-coded const, You are free to modify this 90% complete project!



# Game Data JSON Documentation

This document explains the structure and usage of all JSON files in the `public/data/` directory for the Gacha RPG game.

## Table of Contents

1. [Characters](#characters)
2. [Weapons](#weapons)
3. [Gacha Pools](#gacha-pools)
4. [Currency](#currency)

---

## Characters

**Location:** `public/data/characters/`

Character JSON files define the stats, abilities, and progression data for playable characters.

### File Structure

```json
{
  "name": "Character Display Name",
  "rarity": 5,
  "element": "Pyro",
  "weapon_type": "Greatsword",
  "base_stats": {
    "hp_modifier": 10,
    "atk_modifier": 3,
    "def_modifier": 4,
    "crit_rate": 5,
    "crit_dmg": 50
  },
  "max_level": 80,
  "ascensions": [
    {
      "level": 20,
      "materials": {
        "blazing_ember": 3
      }
    }
  ],
  "constellations": [
    {
      "id": "s1",
      "effect": "Basic ATK deals 10% more damage"
    }
  ],
  "passives": [
    {
      "id": "flame_step",
      "desc": "Immune to fire terrain damage and gains 10% movement speed on fire terrain"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name of the character |
| `rarity` | number | Star rating (1-5) |
| `element` | string | Element type: `Pyro`, `Hydro`, `Electro`, `Anemo`, `Geo`, `Cryo`, `Dendro` |
| `weapon_type` | string | Compatible weapon type: `Sword`, `Greatsword`, `Polearm`, `Bow`, `Catalyst` |
| `base_stats.hp_modifier` | number | HP scaling per level |
| `base_stats.atk_modifier` | number | ATK scaling per level |
| `base_stats.def_modifier` | number | DEF scaling per level |
| `base_stats.crit_rate` | number | Base critical hit rate percentage |
| `base_stats.crit_dmg` | number | Base critical damage percentage |
| `max_level` | number | Maximum character level |
| `ascensions` | array | Ascension requirements at each phase |
| `ascensions[].level` | number | Required level for this ascension |
| `ascensions[].materials` | object | Required materials (item_id: count) |
| `constellations` | array | Constellation upgrades (C1-C6) |
| `constellations[].id` | string | Unique constellation identifier |
| `constellations[].effect` | string | Description of constellation effect |
| `passives` | array | Passive abilities |
| `passives[].id` | string | Unique passive identifier |
| `passives[].desc` | string | Description of passive effect |

### Usage Notes

- Character files should be named using lowercase with underscores (e.g., `eris.json`)
- The filename (without .json) is used as the character key in the game
- Base stats are multiplied by character level to calculate final stats
- Ascension materials must exist in the items system

---

## Weapons

**Location:** `public/data/weapons/`

Weapon JSON files define weapon stats, scaling, and enhancement data.

### File Structure

```json
{
  "name": "Weapon Display Name",
  "rarity": 5,
  "type": "Greatsword",
  "base_stats": {
    "atk_modifier": 6,
    "crit_rate": 5,
    "crit_dmg": 20
  },
  "max_level": 90,
  "ascensions": [
    {
      "level": 20,
      "materials": [
        {
          "item": "weapon_crystal",
          "count": 2
        }
      ]
    }
  ],
  "constellations": [
    {
      "id": "s1",
      "effect": "Charge attack deals 20% more damage"
    }
  ],
  "passive": {
    "name": "Passive Ability Name",
    "description": "Description of the passive effect"
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name of the weapon |
| `rarity` | number | Star rating (1-5) |
| `type` | string | Weapon type: `Sword`, `Greatsword`, `Polearm`, `Bow`, `Catalyst` |
| `base_stats.atk_modifier` | number | ATK scaling per level |
| `base_stats.crit_rate` | number | Critical hit rate bonus |
| `base_stats.crit_dmg` | number | Critical damage bonus |
| `max_level` | number | Maximum weapon level |
| `ascensions` | array | Ascension requirements |
| `ascensions[].level` | number | Required level for ascension |
| `ascensions[].materials` | array | Required materials list |
| `ascensions[].materials[].item` | string | Material item ID |
| `ascensions[].materials[].count` | number | Required quantity |
| `constellations` | array | Refinement effects (R1-R5) |
| `constellations[].id` | string | Refinement identifier |
| `constellations[].effect` | string | Refinement effect description |
| `passive` | object | Weapon passive ability |
| `passive.name` | string | Passive ability name |
| `passive.description` | string | Passive ability description |

### Usage Notes

- Weapon files should be named using lowercase with underscores
- The `type` field must match character `weapon_type` for compatibility
- Refinement levels (constellations) stack with each duplicate weapon merged
- Base ATK = 100 + (level × atk_modifier)

---

## Gacha Pools

**Location:** `public/data/pools/`

Pool JSON files define gacha rates, pity systems, and available items.

### File Structure

```json
{
  "rarity_rates": {
    "5": 0.006,
    "4": 0.051,
    "3": 0.943
  },
  "pity": {
    "hard": 80,
    "guaranteed_4star_every": 10
  },
  "currency_costs": {
    "orb_per_wish": 1,
    "orb_cost": 100
  },
  "featured": ["Eris"],
  "standard": ["Lumen", "Dusk"],
  "pool_3star": ["Kael", "Mira", "Finn"],
  "pool_4star": ["Zara", "Thane", "Luna"],
  "pool_5star": ["Eris", "Lumen", "Dusk"]
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `rarity_rates` | object | Base probability for each rarity |
| `rarity_rates.5` | number | 5-star base rate (0.006 = 0.6%) |
| `rarity_rates.4` | number | 4-star base rate (0.051 = 5.1%) |
| `rarity_rates.3` | number | 3-star base rate (0.943 = 94.3%) |
| `pity.hard` | number | Guaranteed 5-star at this many pulls |
| `pity.guaranteed_4star_every` | number | Guaranteed 4-star every X pulls |
| `currency_costs.orb_per_wish` | number | Orbs required per single wish |
| `currency_costs.orb_cost` | number | Gems required to buy 1 orb |
| `featured` | array | Featured 5-star items (50% rate up) |
| `standard` | array | Standard 5-star items |
| `pool_3star` | array | Available 3-star items |
| `pool_4star` | array | Available 4-star items |
| `pool_5star` | array | All available 5-star items |

### Usage Notes

- Rates should add up to 1.0 (100%)
- Featured items have 50% chance when pulling a 5-star
- Pity counter resets when a 5-star is pulled
- Item names in pools must match character/weapon file names

### Pity System Mechanics

1. **Soft Pity**: Rates increase after pull 74
2. **Hard Pity**: Guaranteed 5-star at pull 80
3. **50/50 System**: 
   - First 5-star: 50% chance featured, 50% standard
   - If standard pulled: Next 5-star is guaranteed featured
4. **4-Star Pity**: Guaranteed 4-star every 10 pulls

---

## Currency

**Location:** `public/data/currency.json`

Defines the game's currency system and their properties.

### File Structure

```json
{
  "coins": {
    "name": "Coins",
    "description": "Standard currency for upgrades and purchases",
    "icon": "coins",
    "color": "#FFD700"
  },
  "gems": {
    "name": "Gems", 
    "description": "Premium currency obtained through gameplay and purchases",
    "icon": "gem",
    "color": "#4A90E2"
  },
  "orbs": {
    "name": "Orbs",
    "description": "Wish currency used for gacha pulls", 
    "icon": "zap",
    "color": "#9B59B6"
  }
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name of the currency |
| `description` | string | Description of currency usage |
| `icon` | string | Lucide icon name for UI display |
| `color` | string | Hex color code for UI theming |

### Currency Usage

- **Coins**: Used for character/weapon leveling, skill upgrades
- **Gems**: Premium currency, can be exchanged for orbs (100 gems = 1 orb)
- **Orbs**: Gacha currency for wishes (1 orb = 1 wish)

---

## Adding New Content

### Adding a New Character

1. Create `public/data/characters/character_name.json`
2. Add character to appropriate gacha pools
3. Add required ascension materials to items system
4. Update character data in game components if needed

### Adding a New Weapon

1. Create `public/data/weapons/weapon_name.json`
2. Add weapon to appropriate gacha pools
3. Ensure weapon type matches existing character weapon types
4. Add required ascension materials to items system

### Adding New Materials

Materials are referenced by ID in ascension requirements. Common material IDs:

- `blazing_ember`, `flame_core`, `inferno_crystal` (Pyro materials)
- `hydro_crystal`, `water_essence`, `aqua_gem` (Hydro materials)
- `weapon_crystal`, `enhancement_ore` (Weapon materials)
- `exp_book_small`, `exp_book_large` (Experience materials)

---

## File Naming Conventions

- Use lowercase letters only
- Replace spaces with underscores
- Use descriptive names that match in-game references
- Examples: `eris.json`, `inferno_greatsword.json`, `characters.json`

---

## Validation Tips

- Ensure all referenced materials exist in the game's item system
- Verify rarity rates sum to 1.0 in pool files
- Check that weapon types match character weapon_type fields
- Confirm ascension level requirements are achievable
- Test that pity numbers are reasonable for game balance

---

## Example Workflows

### Creating a New 4-Star Hydro Character

1. Create `public/data/characters/marina.json`:
```json
{
  "name": "Marina",
  "rarity": 4,
  "element": "Hydro",
  "weapon_type": "Catalyst",
  "base_stats": {
    "hp_modifier": 8,
    "atk_modifier": 4,
    "def_modifier": 3,
    "crit_rate": 5,
    "crit_dmg": 50
  },
  "max_level": 80,
  "ascensions": [
    {
      "level": 20,
      "materials": { "hydro_crystal": 3 }
    }
  ],
  "constellations": [
    {
      "id": "s1", 
      "effect": "Healing effectiveness increased by 15%"
    }
  ]
}
```

2. Add "Marina" to `pool_4star` array in `public/data/pools/characters.json`

3. Test in dev mode by adding the character and verifying stats/ascension

This documentation should help you understand and modify all the JSON data files effectively!
