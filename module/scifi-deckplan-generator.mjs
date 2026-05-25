const MODULE_ID = "scifi-deckplan-generator";
const ROOT_SCENE_FOLDER = "Generated Maps";
const ASSET_DIR = MODULE_ID;
const GENERATED_WALL_FLAG = `${MODULE_ID}.generatedWall`;
const GENERATED_DRAWING_FLAG = `${MODULE_ID}.generatedDrawing`;
const GENERATED_LIGHT_FLAG = `${MODULE_ID}.generatedLight`;
const GENERATED_TOKEN_FLAG = `${MODULE_ID}.generatedToken`;
const GENERATED_NOTE_FLAG = `${MODULE_ID}.generatedNote`;
const GENERATED_REGION_FLAG = `${MODULE_ID}.generatedRegion`;
const MOVEMENT_NORMAL = CONST.WALL_MOVEMENT_TYPES?.NORMAL ?? CONST.WALL_SENSE_TYPES?.NORMAL ?? 20;
const SENSE_NORMAL = CONST.WALL_SENSE_TYPES?.NORMAL ?? 20;
const SENSE_NONE = CONST.WALL_SENSE_TYPES?.NONE ?? 0;
const DOOR_NONE = CONST.WALL_DOOR_TYPES?.NONE ?? 0;
const DOOR_BASIC = CONST.WALL_DOOR_TYPES?.DOOR ?? 1;
const DOOR_SECRET = CONST.WALL_DOOR_TYPES?.SECRET ?? 2;
const DOOR_STATE_OPEN = CONST.WALL_DOOR_STATES?.OPEN ?? 0;
const DOOR_STATE_CLOSED = CONST.WALL_DOOR_STATES?.CLOSED ?? 1;
const DOOR_STATE_LOCKED = CONST.WALL_DOOR_STATES?.LOCKED ?? 2;

const CIRCULAR_ROOM_TYPES = new Set([
  "reactor",
  "cistern",
  "shrine",
  "observation",
  "ritual-room",
  "forge",
  "boiler-room",
  "pool"
]);

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const GENERATION_MODES = [
  { value: "bsp", label: "BSP Room Layout (Ship/Station)" },
  { value: "corridor", label: "Corridor Graph (Ship/Station)" },
  { value: "geomorph", label: "Geomorph Tile Stitching" },
  { value: "dungeon", label: "Random Dungeon" },
  { value: "building", label: "Random Building" },
  { value: "wilderness", label: "Outdoor Wilderness" }
];

const GRID_SIZES = [
  { value: 50, label: "50 px" },
  { value: 75, label: "75 px" },
  { value: 100, label: "100 px" }
];

const CHAMFER_SIZES = [
  { value: 1, label: "1 Cell" },
  { value: 2, label: "2 Cells" }
];

const GRID_MODE_OPTIONS = [
  { value: "square", label: "Square Grid" },
  { value: "hex-row", label: "Hex Grid (Odd Rows)" }
];

const CORNER_STYLE_OPTIONS = [
  { value: "square", label: "Square" },
  { value: "chamfer", label: "Chamfered" },
  { value: "perturb", label: "Organic" }
];

const MODE_THEME_OPTIONS = {
  bsp: [
    { value: "steel", label: "Steel" },
    { value: "industrial", label: "Industrial" },
    { value: "derelict", label: "Derelict" },
    { value: "alien-organic", label: "Alien Organic" },
    { value: "clean-corporate", label: "Clean Corporate" },
    { value: "alien-terminal", label: "Alien Terminal" }
  ],
  corridor: [
    { value: "steel", label: "Steel" },
    { value: "industrial", label: "Industrial" },
    { value: "derelict", label: "Derelict" },
    { value: "alien-organic", label: "Alien Organic" },
    { value: "clean-corporate", label: "Clean Corporate" },
    { value: "alien-terminal", label: "Alien Terminal" }
  ],
  geomorph: [
    { value: "steel", label: "Steel" },
    { value: "industrial", label: "Industrial" },
    { value: "derelict", label: "Derelict" },
    { value: "clean-corporate", label: "Clean Corporate" },
    { value: "alien-terminal", label: "Alien Terminal" }
  ],
  dungeon: [
    { value: "stone", label: "Stone Dungeon" },
    { value: "cave", label: "Cave System" },
    { value: "wood", label: "Wooden Stronghold" },
    { value: "crypt", label: "Undead Crypt" },
    { value: "sewer", label: "Sewer / Undercroft" }
  ],
  building: [
    { value: "concrete-office", label: "Concrete Office" },
    { value: "wood-floor", label: "Wood Floor" },
    { value: "brick", label: "Brick" },
    { value: "carpet", label: "Carpet" },
    { value: "tile", label: "Tile" },
    { value: "derelict-house", label: "Derelict House" },
    { value: "asylum", label: "Asylum / Hospital" },
    { value: "haunted-manor", label: "Haunted Manor" },
    { value: "bloodbath", label: "Bloodbath Scene" }
  ],
  wilderness: [
    { value: "forest", label: "Temperate Forest" },
    { value: "jungle", label: "Dense Jungle" },
    { value: "plains", label: "Open Plains" },
    { value: "swamp", label: "Swamp / Marsh" },
    { value: "tundra", label: "Frozen Tundra" },
    { value: "badlands", label: "Badlands / Scrub" }
  ]
};

const MODE_HULL_OPTIONS = {
  bsp: [
    { value: "rectangle", label: "Rectangle" },
    { value: "tapered", label: "Tapered Ship" },
    { value: "hammerhead", label: "Hammerhead" },
    { value: "cross", label: "Cross Station" },
    { value: "l-shape", label: "L-Shape" },
    { value: "ring", label: "Ring" }
  ],
  corridor: [
    { value: "rectangle", label: "Rectangle" },
    { value: "tapered", label: "Tapered Ship" },
    { value: "hammerhead", label: "Hammerhead" },
    { value: "cross", label: "Cross Station" },
    { value: "l-shape", label: "L-Shape" },
    { value: "ring", label: "Ring" }
  ],
  geomorph: [
    { value: "rectangle", label: "Tile Grid" }
  ],
  dungeon: [
    { value: "rectangle", label: "Rectangle" },
    { value: "cross", label: "Crossed Halls" },
    { value: "l-shape", label: "L-Shape" },
    { value: "ring", label: "Ring / Crypt Loop" }
  ],
  building: [
    { value: "rect", label: "Rectangle" },
    { value: "l-shape", label: "L-Shape" },
    { value: "t-shape", label: "T-Shape" },
    { value: "u-shape", label: "U-Shape" }
  ],
  wilderness: [
    { value: "open", label: "Open Ground" },
    { value: "clearing", label: "Forest Clearing" },
    { value: "ford", label: "River Ford" },
    { value: "camp", label: "Camp Perimeter" }
  ]
};

const BUILDING_SUBTYPES = [
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "residential", label: "Residential" },
  { value: "tavern", label: "Tavern" },
  { value: "mansion", label: "Mansion" },
  { value: "horror", label: "Horror / Derelict" }
];

const COORDINATE_MODES = [
  { value: "none", label: "Off" },
  { value: "border", label: "Border" },
  { value: "full", label: "Full Cell" }
];

const SPLIT_BIASES = [
  { value: "balanced", label: "Balanced" },
  { value: "horizontal", label: "Horizontal Bias" },
  { value: "vertical", label: "Vertical Bias" }
];

const CORRIDOR_WIDTHS = [
  { value: 1, label: "1 Cell" },
  { value: 2, label: "2 Cells" }
];

const CORRIDOR_STYLES = [
  { value: "spine", label: "Spine Corridor" },
  { value: "partitioned", label: "Partitioned (No Corridor)" }
];

const FURNITURE_DENSITIES = [
  { value: "off", label: "None" },
  { value: "sparse", label: "Sparse" },
  { value: "normal", label: "Normal" },
  { value: "dense", label: "Dense" }
];

const MISSION_TEMPLATE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "scifi", label: "Sci-Fi Ops" },
  { value: "dungeon", label: "Dungeon Delve" },
  { value: "horror", label: "Horror Incident" },
  { value: "wilderness", label: "Wilderness Recon" },
  { value: "sla", label: "SLA Briefing" }
];

const ENCOUNTER_FACTION_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "corporate", label: "Corporate Security" },
  { value: "marines", label: "Marines / Troopers" },
  { value: "cult", label: "Cult / Fanatics" },
  { value: "undead", label: "Undead" },
  { value: "wildlife", label: "Wildlife / Beasts" },
  { value: "sla", label: "SLA Operatives" }
];

const ENCOUNTER_DENSITY_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "standard", label: "Standard" },
  { value: "heavy", label: "Heavy" }
];

const FACTION_PRESET_OPTIONS = [
  { value: "none", label: "None" },
  { value: "ship", label: "Crew / Pirates / Automated / Infected" },
  { value: "dungeon", label: "Delvers / Cult / Undead / Guardians" },
  { value: "building", label: "Staff / Security / Residents / Intruders" },
  { value: "sla", label: "Operatives / Civilians / Hostiles / Media" }
];

const REGENERATE_TARGET_OPTIONS = [
  { value: "none", label: "Create fresh scenes" },
  { value: "viewed", label: "Viewed scene (single deck)" },
  { value: "viewed-folder", label: "Viewed scene folder" },
  { value: "folder", label: "Selected scene folder" }
];

const SECRET_DOOR_DENSITY_OPTIONS = [
  { value: "none",    label: "None" },
  { value: "minimal", label: "Minimal (1–2 per map)" },
  { value: "sparse",  label: "Sparse (2–4 per map)" },
  { value: "normal",  label: "Normal (4–8 per map)" },
  { value: "dense",   label: "Dense (hidden network)" }
];

const SECRET_DOOR_CHANCE = {
  none:    0,
  minimal: 0.01,
  sparse:  0.04,
  normal:  0.10,
  dense:   0.20
};

const MAINTENANCE_SHAFT_DENSITY_OPTIONS = [
  { value: "none",   label: "None" },
  { value: "sparse", label: "Sparse" },
  { value: "normal", label: "Normal" },
  { value: "dense",  label: "Dense" }
];

const MAINTENANCE_SHAFT_SOURCES = new Set([
  "engineering", "reactor", "life-support", "maintenance",
  "cargo", "storage", "fuel-bay", "docking-bay"
]);

const MAINTENANCE_SHAFT_DESTINATIONS = new Set([
  "engineering", "reactor", "life-support", "maintenance", "bridge",
  "ops", "armory", "weapon-bay", "brig"
]);

const BULKHEAD_PAIRS = [
  ["reactor",     "engineering"],
  ["reactor",     "crew-quarters"],
  ["reactor",     "cargo"],
  ["brig",        "corridor"],
  ["airlock",     "bridge"],
  ["airlock",     "crew-quarters"],
  ["weapon-bay",  "cargo"],
  ["docking-bay", "engineering"]
];

const REGION_CONFIG = {
  "reactor": {
    color: "#ff8800",
    gmOnly: false,
    behaviors: [{ type: "adjustDarknessLevel", darkness: { min: 0, max: 0.3 } }]
  },
  "boss-chamber": {
    color: "#aa0000",
    gmOnly: true,
    behaviors: []
  },
  "shrine": {
    color: "#8800ff",
    gmOnly: false,
    behaviors: []
  },
  "ritual-room": {
    color: "#440088",
    gmOnly: false,
    behaviors: []
  },
  "trap-room": {
    color: "#cc4400",
    gmOnly: true,
    behaviors: []
  },
  "medical": {
    color: "#0088cc",
    gmOnly: false,
    behaviors: []
  },
  "surgery": {
    color: "#cc0044",
    gmOnly: true,
    behaviors: []
  }
};

const ENCOUNTER_ROOM_TYPES = new Set([
  "boss-chamber",
  "guardroom",
  "barracks",
  "torture",
  "surgery",
  "padded-cell",
  "basement",
  "boiler-room",
  "prison",
  "security",
  "armory",
  "armoury",
  "brig"
]);

const ENCOUNTER_ROOM_LABELS = {
  "boss-chamber": "BOSS",
  guardroom: "GUARD",
  barracks: "SOLDIER",
  torture: "TORTURER",
  surgery: "THREAT",
  "padded-cell": "INMATE",
  basement: "LURKER",
  "boiler-room": "THREAT",
  prison: "PRISONER",
  security: "SECURITY",
  armory: "ARMED",
  armoury: "ARMED",
  brig: "DETAINEE"
};

const DECK_NAME_POOL = [
  "Command Deck",
  "Habitation Deck",
  "Cargo Deck",
  "Engineering Deck",
  "Maintenance Deck",
  "Operations Deck",
  "Docking Deck",
  "Research Deck"
];

const DUNGEON_LEVEL_NAMES = [
  "Upper Level",
  "Lower Level",
  "Catacombs",
  "Deep Vaults",
  "Flooded Passages",
  "The Abyss",
  "Undercroft",
  "Burial Halls"
];

const BUILDING_LEVEL_NAMES = [
  "Ground Floor",
  "Upper Floor",
  "Service Level",
  "Executive Floor",
  "Basement",
  "Upper Offices",
  "Storage Level",
  "Residential Floor"
];

const SHIP_NAME_POOL = [
  "Axiom",
  "Erebus",
  "Helix",
  "Kestrel",
  "Meridian",
  "Oblique",
  "Perseverance",
  "Tethys",
  "Valiance",
  "Vortex",
  "Waypoint",
  "Peregrine"
];

const SHIP_SUFFIX_POOL = [
  "MK-I",
  "MK-II",
  "MK-III",
  "MK-IV",
  "IX",
  "VII",
  "Class C",
  "Block 12",
  "Run 7",
  "Gamma"
];

const DUNGEON_NAME_POOL = [
  "Blackstone",
  "Grimhollow",
  "Ebondeep",
  "Cindervault",
  "Mirehold",
  "Wyrmrest",
  "Ashcrypt",
  "Hollowmere"
];

const DUNGEON_SUFFIX_POOL = [
  "Catacombs",
  "Vault",
  "Crypt",
  "Halls",
  "Depths",
  "Labyrinth",
  "Stronghold",
  "Sewers"
];

const BUILDING_NAME_POOL = [
  "Meridian",
  "Halcyon",
  "Northbank",
  "Greywall",
  "Kingsport",
  "Crown",
  "Glasswater",
  "Market"
];

const BUILDING_SUFFIX_POOL = [
  "Offices",
  "Warehouse",
  "House",
  "Hall",
  "Tower",
  "Tavern",
  "Mansion",
  "Works"
];

const WILDERNESS_NAME_POOL = [
  "Ashwood",
  "Blackfen",
  "Dreadmere",
  "Frostline",
  "Ironbrush",
  "Mirewatch",
  "Rookwood",
  "Thornfield"
];

const WILDERNESS_SUFFIX_POOL = [
  "Approach",
  "Hollow",
  "Crossing",
  "Wilds",
  "March",
  "Basin",
  "Trail",
  "Expanse"
];

const GEOMORPH_TILES = [
  {
    key: "straight-ns",
    connectors: { north: true, east: false, south: true, west: false },
    corridors: [{ x: 2, y: 0, width: 2, height: 6 }],
    rooms: [{ x: 1, y: 1, width: 4, height: 2 }]
  },
  {
    key: "straight-ew",
    connectors: { north: false, east: true, south: false, west: true },
    corridors: [{ x: 0, y: 2, width: 6, height: 2 }],
    rooms: [{ x: 1, y: 1, width: 2, height: 4 }]
  },
  {
    key: "corner-ne",
    connectors: { north: true, east: true, south: false, west: false },
    corridors: [{ x: 2, y: 0, width: 2, height: 3 }, { x: 2, y: 2, width: 4, height: 2 }],
    rooms: [{ x: 1, y: 3, width: 3, height: 2 }]
  },
  {
    key: "corner-sw",
    connectors: { north: false, east: false, south: true, west: true },
    corridors: [{ x: 0, y: 2, width: 4, height: 2 }, { x: 2, y: 2, width: 2, height: 4 }],
    rooms: [{ x: 2, y: 0, width: 3, height: 2 }]
  },
  {
    key: "tee-nes",
    connectors: { north: true, east: true, south: true, west: false },
    corridors: [{ x: 2, y: 0, width: 2, height: 6 }, { x: 2, y: 2, width: 4, height: 2 }],
    rooms: [{ x: 0, y: 1, width: 2, height: 4 }]
  },
  {
    key: "hub",
    connectors: { north: true, east: true, south: true, west: true },
    corridors: [{ x: 2, y: 0, width: 2, height: 6 }, { x: 0, y: 2, width: 6, height: 2 }],
    rooms: [{ x: 1, y: 1, width: 4, height: 4 }]
  },
  {
    key: "sealed-room",
    connectors: { north: false, east: false, south: false, west: false },
    corridors: [],
    rooms: [{ x: 1, y: 1, width: 4, height: 4 }]
  }
];

const FACTION_PRESETS = {
  ship: [
    { name: "Crew", color: "#4b8ecf", roomTypes: ["bridge", "quarters", "medical", "galley", "observation"] },
    { name: "Pirates", color: "#b45b42", roomTypes: ["cargo", "armory", "brig", "security"] },
    { name: "Automated", color: "#7b93a8", roomTypes: ["engineering", "reactor", "maintenance", "laboratory"] },
    { name: "Infected", color: "#7a3e59", roomTypes: ["airlock", "escape-pods", "hydroponics", "storage"] }
  ],
  dungeon: [
    { name: "Delvers", color: "#5678a8", roomTypes: ["entrance", "library", "cistern"] },
    { name: "Cult", color: "#8a4d6f", roomTypes: ["ritual-room", "shrine", "alchemy"] },
    { name: "Undead", color: "#8b8f9e", roomTypes: ["crypt", "vault", "throne-room"] },
    { name: "Guardians", color: "#b38742", roomTypes: ["guardroom", "armoury", "boss-chamber", "prison"] }
  ],
  building: [
    { name: "Staff", color: "#4d8f7a", roomTypes: ["office", "lobby", "foyer", "common-room", "bar"] },
    { name: "Security", color: "#4f6b94", roomTypes: ["security", "loading", "storage", "armory"] },
    { name: "Residents", color: "#a88153", roomTypes: ["bedroom", "living-room", "kitchen", "bathroom"] },
    { name: "Intruders", color: "#9a4a4a", roomTypes: ["basement", "boiler-room", "attic", "surgery"] }
  ],
  sla: [
    { name: "Operatives", color: "#5b86c5", roomTypes: ["bridge", "security", "armory", "command"] },
    { name: "Civilians", color: "#7aa073", roomTypes: ["quarters", "medical", "galley", "common-room"] },
    { name: "Hostiles", color: "#b85a4f", roomTypes: ["cargo", "brig", "maintenance", "boiler-room"] },
    { name: "Media", color: "#b28b3c", roomTypes: ["observation", "lobby", "office", "lab"] }
  ]
};

let roomTablesCache = null;
let shipProfilesCache = null;
let furnitureTablesCache = null;
const encounterPackCache = new Map();

Hooks.once("init", () => {
  game.scifiDeckPlanGenerator = {
    open: () => ScifiDeckPlanGeneratorApp.open()
  };

  game.settings.register(MODULE_ID, "lastFormState", {
    scope: "client",
    config: false,
    default: {}
  });

  game.settings.register(MODULE_ID, "savedPresets", {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, "gmOverlayVisible", {
    scope: "client",
    config: false,
    type: Boolean,
    default: true
  });

  game.settings.registerMenu(MODULE_ID, "openGenerator", {
    name: game.i18n.localize("SDPG.MenuName"),
    hint: game.i18n.localize("SDPG.MenuHint"),
    label: game.i18n.localize("SDPG.SceneButton"),
    icon: "fas fa-rocket",
    type: ScifiDeckPlanGeneratorApp,
    restricted: true
  });
});

Hooks.on("renderSceneDirectory", (_app, html) => installSceneDirectoryButton(html));
Hooks.on("renderSidebarTab", (app, html) => {
  const isScenesTab = app?.tabName === "scenes" || app?.options?.id === "scenes";
  if (isScenesTab) installSceneDirectoryButton(html);
});
Hooks.on("canvasReady", () => applyGmOverlayVisibility(canvas.scene ?? null));
Hooks.on("drawTile", (tile) => applyGmOverlayPlaceableVisibility(tile));
Hooks.on("drawNote", (note) => applyGmOverlayPlaceableVisibility(note));

Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user?.isGM) return;

  const buttonTool = {
    name: "openScifiDeckPlanGenerator",
    title: game.i18n.localize("SDPG.ToolbarOpen"),
    icon: "fas fa-rocket",
    button: true,
    onClick: () => ScifiDeckPlanGeneratorApp.open()
  };
  const gmOverlayTool = {
    name: "toggleScifiDeckPlanGmOverlay",
    title: "Toggle GM Overlay",
    icon: "fas fa-user-secret",
    toggle: true,
    active: game.settings.get(MODULE_ID, "gmOverlayVisible") !== false,
    onClick: async (active) => {
      await setGmOverlayVisible(active);
    }
  };

  const revealShaftTool = {
    name: "sdpgRevealMaintenanceShafts",
    title: "Reveal Maintenance Shafts",
    icon: "fas fa-eye",
    button: true,
    onClick: async () => {
      const scene = game.scenes?.viewed;
      if (!scene) return;
      const shaftDrawings = scene.drawings.filter((d) => d.flags?.[MODULE_ID]?.isMaintenanceShaft && d.hidden);
      const shaftWalls    = scene.walls.filter((w) => w.flags?.[MODULE_ID]?.isMaintenanceShaft && w.hidden);
      if (!shaftDrawings.length && !shaftWalls.length) {
        ui.notifications.info("No hidden maintenance shafts found in this scene.");
        return;
      }
      const confirmed = await Dialog.confirm({
        title: "Reveal Maintenance Shafts",
        content: `<p>Reveal ${shaftDrawings.length} shaft sections and ${shaftWalls.length} shaft walls to players?</p>`
      });
      if (!confirmed) return;
      if (shaftDrawings.length) {
        await scene.updateEmbeddedDocuments("Drawing", shaftDrawings.map((d) => ({ _id: d.id, hidden: false })));
      }
      if (shaftWalls.length) {
        await scene.updateEmbeddedDocuments("Wall", shaftWalls.map((w) => ({ _id: w.id, hidden: false })));
      }
      ui.notifications.info("Maintenance shafts revealed.");
    }
  };

  if (Array.isArray(controls)) {
    const wallsControls = controls.find((control) => control.name === "walls");
    if (wallsControls) {
      wallsControls.tools ??= [];
      if (!wallsControls.tools.some((tool) => tool.name === buttonTool.name)) {
        wallsControls.tools.push(buttonTool);
      }
      if (!wallsControls.tools.some((tool) => tool.name === gmOverlayTool.name)) {
        wallsControls.tools.push(gmOverlayTool);
      }
      if (!wallsControls.tools.some((tool) => tool.name === revealShaftTool.name)) {
        wallsControls.tools.push(revealShaftTool);
      }
      return;
    }

    controls.push({
      name: MODULE_ID,
      title: game.i18n.localize("SDPG.ToolbarGroup"),
      icon: "fas fa-rocket",
      layer: "walls",
      tools: [buttonTool, gmOverlayTool, revealShaftTool]
    });
    return;
  }

  if (!controls || typeof controls !== "object") return;
  const wallsControls = controls.walls;
  if (!wallsControls) return;
  wallsControls.tools ??= {};
  wallsControls.tools[buttonTool.name] ??= buttonTool;
  wallsControls.tools[gmOverlayTool.name] ??= gmOverlayTool;
  wallsControls.tools[revealShaftTool.name] ??= revealShaftTool;
});

class ScifiDeckPlanGeneratorApp extends HandlebarsApplicationMixin(ApplicationV2) {
  #isGenerating = false;

  static DEFAULT_OPTIONS = {
    id: MODULE_ID,
    tag: "form",
    classes: ["scifi-deckplan-generator"],
    window: {
      title: "SDPG.AppTitle",
      resizable: true,
      width: 980,
      height: 900
    },
    form: {
      handler: ScifiDeckPlanGeneratorApp.formHandler,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/scifi-deckplan-generator.html`
    }
  };

  static open() {
    return new ScifiDeckPlanGeneratorApp().render({ force: true });
  }

  static async formHandler(event, _form, formData) {
    return this.generateFromForm(formData.object, event?.target ?? event?.currentTarget ?? null);
  }

  async _prepareContext() {
    const saved = game.settings.get(MODULE_ID, "lastFormState") ?? {};
    const profilesData = await getShipProfiles();
    const defaults = {
      shipName: buildMapName("bsp"),
      mode: "bsp",
      profile: "hauler",
      columns: 32,
      rows: 20,
      gridSize: 75,
      gridMode: "square",
      decks: 1,
      seed: "",
      theme: "steel",
      hullShape: "rectangle",
      coordinates: "border",
      roomCount: 12,
      minRoomSize: 3,
      maxRoomSize: 8,
      cornerStyle: "chamfer",
      chamferSize: 1,
      circularSpecialRooms: true,
      softRoomOutlines: true,
      splitBias: "balanced",
      corridorStyle: "spine",
      loopFactor: 30,
      corridorWidth: 1,
      buildingSubtype: "office",
      secretDoorDensity: "minimal",
      furnitureDensity: "normal",
      missionTemplate: "auto",
      encounterFaction: "auto",
      encounterDensity: "standard",
      encounterPack: "sla-industries-compendium.creatures",
      roomPopulationPack: "sla-industries-compendium.creatures",
      populateRoomsFromCompendium: false,
      compactPrintMode: false,
      factionPreset: "none",
      savedPreset: "",
      activateScenes: true,
      regenerateInPlace: false,
      regenerateTarget: "none",
      targetSceneFolder: "",
      showRoomLabels: true,
      placeLights: true,
      generateMissionBrief: true,
      generateMissionPacket: false,
      seedEncounters: false,
      createRoomNotes: true,
      createGmOverlay: true,
      exportMetadataJson: true,
      mapAge: 0,
      exportMothershipJson: false
    };
    const merged = { ...defaults, ...saved };
    const themeOptions = getThemeOptionsForMode(merged.mode);
    const hullOptions = getHullOptionsForMode(merged.mode);
    const sceneFolders = buildSceneFolderOptions();
    const actorPacks = buildActorPackOptions();
    const savedPresets = buildSavedPresetOptions();

    return {
      defaults: merged,
      modes: mapOptions(GENERATION_MODES, merged.mode),
      profiles: mapOptions(
        profilesData.profiles.map((profile) => ({ value: profile.key, label: profile.label })),
        merged.profile
      ),
      themes: mapOptions(themeOptions, merged.theme),
      hullShapes: mapOptions(hullOptions, merged.hullShape),
      gridSizes: mapOptions(GRID_SIZES, Number(merged.gridSize)),
      gridModes: mapOptions(GRID_MODE_OPTIONS, merged.gridMode),
      chamferSizes: mapOptions(CHAMFER_SIZES, Number(merged.chamferSize)),
      coordinates: mapOptions(COORDINATE_MODES, merged.coordinates),
      cornerStyles: mapOptions(CORNER_STYLE_OPTIONS, merged.cornerStyle),
      splitBiases: mapOptions(SPLIT_BIASES, merged.splitBias),
      corridorStyles: mapOptions(CORRIDOR_STYLES, merged.corridorStyle),
      corridorWidths: mapOptions(CORRIDOR_WIDTHS, Number(merged.corridorWidth)),
      furnitureDensities: mapOptions(FURNITURE_DENSITIES, merged.furnitureDensity),
      secretDoorDensities: mapOptions(SECRET_DOOR_DENSITY_OPTIONS, merged.secretDoorDensity),
      maintenanceShaftDensities: mapOptions(MAINTENANCE_SHAFT_DENSITY_OPTIONS, merged.maintenanceShaftDensity),
      missionTemplates: mapOptions(MISSION_TEMPLATE_OPTIONS, merged.missionTemplate),
      encounterFactions: mapOptions(ENCOUNTER_FACTION_OPTIONS, merged.encounterFaction),
      encounterDensities: mapOptions(ENCOUNTER_DENSITY_OPTIONS, merged.encounterDensity),
      regenerateTargets: mapOptions(REGENERATE_TARGET_OPTIONS, merged.regenerateTarget ?? "none"),
      sceneFolders: mapOptions(sceneFolders, merged.targetSceneFolder ?? ""),
      actorPacks: mapOptions(actorPacks, merged.encounterPack ?? ""),
      roomPopulationPacks: mapOptions(actorPacks, merged.roomPopulationPack ?? ""),
      factionPresets: mapOptions(FACTION_PRESET_OPTIONS, merged.factionPreset ?? "none"),
      savedPresets: mapOptions(savedPresets, merged.savedPreset ?? ""),
      buildingSubtypes: mapOptions(BUILDING_SUBTYPES, merged.buildingSubtype),
      profileCards: profilesData.profiles.map((profile) => ({
        label: profile.label,
        summary: `${profile.columns}x${profile.rows}, ${profile.decks} level${profile.decks === 1 ? "" : "s"}, ${profile.mode.toUpperCase()}, ${profile.theme}`,
        mode: profile.mode
      }))
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;
    const form = root.matches?.("form") ? root : root.querySelector("form");
    if (!form) return;

    root.querySelector('[data-action="apply-profile"]')?.addEventListener("click", async (event) => {
      event.preventDefault();
      const profilesData = await getShipProfiles();
      const selectedKey = form.querySelector('[name="profile"]')?.value;
      const profile = profilesData.profiles.find((entry) => entry.key === selectedKey);
      if (!profile) return;
      setInputValue(form, "mode", profile.mode);
      updateModeVisibility(form, profile.mode);
      setInputValue(form, "columns", profile.columns);
      setInputValue(form, "rows", profile.rows);
      setInputValue(form, "decks", profile.decks);
      setInputValue(form, "theme", profile.theme);
      setInputValue(form, "hullShape", profile.hullShape ?? "rectangle");
      setInputValue(form, "splitBias", profile.splitBias ?? "balanced");
      setInputValue(form, "corridorStyle", profile.corridorStyle ?? "spine");
      setInputValue(form, "roomCount", profile.roomCount ?? 12);
      setInputValue(form, "minRoomSize", profile.minRoomSize ?? 3);
      setInputValue(form, "maxRoomSize", profile.maxRoomSize ?? 8);
      setInputValue(form, "loopFactor", profile.loopFactor ?? 30);
      setInputValue(form, "corridorWidth", profile.corridorWidth ?? 1);
      setInputValue(form, "buildingSubtype", profile.buildingSubtype ?? "office");
      setInputValue(form, "secretDoorDensity", profile.secretDoorDensity ?? "minimal");
      setInputValue(form, "furnitureDensity", profile.furnitureDensity ?? "normal");
      setInputValue(form, "shipName", profile.label);
      updatePreviewPane(form, root).catch(() => {});
    });

    root.querySelector('[data-action="load-saved-preset"]')?.addEventListener("click", async () => {
      await applySavedPresetToForm(form, root);
    });
    root.querySelector('[data-action="save-current-preset"]')?.addEventListener("click", async () => {
      await saveFormAsPreset(form, root);
    });
    root.querySelector('[data-action="delete-saved-preset"]')?.addEventListener("click", async () => {
      await deleteSavedPresetFromForm(form, root);
    });
    root.querySelector('[data-action="export-png"]')?.addEventListener("click", async () => {
      await exportPreviewPng(form, root);
    });
    root.querySelector('[data-action="share-seed"]')?.addEventListener("click", async () => {
      await shareFormState(form);
    });
    root.querySelector('[data-action="import-seed"]')?.addEventListener("click", async () => {
      await importSharedFormState(form, root);
    });

    setInputValue(form, "buildingSubtype", context.defaults.buildingSubtype ?? "office");
    updateModeVisibility(form, form.querySelector('[name="mode"]')?.value ?? context.defaults.mode ?? "bsp");

    form.querySelector('[name="mode"]')?.addEventListener("change", (event) => {
      updateModeVisibility(form, event.currentTarget.value);
      updatePreviewPane(form, root).catch(() => {});
    });
    form.querySelector(".sdpg-reroll-seed")?.addEventListener("click", () => {
      const seedInput = form.querySelector('[name="seed"]');
      if (seedInput) seedInput.value = String(Math.floor(Math.random() * 1_000_000));
      updatePreviewPane(form, root).catch(() => {});
    });
    root.querySelector('[data-action="preview-map"]')?.addEventListener("click", () => {
      updatePreviewPane(form, root).catch(() => {});
    });
    form.querySelectorAll("input, select").forEach((element) => {
      element.addEventListener("change", () => updatePreviewPane(form, root).catch(() => {}));
    });
    updatePreviewPane(form, root).catch(() => {});
  }

  async generateFromForm(formObject) {
    if (this.#isGenerating) return [];
    this.#isGenerating = true;
    const formState = normalizeFormState(formObject);
    try {
      await game.settings.set(MODULE_ID, "lastFormState", formState);
      ui.notifications.info(`Generating ${formState.shipName}...`);
      const roomTables = await getRoomTables();
      const deckPlan = buildDeckPlan(formState, roomTables);
      const scenes = await createFoundryScenes(deckPlan, formState);
      let metadataPath = null;

      if (formState.exportMothershipJson) {
        await exportMothershipViewerJson(deckPlan);
      }
      if (formState.exportMetadataJson) {
        metadataPath = await exportMapMetadataJson(deckPlan, formState, scenes);
      }
      if (formState.generateMissionPacket) {
        await createMissionPacket(deckPlan, formState, scenes, metadataPath);
      }

      if (formState.activateScenes && scenes.length) {
        await scenes[scenes.length - 1].activate();
        await scenes[scenes.length - 1].view();
      }

      ui.notifications.info(`Generated ${scenes.length} map scene${scenes.length === 1 ? "" : "s"} for ${deckPlan.shipName}.`);
      return scenes;
    } catch (error) {
      console.error(`${MODULE_ID} generation failed`, error);
      ui.notifications.error(`Map generation failed: ${error?.message ?? error}`);
      throw error;
    } finally {
      this.#isGenerating = false;
      this.close({ force: true }).catch(() => {});
    }
  }
}

function installSceneDirectoryButton(html) {
  if (!game.user?.isGM) return;
  const root = $(html);
  if (root.find(".sdpg-launch").length) return;

  const button = $(`
    <button type="button" class="sdpg-launch">
      <i class="fas fa-rocket"></i> ${game.i18n.localize("SDPG.SceneButton")}
    </button>
  `);
  button.on("click", () => ScifiDeckPlanGeneratorApp.open());
  const deleteButton = $(`
    <button type="button" class="sdpg-delete-generated">
      <i class="fas fa-trash"></i> Delete Generated
    </button>
  `);
  deleteButton.on("click", () => deleteGeneratedDocuments(game.scenes?.viewed ?? canvas.scene ?? null));
  const annotateButton = $(`
    <button type="button" class="sdpg-annotate-generated">
      <i class="fas fa-note-sticky"></i> Annotate Map
    </button>
  `);
  annotateButton.on("click", () => openSceneAnnotationDialog(game.scenes?.viewed ?? canvas.scene ?? null));
  const gmOverlayButton = $(`
    <button type="button" class="sdpg-toggle-gm-overlay">
      <i class="fas fa-user-secret"></i> GM Overlay
    </button>
  `);
  gmOverlayButton.on("click", async () => {
    await setGmOverlayVisible(!(game.settings.get(MODULE_ID, "gmOverlayVisible") !== false));
  });

  const createSceneButton = root.find("button[data-action='createScene'], a[data-action='createScene'], button.create-document").first();
  if (createSceneButton.length) {
    const row = $('<div class="sdpg-scene-directory-actions"></div>');
    row.append(button);
    row.append(gmOverlayButton);
    row.append(annotateButton);
    row.append(deleteButton);
    createSceneButton.closest(".header-actions, .action-buttons, .directory-header, header, .tab").first().after(row);
    return;
  }

  const header = root.find(".directory-header, header").first();
  if (header.length) {
    const row = $('<div class="sdpg-scene-directory-actions"></div>');
    row.append(button);
    row.append(gmOverlayButton);
    row.append(annotateButton);
    row.append(deleteButton);
    header.prepend(row);
  }
}

async function setGmOverlayVisible(visible) {
  await game.settings.set(MODULE_ID, "gmOverlayVisible", Boolean(visible));
  applyGmOverlayVisibility(canvas.scene ?? null);
  ui.controls?.render?.(true);
  ui.notifications.info(`GM overlay ${visible ? "shown" : "hidden"} for your client.`);
}

function applyGmOverlayVisibility(scene) {
  if (!game.user?.isGM || !scene) return;
  const visible = game.settings.get(MODULE_ID, "gmOverlayVisible") !== false;
  const sceneIsActive = (canvas.scene?.id ?? null) === scene.id;
  if (!sceneIsActive) return;

  for (const tile of canvas.tiles?.placeables ?? []) {
    applyGmOverlayPlaceableVisibility(tile, visible);
  }

  for (const note of canvas.notes?.placeables ?? []) {
    applyGmOverlayPlaceableVisibility(note, visible);
  }
}

function applyGmOverlayPlaceableVisibility(placeable, overrideVisible = null) {
  if (!game.user?.isGM || !placeable?.document?.flags?.[MODULE_ID]?.gmOverlay) return;
  const visible = overrideVisible ?? (game.settings.get(MODULE_ID, "gmOverlayVisible") !== false);
  placeable.visible = visible;
  placeable.alpha = visible ? 0.95 : 0;
  placeable.renderable = visible;
}

async function deleteGeneratedDocuments(scene) {
  if (!scene) {
    ui.notifications.warn("No scene active.");
    return;
  }

  const { wallIds, drawingIds, tileIds, lightIds, tokenIds, noteIds } = collectGeneratedSceneIds(scene);

  if (!wallIds.length && !drawingIds.length && !tileIds.length && !lightIds.length && !tokenIds.length && !noteIds.length) {
    ui.notifications.info("No generated elements found in this scene.");
    return;
  }

  await Dialog.confirm({
    title: "Delete Generated Elements",
    content: `<p>Remove ${wallIds.length} walls, ${drawingIds.length} drawings, ${tileIds.length} tiles, ${lightIds.length} lights, ${tokenIds.length} encounter tokens, and ${noteIds.length} generated notes from <b>${escapeXml(scene.name)}</b>?</p>`,
    yes: async () => {
      await deleteGeneratedDocumentsInternal(scene, { wallIds, drawingIds, tileIds, lightIds, tokenIds, noteIds });
      ui.notifications.info(`Deleted generated elements from ${scene.name}.`);
    }
  });
}

async function openSceneAnnotationDialog(scene) {
  if (!scene) {
    ui.notifications.warn("No scene active.");
    return;
  }
  const roomDrawings = scene.drawings.contents
    .filter((drawing) => drawing.flags?.[MODULE_ID]?.roomId)
    .sort((a, b) => (a.flags[MODULE_ID].roomLabel || a.flags[MODULE_ID].roomType || "").localeCompare(b.flags[MODULE_ID].roomLabel || b.flags[MODULE_ID].roomType || ""));
  if (!roomDrawings.length) {
    ui.notifications.warn("No generated room drawings found on this scene.");
    return;
  }
  const value = await Dialog.prompt({
    title: "Annotate Generated Room",
    content: `
      <div class="form-group">
        <label>Room</label>
        <select name="roomId">
          ${roomDrawings.map((drawing) => `<option value="${drawing.id}">${escapeXml(drawing.flags[MODULE_ID].roomLabel || drawing.flags[MODULE_ID].roomType || drawing.id)}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label>Note</label>
        <textarea name="annotation" style="width:100%;min-height:120px;" placeholder="GM note for this room"></textarea>
      </div>
    `,
    callback: (html) => ({
      roomId: html.find('[name="roomId"]').val(),
      note: html.find('[name="annotation"]').val()
    })
  }).catch(() => null);
  if (!value?.roomId || !String(value.note ?? "").trim()) return;
  const drawing = roomDrawings.find((entry) => entry.id === value.roomId);
  if (!drawing) return;
  const room = drawing.flags[MODULE_ID];
  await scene.createEmbeddedDocuments("Note", [withGeneratedNoteFlag({
    x: round((drawing.x ?? 0) + (drawing.shape?.width ?? 0) / 2),
    y: round((drawing.y ?? 0) + (drawing.shape?.height ?? 0) / 2),
    iconSize: 36,
    text: room.roomLabel || room.roomType || "Room Note",
    texture: { src: "icons/svg/book.svg" },
    hidden: true,
    flags: {
      [MODULE_ID]: {
        annotation: true,
        gmOverlay: true,
        roomId: room.roomId,
        roomType: room.roomType,
        roomLabel: room.roomLabel,
        noteText: String(value.note).trim()
      }
    }
  })]);
  ui.notifications.info("Room annotation added.");
}

function collectGeneratedSceneIds(scene) {
  return {
    wallIds: scene.walls.contents.filter((wall) => wall.flags?.[MODULE_ID]?.generatedWall).map((wall) => wall.id),
    drawingIds: scene.drawings.contents.filter((drawing) => drawing.flags?.[MODULE_ID]?.generatedDrawing).map((drawing) => drawing.id),
    tileIds: scene.tiles.contents.filter((tile) => tile.flags?.[MODULE_ID]?.generatedTile).map((tile) => tile.id),
    lightIds: scene.lights.contents.filter((light) => light.flags?.[MODULE_ID]?.generatedLight).map((light) => light.id),
    tokenIds: scene.tokens.contents.filter((token) => token.flags?.[MODULE_ID]?.generatedToken).map((token) => token.id),
    noteIds: scene.notes.contents.filter((note) => note.flags?.[MODULE_ID]?.generatedNote).map((note) => note.id)
  };
}

async function deleteGeneratedDocumentsInternal(scene, ids = collectGeneratedSceneIds(scene)) {
  if (ids.wallIds?.length) await scene.deleteEmbeddedDocuments("Wall", ids.wallIds);
  if (ids.drawingIds?.length) await scene.deleteEmbeddedDocuments("Drawing", ids.drawingIds);
  if (ids.tileIds?.length) await scene.deleteEmbeddedDocuments("Tile", ids.tileIds);
  if (ids.lightIds?.length) await scene.deleteEmbeddedDocuments("AmbientLight", ids.lightIds);
  if (ids.tokenIds?.length) await scene.deleteEmbeddedDocuments("Token", ids.tokenIds);
  if (ids.noteIds?.length) await scene.deleteEmbeddedDocuments("Note", ids.noteIds);
}

function normalizeFormState(raw = {}) {
  const mode = normalizeChoice(raw.mode, "bsp", GENERATION_MODES.map((entry) => entry.value));
  const seedValue = String(raw.seed ?? "").trim();
  const minRoomSize = clampInt(raw.minRoomSize, 2, 8, 3);
  const maxRoomSize = Math.max(minRoomSize, clampInt(raw.maxRoomSize, 4, 12, 8));
  const buildingSubtype = normalizeChoice(raw.buildingSubtype, "office", BUILDING_SUBTYPES.map((entry) => entry.value));
  const generatedName = buildMapName(mode, seedValue || Date.now(), buildingSubtype);
  const themeChoices = getThemeOptionsForMode(mode).map((entry) => entry.value);
  const hullChoices = getHullOptionsForMode(mode).map((entry) => entry.value);
  const compactPrintMode = Boolean(raw.compactPrintMode);
  const columns = compactPrintMode ? clampInt(raw.columns, 8, 12, 12) : clampInt(raw.columns, 10, 80, 32);
  const rows = compactPrintMode ? clampInt(raw.rows, 6, 8, 8) : clampInt(raw.rows, 6, 50, 20);
  const decks = compactPrintMode ? 1 : clampInt(raw.decks, 1, 8, 1);
  return {
    shipName: String(raw.shipName || generatedName).trim() || generatedName,
    mode,
    profile: String(raw.profile || "custom"),
    savedPreset: String(raw.savedPreset || ""),
    columns,
    rows,
    gridSize: clampInt(raw.gridSize, 50, 100, 75),
    gridMode: normalizeChoice(raw.gridMode, "square", GRID_MODE_OPTIONS.map((entry) => entry.value)),
    decks,
    seed: seedValue || String(Math.floor(Math.random() * 1_000_000)),
    theme: normalizeChoice(raw.theme, themeChoices[0], themeChoices),
    hullShape: normalizeChoice(raw.hullShape, hullChoices[0], hullChoices),
    coordinates: compactPrintMode ? "none" : normalizeChoice(raw.coordinates, "border", COORDINATE_MODES.map((entry) => entry.value)),
    roomCount: clampInt(raw.roomCount, 6, 40, 12),
    minRoomSize,
    maxRoomSize,
    cornerStyle: normalizeChoice(raw.cornerStyle, "chamfer", CORNER_STYLE_OPTIONS.map((entry) => entry.value)),
    chamferSize: clampInt(raw.chamferSize, 1, 2, 1),
    circularSpecialRooms: raw.circularSpecialRooms !== false && raw.circularSpecialRooms !== "false",
    softRoomOutlines: raw.softRoomOutlines !== false && raw.softRoomOutlines !== "false",
    splitBias: normalizeChoice(raw.splitBias, "balanced", SPLIT_BIASES.map((entry) => entry.value)),
    corridorStyle: normalizeChoice(raw.corridorStyle, "spine", CORRIDOR_STYLES.map((entry) => entry.value)),
    loopFactor: clampInt(raw.loopFactor, 0, 100, 30),
    corridorWidth: clampInt(raw.corridorWidth, 1, 2, 1),
    buildingSubtype,
    secretDoorDensity: normalizeChoice(raw.secretDoorDensity, "minimal", SECRET_DOOR_DENSITY_OPTIONS.map((e) => e.value)),
    maintenanceShaftDensity: normalizeChoice(raw.maintenanceShaftDensity, "sparse", MAINTENANCE_SHAFT_DENSITY_OPTIONS.map((e) => e.value)),
    placeRegions: raw.placeRegions !== false && raw.placeRegions !== "false",
    furnitureDensity: normalizeChoice(raw.furnitureDensity, "normal", FURNITURE_DENSITIES.map((entry) => entry.value)),
    missionTemplate: normalizeChoice(raw.missionTemplate, "auto", MISSION_TEMPLATE_OPTIONS.map((entry) => entry.value)),
    encounterFaction: normalizeChoice(raw.encounterFaction, "auto", ENCOUNTER_FACTION_OPTIONS.map((entry) => entry.value)),
    encounterDensity: normalizeChoice(raw.encounterDensity, "standard", ENCOUNTER_DENSITY_OPTIONS.map((entry) => entry.value)),
    encounterPack: String(raw.encounterPack ?? "").trim(),
    roomPopulationPack: String(raw.roomPopulationPack ?? "").trim(),
    populateRoomsFromCompendium: Boolean(raw.populateRoomsFromCompendium),
    compactPrintMode,
    factionPreset: normalizeChoice(raw.factionPreset, "none", FACTION_PRESET_OPTIONS.map((entry) => entry.value)),
    activateScenes: Boolean(raw.activateScenes),
    regenerateInPlace: Boolean(raw.regenerateInPlace),
    regenerateTarget: normalizeChoice(raw.regenerateTarget, "none", REGENERATE_TARGET_OPTIONS.map((entry) => entry.value)),
    targetSceneFolder: String(raw.targetSceneFolder ?? "").trim(),
    showRoomLabels: Boolean(raw.showRoomLabels),
    placeLights: raw.placeLights !== false && raw.placeLights !== "false",
    generateMissionBrief: raw.generateMissionBrief !== false && raw.generateMissionBrief !== "false",
    generateMissionPacket: Boolean(raw.generateMissionPacket),
    seedEncounters: Boolean(raw.seedEncounters),
    createRoomNotes: Boolean(raw.createRoomNotes),
    createGmOverlay: raw.createGmOverlay !== false && raw.createGmOverlay !== "false",
    exportMetadataJson: raw.exportMetadataJson !== false && raw.exportMetadataJson !== "false",
    mapAge: clampInt(raw.mapAge, 0, 100, 0),
    exportMothershipJson: ["bsp", "corridor"].includes(mode) && Boolean(raw.exportMothershipJson)
  };
}

function getThemeOptionsForMode(mode) {
  return MODE_THEME_OPTIONS[mode] ?? MODE_THEME_OPTIONS.bsp;
}

function getHullOptionsForMode(mode) {
  return MODE_HULL_OPTIONS[mode] ?? MODE_HULL_OPTIONS.bsp;
}

function updateModeVisibility(form, mode) {
  const themeSelect = form.querySelector('[name="theme"]');
  const hullSelect = form.querySelector('[name="hullShape"]');
  syncSelectOptions(themeSelect, getThemeOptionsForMode(mode));
  syncSelectOptions(hullSelect, getHullOptionsForMode(mode));

  form.querySelectorAll(".sdpg-mode-field").forEach((field) => {
    const allowed = (field.dataset.modes ?? "").split(/\s+/).filter(Boolean);
    const active = !allowed.length || allowed.includes(mode);
    field.classList.toggle("is-hidden", !active);
    field.querySelectorAll("input, select").forEach((element) => {
      element.disabled = !active;
    });
  });

  const exportToggle = form.querySelector('[name="exportMothershipJson"]');
  if (exportToggle) exportToggle.checked = ["bsp", "corridor"].includes(mode) && exportToggle.checked;
}

async function updatePreviewPane(form, root) {
  const image = root.querySelector("[data-preview-image]");
  const summary = root.querySelector("[data-preview-summary]");
  if (!image || !summary) return;
  try {
    summary.textContent = "Rendering preview...";
    const formObject = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      formObject[checkbox.name] = checkbox.checked;
    });
    const formState = normalizeFormState(formObject);
    const roomTables = await getRoomTables();
    const deckPlan = buildDeckPlan(formState, roomTables);
    const previewDeck = deckPlan.decks[0];
    const svg = buildDeckSVG(deckPlan, previewDeck, formState);
    image.dataset.svg = svg;
    image.dataset.filename = `${slugify(deckPlan.shipName)}-preview.png`;
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    summary.textContent = buildPreviewSummary(deckPlan, previewDeck, formState);
  } catch (error) {
    console.error(`${MODULE_ID} preview failed`, error);
    summary.textContent = `Preview failed: ${error?.message ?? error}`;
  }
}

function buildPreviewSummary(deckPlan, deck, formState) {
  const hazards = deck.rooms.filter((room) => ENCOUNTER_ROOM_TYPES.has(room.type)).length;
  const wildernessFeatures = formState.mode === "wilderness"
    ? `${deck.wilderness?.treeClusters?.length ?? 0} tree clusters, ${deck.wilderness?.waterFeatures?.length ?? 0} water features, ${deck.wilderness?.encounterZones?.length ?? 0} encounter zones`
    : `${deck.rooms.length} rooms, ${deck.corridors.length} corridors, ${countDoors(deck.wallSegments)} doors`;
  const targetLabel = {
    none: "new scenes",
    viewed: "viewed scene",
    "viewed-folder": "viewed folder",
    folder: formState.targetSceneFolder ? "selected folder" : "new scenes"
  }[formState.regenerateTarget === "none" && formState.regenerateInPlace ? "viewed" : formState.regenerateTarget] ?? "new scenes";
  return `${deckPlan.shipName} | ${deck.deckName} | ${deckPlan.decks.length} deck${deckPlan.decks.length === 1 ? "" : "s"} | ${formState.theme} | ${formState.gridMode} | ${wildernessFeatures}${hazards ? ` | ${hazards} danger rooms` : ""} | target: ${targetLabel}`;
}

async function saveFormAsPreset(form, root) {
  const name = (await Dialog.prompt({
    title: "Save Preset",
    content: `<div class="form-group"><label>Preset name</label><input type="text" name="presetName" value="" placeholder="My Standard Mothership"/></div>`,
    callback: (html) => html.find('[name="presetName"]').val()
  }))?.trim();
  if (!name) return;
  const formState = readFormState(form);
  formState.savedPreset = name;
  const presets = [...(game.settings.get(MODULE_ID, "savedPresets") ?? [])].filter((preset) => preset.name !== name);
  presets.push({ name, state: formState });
  presets.sort((a, b) => a.name.localeCompare(b.name));
  await game.settings.set(MODULE_ID, "savedPresets", presets);
  await game.settings.set(MODULE_ID, "lastFormState", formState);
  updatePresetSelect(root, name);
  ui.notifications.info(`Saved preset ${name}.`);
}

async function applySavedPresetToForm(form, root) {
  const select = form.querySelector('[name="savedPreset"]');
  const name = String(select?.value ?? "").trim();
  if (!name) return;
  const preset = (game.settings.get(MODULE_ID, "savedPresets") ?? []).find((entry) => entry.name === name);
  if (!preset?.state) return;
  applyStateToForm(form, preset.state);
  updateModeVisibility(form, form.querySelector('[name="mode"]')?.value ?? preset.state.mode ?? "bsp");
  updatePresetSelect(root, name);
  await game.settings.set(MODULE_ID, "lastFormState", { ...preset.state, savedPreset: name });
  updatePreviewPane(form, root).catch(() => {});
  ui.notifications.info(`Loaded preset ${name}.`);
}

async function deleteSavedPresetFromForm(form, root) {
  const select = form.querySelector('[name="savedPreset"]');
  const name = String(select?.value ?? "").trim();
  if (!name) return;
  const confirmed = await Dialog.confirm({
    title: "Delete Preset",
    content: `<p>Delete saved preset <strong>${escapeXml(name)}</strong>?</p>`
  });
  if (!confirmed) return;
  const presets = [...(game.settings.get(MODULE_ID, "savedPresets") ?? [])].filter((entry) => entry.name !== name);
  await game.settings.set(MODULE_ID, "savedPresets", presets);
  updatePresetSelect(root, "");
  ui.notifications.info(`Deleted preset ${name}.`);
}

function applyStateToForm(form, state = {}) {
  for (const [key, value] of Object.entries(state)) {
    setInputValue(form, key, value);
  }
}

function updatePresetSelect(root, selectedName = "") {
  const select = root.querySelector('[name="savedPreset"]');
  if (!select) return;
  syncSelectOptions(select, buildSavedPresetOptions());
  select.value = selectedName;
}

function readFormState(form) {
  const formObject = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    formObject[checkbox.name] = checkbox.checked;
  });
  return normalizeFormState(formObject);
}

async function exportPreviewPng(form, root) {
  const image = root.querySelector("[data-preview-image]");
  const svg = image?.dataset?.svg;
  if (!svg) return;
  const widthMatch = svg.match(/width="(\d+)"/);
  const heightMatch = svg.match(/height="(\d+)"/);
  const width = Number(widthMatch?.[1] ?? 1200);
  const height = Number(heightMatch?.[1] ?? 900);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const pngUrl = await rasterizeSvgToPng(url, width, height);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = image.dataset.filename || "map-preview.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function rasterizeSvgToPng(url, width, height) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function shareFormState(form) {
  const state = readFormState(form);
  const packed = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  const share = `${window.location.origin}${window.location.pathname}#sdpg=${packed}`;
  await navigator.clipboard.writeText(share).catch(() => {});
  await Dialog.prompt({
    title: "Share Seed URL",
    content: `<textarea style="width:100%;min-height:120px;">${escapeXml(share)}</textarea>`,
    callback: () => share
  }).catch(() => null);
}

async function importSharedFormState(form, root) {
  const value = await Dialog.prompt({
    title: "Import Shared Seed",
    content: `<textarea name="importState" style="width:100%;min-height:120px;" placeholder="Paste a shared URL or raw encoded state"></textarea>`,
    callback: (html) => html.find('[name="importState"]').val()
  });
  const text = String(value ?? "").trim();
  if (!text) return;
  const match = text.match(/#sdpg=([^&]+)/);
  const packed = match?.[1] ?? text;
  try {
    const state = JSON.parse(decodeURIComponent(escape(atob(packed))));
    applyStateToForm(form, state);
    updateModeVisibility(form, form.querySelector('[name="mode"]')?.value ?? state.mode ?? "bsp");
    updatePreviewPane(form, root).catch(() => {});
    ui.notifications.info("Imported shared generator state.");
  } catch (error) {
    ui.notifications.error(`Could not import shared state: ${error?.message ?? error}`);
  }
}

function syncSelectOptions(select, options) {
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join("");
  const allowed = new Set(options.map((option) => String(option.value)));
  select.value = allowed.has(String(currentValue)) ? String(currentValue) : String(options[0]?.value ?? "");
}

async function getRoomTables() {
  if (!roomTablesCache) {
    roomTablesCache = await loadJson(`modules/${MODULE_ID}/data/room-tables.json`);
  }
  return roomTablesCache;
}

async function getShipProfiles() {
  if (!shipProfilesCache) {
    shipProfilesCache = await loadJson(`modules/${MODULE_ID}/data/ship-profiles.json`);
  }
  return shipProfilesCache;
}

async function getFurnitureTables() {
  if (!furnitureTablesCache) {
    furnitureTablesCache = await loadJson(`modules/${MODULE_ID}/data/furniture-tables.json`);
  }
  return furnitureTablesCache;
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return response.json();
}

function buildDeckPlan(formState, roomTables) {
  const seed = hashSeed(formState.seed);
  const decks = [];

  for (let deckIndex = 0; deckIndex < formState.decks; deckIndex += 1) {
    const rng = mulberry32(seed + deckIndex * 104729);
    const deckName = resolveDeckName(deckIndex, formState.mode);
    const deck = buildDeckForMode(deckIndex, deckName, formState, roomTables, rng);
    decks.push(deck);
  }

  if (decks.length > 1) {
    applySharedDeckConnectors(decks, formState);
  }

  return {
    shipName: formState.shipName,
    seed: formState.seed,
    gridSize: formState.gridSize,
    theme: formState.theme,
    decks
  };
}

function buildDeckForMode(deckIndex, deckName, formState, roomTables, rng) {
  switch (formState.mode) {
    case "corridor":
      return buildCorridorDeck(deckIndex, deckName, formState, roomTables, rng);
    case "geomorph":
      return buildGeomorphDeck(deckIndex, deckName, formState, roomTables, rng);
    case "dungeon":
      if (formState.theme === "cave") return buildCaveDeck(deckIndex, deckName, formState, roomTables, rng);
      return buildDungeonDeck(deckIndex, deckName, formState, roomTables, rng);
    case "building":
      return formState.corridorStyle === "spine"
        ? buildBuildingDeckWithHallway(deckIndex, deckName, formState, roomTables, rng)
        : buildBuildingDeck(deckIndex, deckName, formState, roomTables, rng);
    case "wilderness":
      return buildWildernessDeck(deckIndex, deckName, formState, roomTables, rng);
    case "bsp":
    default:
      return formState.corridorStyle === "spine"
        ? buildBspDeckWithSpine(deckIndex, deckName, formState, roomTables, rng)
        : buildBspDeck(deckIndex, deckName, formState, roomTables, rng);
  }
}

function buildGeomorphDeck(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = buildHullRegions(formState.columns, formState.rows, "rectangle", "geomorph");
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const tileSize = 6;
  const tileCols = Math.max(1, Math.floor((formState.columns - 2) / tileSize));
  const tileRows = Math.max(1, Math.floor((formState.rows - 2) / tileSize));
  const occupancy = makeGrid(formState.columns, formState.rows, false);
  const roomType = makeGrid(formState.columns, formState.rows, "");
  const roomIdGrid = makeGrid(formState.columns, formState.rows, "");
  const rooms = [];
  const corridors = [];
  const connections = [];
  const geomorphTiles = [];

  for (let ty = 0; ty < tileRows; ty += 1) {
    for (let tx = 0; tx < tileCols; tx += 1) {
      const required = {
        north: ty > 0 ? (geomorphTiles[(ty - 1) * tileCols + tx]?.connectors.south ?? false) : false,
        west: tx > 0 ? (geomorphTiles[ty * tileCols + (tx - 1)]?.connectors.east ?? false) : false
      };
      const candidates = GEOMORPH_TILES.filter((tile) =>
        tile.connectors.north === required.north
        && tile.connectors.west === required.west
        && (tx < tileCols - 1 || tile.connectors.east === false)
        && (ty < tileRows - 1 || tile.connectors.south === false)
      );
      const tile = (candidates.length ? candidates : GEOMORPH_TILES)[randomInt(rng, 0, (candidates.length ? candidates : GEOMORPH_TILES).length - 1)];
      geomorphTiles.push(tile);
      const baseX = 1 + tx * tileSize;
      const baseY = 1 + ty * tileSize;
      for (const rect of tile.corridors) {
        const corridor = { x: baseX + rect.x, y: baseY + rect.y, width: rect.width, height: rect.height, waypoints: [] };
        corridors.push(corridor);
        fillRectCells(occupancy, corridor, true);
        fillRectCells(roomType, corridor, "corridor");
      }
      for (const rect of tile.rooms) {
        const room = {
          id: `g${deckIndex}-${rooms.length}`,
          x: baseX + rect.x,
          y: baseY + rect.y,
          width: rect.width,
          height: rect.height,
          shape: "rect",
          markers: []
        };
        rooms.push(room);
        fillRectCells(occupancy, room, true);
        fillRectCells(roomType, room, "room");
        fillRectCells(roomIdGrid, room, room.id);
      }
    }
  }

  for (let i = 1; i < rooms.length; i += 1) {
    connections.push([rooms[i - 1].id, rooms[i].id]);
  }
  assignScifiRoomTypes(rooms, roomTables, rng);
  applyFactionTerritories(rooms, formState);
  applyOrganicRoomShapes(rooms, formState, rng);
  const wallSegments = buildOccupancyWalls(occupancy, roomType, roomIdGrid);
  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms,
    corridors,
    wallSegments,
    deckConnectors: [],
    airlocks: [],
    exteriorOpenings: []
  };
}

function buildBspDeck(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = buildHullRegions(formState.columns, formState.rows, formState.hullShape, formState.mode);
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const roomTargets = allocateRoomCounts(hullRegions, formState.roomCount);
  const roomRects = hullRegions.flatMap((region, index) =>
    splitRectExactCount(region, roomTargets[index], formState.splitBias, formState.minRoomSize, rng)
  );
  const rooms = roomRects.map((rect, index) => ({
    id: `r${deckIndex}-${index}`,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    shape: "rect",
    markers: []
  }));

  assignScifiRoomTypes(rooms, roomTables, rng);
  applyFactionTerritories(rooms, formState);
  applyOrganicRoomShapes(rooms, formState, rng);
  const airlocks = buildHullDoorsFromMask(hullMask, rng);
  const airlockDoors = airlocks.map((airlock) => ({ ...airlock, door: true, ds: 2 }));
  const wallSegments = [
    ...buildHullWallsWithDoorGaps(hullMask, airlocks),
    ...buildPartitionSegments(rooms, rng),
    ...airlockDoors
  ];

  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms,
    corridors: [],
    wallSegments,
    deckConnectors: [],
    airlocks: airlocks.map((segment, index) => ({
      id: `a${deckIndex}-${index}`,
      x: segment.x1,
      y: segment.y1,
      edge: segment.x1 === segment.x2 ? "V" : "H",
      label: `AIRLOCK ${index + 1}`
    }))
  };
}

function buildBspDeckWithSpine(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = buildHullRegions(formState.columns, formState.rows, formState.hullShape, formState.mode);
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const spineWidth = Math.min(2, Math.max(1, formState.corridorWidth));
  const spineMidY = hull.y + Math.max(2, Math.floor(hull.height / 2) - Math.floor(spineWidth / 2));
  const spineRect = { x: hull.x, y: spineMidY, width: hull.width, height: spineWidth };
  const topBand = { x: hull.x, y: hull.y, width: hull.width, height: Math.max(0, spineRect.y - hull.y) };
  const botBand = {
    x: hull.x,
    y: spineRect.y + spineRect.height,
    width: hull.width,
    height: Math.max(0, (hull.y + hull.height) - (spineRect.y + spineRect.height))
  };
  const roomCount = Math.max(4, formState.roomCount);
  const topCount = Math.ceil(roomCount / 2);
  const botCount = Math.floor(roomCount / 2);
  const rooms = [];
  const roomRects = [];
  if (topBand.height >= formState.minRoomSize) {
    roomRects.push(...splitRectExactCount(topBand, topCount, formState.splitBias, formState.minRoomSize, rng));
  }
  if (botBand.height >= formState.minRoomSize) {
    roomRects.push(...splitRectExactCount(botBand, botCount, formState.splitBias, formState.minRoomSize, rng));
  }
  roomRects.forEach((rect, index) => {
    rooms.push({ id: `r${deckIndex}-${index}`, ...rect, shape: "rect", markers: [] });
  });

  assignScifiRoomTypes(rooms, roomTables, rng);
  applyFactionTerritories(rooms, formState);
  applyOrganicRoomShapes(rooms, formState, rng);
  const airlocks = buildHullDoorsFromMask(hullMask, rng);
  const airlockDoors = airlocks.map((airlock) => ({ ...airlock, door: true, ds: DOOR_STATE_LOCKED }));
  const wallSegments = [
    ...buildHullWallsWithDoorGaps(hullMask, airlocks),
    ...buildPartitionSegments(rooms, rng),
    ...buildSpineWalls(spineRect, rooms),
    ...airlockDoors
  ];

  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms,
    corridors: [{ ...spineRect, waypoints: [] }],
    wallSegments,
    deckConnectors: [],
    airlocks: airlocks.map((segment, index) => ({
      id: `a${deckIndex}-${index}`,
      x: segment.x1,
      y: segment.y1,
      edge: segment.x1 === segment.x2 ? "V" : "H",
      label: `AIRLOCK ${index + 1}`
    }))
  };
}

function buildCorridorDeck(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = buildHullRegions(formState.columns, formState.rows, formState.hullShape, formState.mode);
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const occupancy = makeGrid(formState.columns, formState.rows, false);
  const roomType = makeGrid(formState.columns, formState.rows, "");
  const roomIdGrid = makeGrid(formState.columns, formState.rows, "");
  const rooms = [];
  const attempts = formState.roomCount * 16;

  for (let i = 0; i < attempts && rooms.length < formState.roomCount; i += 1) {
    const width = randomInt(rng, formState.minRoomSize, Math.max(formState.minRoomSize, Math.min(formState.maxRoomSize, hull.width - 2)));
    const height = randomInt(rng, formState.minRoomSize, Math.max(formState.minRoomSize, Math.min(formState.maxRoomSize, hull.height - 2)));
    const x = randomInt(rng, hull.x, Math.max(hull.x, hull.x + hull.width - width));
    const y = randomInt(rng, hull.y, Math.max(hull.y, hull.y + hull.height - height));
    const rect = { x, y, width, height };
    if (!rectFitsMask(rect, hullMask)) continue;
    if (rooms.some((room) => rectsOverlap(expandRect(room, 1), rect))) continue;
    rooms.push({
      id: `r${deckIndex}-${rooms.length}`,
      ...rect,
      shape: "rect",
      markers: []
    });
    fillRectCells(occupancy, rect, true);
    fillRectCells(roomType, rect, "room");
    fillRectCells(roomIdGrid, rect, rooms[rooms.length - 1].id);
  }

  assignScifiRoomTypes(rooms, roomTables, rng);
  applyFactionTerritories(rooms, formState);
  applyOrganicRoomShapes(rooms, formState, rng);

  const corridors = [];
  const connections = [];
  for (let i = 1; i < rooms.length; i += 1) {
    const current = roomCenter(rooms[i]);
    const nearestRoom = nearestRoomForIndex(rooms, i);
    const nearest = roomCenter(nearestRoom);
    const width = corridorWidthForConnection(rooms[i], nearestRoom, formState);
    const hall = carveCorridor(nearest, current, occupancy, roomType, width, hullMask);
    if (hall.length) {
      corridors.push(...hall);
      connections.push([rooms[i].id, nearestRoom.id]);
    }
  }

  const extraEdges = Math.max(1, Math.floor(rooms.length * (formState.loopFactor / 100) * 0.4));
  for (let i = 0; i < extraEdges; i += 1) {
    const a = rooms[randomInt(rng, 0, rooms.length - 1)];
    const b = rooms[randomInt(rng, 0, rooms.length - 1)];
    if (!a || !b || a === b) continue;
    const width = corridorWidthForConnection(a, b, formState);
    const hall = carveCorridor(roomCenter(a), roomCenter(b), occupancy, roomType, width, hullMask);
    if (hall.length) {
      corridors.push(...hall);
      connections.push([a.id, b.id]);
    }
  }

  ensureCorridorConnectivity(rooms, connections, corridors, occupancy, roomType, formState.corridorWidth, hullMask, formState);

  const wallSegments = buildOccupancyWalls(occupancy, roomType, roomIdGrid);
  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms,
    corridors,
    wallSegments,
    deckConnectors: [],
    airlocks: []
  };
}

function buildCaveDeck(deckIndex, deckName, formState, roomTables, rng) {
  const columns = formState.columns;
  const rows = formState.rows;
  const openMask = makeGrid(columns, rows, false);

  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < columns - 1; x += 1) {
      openMask[y][x] = rng() > 0.45;
    }
  }

  for (let pass = 0; pass < 5; pass += 1) {
    const next = makeGrid(columns, rows, false);
    for (let y = 1; y < rows - 1; y += 1) {
      for (let x = 1; x < columns - 1; x += 1) {
        const closed = countClosedNeighbours(openMask, x, y, columns, rows);
        next[y][x] = closed < 5 ? true : (closed <= 3 ? true : openMask[y][x]);
      }
    }
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        openMask[y][x] = next[y][x];
      }
    }
  }

  const visited = makeGrid(columns, rows, false);
  let bestRegion = [];
  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < columns - 1; x += 1) {
      if (!openMask[y][x] || visited[y][x]) continue;
      const region = floodFillOpenRegion(openMask, visited, x, y, columns, rows);
      if (region.length > bestRegion.length) bestRegion = region;
    }
  }

  const finalMask = makeGrid(columns, rows, false);
  for (const cell of bestRegion) {
    finalMask[cell.y][cell.x] = true;
  }

  const midY = Math.floor(rows / 2);
  for (let x = 2; x < columns - 2; x += 1) {
    finalMask[midY][x] = true;
  }

  const chambers = buildCaveChambers(finalMask, formState.roomCount, formState.minRoomSize, rng, deckIndex);
  const connections = buildCaveRoomConnections(chambers);
  assignDungeonRoomTypes(chambers, roomTables, connections, finalMask, rng);
  applyFactionTerritories(chambers, formState);
  applyOrganicRoomShapes(chambers, { ...formState, cornerStyle: "square", circularSpecialRooms: true }, rng);

  return {
    deckIndex,
    deckName,
    columns,
    rows,
    hull: { x: 1, y: 1, width: columns - 2, height: rows - 2 },
    hullRegions: [{ x: 1, y: 1, width: columns - 2, height: rows - 2 }],
    hullMask: finalMask,
    rooms: chambers,
    corridors: [],
    wallSegments: extractGridWallSegments(finalMask, columns, rows),
    deckConnectors: [],
    airlocks: [],
    isCave: true
  };
}

function buildDungeonDeck(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = buildHullRegions(formState.columns, formState.rows, formState.hullShape, "dungeon");
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const occupancy = makeGrid(formState.columns, formState.rows, false);
  const roomType = makeGrid(formState.columns, formState.rows, "");
  const roomIdGrid = makeGrid(formState.columns, formState.rows, "");
  const rooms = [];
  const attempts = formState.roomCount * 18;

  for (let i = 0; i < attempts && rooms.length < formState.roomCount; i += 1) {
    const width = randomInt(rng, formState.minRoomSize, Math.max(formState.minRoomSize, Math.min(formState.maxRoomSize, hull.width - 2)));
    const height = randomInt(rng, formState.minRoomSize, Math.max(formState.minRoomSize, Math.min(formState.maxRoomSize, hull.height - 2)));
    const x = randomInt(rng, hull.x, Math.max(hull.x, hull.x + hull.width - width));
    const y = randomInt(rng, hull.y, Math.max(hull.y, hull.y + hull.height - height));
    const rect = { x, y, width, height };
    if (!rectFitsMask(rect, hullMask)) continue;
    if (rooms.some((room) => rectsOverlap(expandRect(room, 1), rect))) continue;
    const room = {
      id: `r${deckIndex}-${rooms.length}`,
      ...rect,
      shape: "rect",
      markers: []
    };
    rooms.push(room);
    fillRectCells(occupancy, rect, true);
    fillRectCells(roomType, rect, "room");
    fillRectCells(roomIdGrid, rect, room.id);
  }

  const corridors = [];
  const connections = [];
  for (let i = 1; i < rooms.length; i += 1) {
    const current = roomCenter(rooms[i]);
    const nearestRoom = nearestRoomForIndex(rooms, i);
    const hall = carveCorridor(roomCenter(nearestRoom), current, occupancy, roomType, formState.corridorWidth, hullMask);
    if (hall.length) {
      corridors.push(...hall);
      connections.push([rooms[i].id, nearestRoom.id]);
    }
  }

  const roomDoorTypes = assignDungeonRoomTypes(rooms, roomTables, connections, hullMask, rng);
  applyFactionTerritories(rooms, formState);
  applyOrganicRoomShapes(rooms, formState, rng);
  const extraEdges = Math.max(1, Math.floor(rooms.length * (formState.loopFactor / 100)));
  for (let i = 0; i < extraEdges; i += 1) {
    const a = rooms[randomInt(rng, 0, rooms.length - 1)];
    const b = rooms[randomInt(rng, 0, rooms.length - 1)];
    if (!a || !b || a === b) continue;
    const width = corridorWidthForConnection(a, b, formState);
    const hall = carveCorridor(roomCenter(a), roomCenter(b), occupancy, roomType, width, hullMask);
    if (hall.length) {
      corridors.push(...hall);
      connections.push([a.id, b.id]);
    }
  }

  ensureCorridorConnectivity(rooms, connections, corridors, occupancy, roomType, formState.corridorWidth, hullMask, formState);
  let wallSegments = buildOccupancyWalls(occupancy, roomType, roomIdGrid, { roomDoorTypes });
  wallSegments = injectSecretDoors(wallSegments, rng, formState.secretDoorDensity);
  if (["bsp", "corridor"].includes(formState.mode)) {
    wallSegments = applyBulkheadUpgrades(wallSegments, rooms);
  }

  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms,
    corridors,
    wallSegments,
    deckConnectors: [],
    airlocks: []
  };
}

function buildBuildingDeck(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = buildHullRegions(formState.columns, formState.rows, formState.hullShape, "building");
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const roomTargets = allocateRoomCounts(hullRegions, formState.roomCount);
  const roomRects = hullRegions.flatMap((region, index) =>
    splitRectExactCount(region, roomTargets[index], formState.splitBias, formState.minRoomSize, rng)
  );
  const rooms = roomRects.map((rect, index) => ({
    id: `r${deckIndex}-${index}`,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    shape: "rect",
    markers: []
  }));

  const roomDoorTypes = assignBuildingRoomTypes(rooms, roomTables, formState.buildingSubtype, rng);
  applyFactionTerritories(rooms, formState);
  applyOrganicRoomShapes(rooms, formState, rng);
  const exteriorOpenings = buildBuildingExteriorOpenings(hullMask, rng, formState.buildingSubtype);
  const wallSegments = [
    ...buildHullWallsWithDoorGaps(hullMask, exteriorOpenings),
    ...buildPartitionSegments(rooms, rng),
    ...exteriorOpenings
  ];
  const finishedWalls = injectHorrorDecay(applyDoorTypesToPartitions(wallSegments, rooms, roomDoorTypes), rooms, rng, formState.theme);

  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms,
    corridors: [],
    wallSegments: finishedWalls,
    deckConnectors: [],
    airlocks: [],
    exteriorOpenings
  };
}

function buildBuildingCirculation(region, formState) {
  const corridors = [];
  const roomBands = [];
  const corridorWidth = 1;
  const lobbyDepth = clamp(Math.round(region.height * 0.18), 3, Math.max(3, region.height - formState.minRoomSize - 1));
  const lobbyWidth = clamp(Math.round(region.width * 0.28), 3, Math.max(3, region.width - (formState.minRoomSize * 2)));

  if (region.width >= region.height) {
    const mainY = region.y + Math.max(formState.minRoomSize, Math.floor(region.height * 0.42));
    const lobbyX = region.x + Math.floor((region.width - lobbyWidth) / 2);
    const lobbyY = region.y + region.height - lobbyDepth;
    const mainHall = { x: region.x, y: clamp(mainY, region.y + 2, region.y + region.height - 3), width: region.width, height: corridorWidth, waypoints: [] };
    const lobby = { x: lobbyX, y: lobbyY, width: lobbyWidth, height: lobbyDepth, waypoints: [] };
    const connector = {
      x: lobbyX + Math.floor(lobbyWidth / 2),
      y: mainHall.y + mainHall.height,
      width: corridorWidth,
      height: Math.max(0, lobby.y - (mainHall.y + mainHall.height)),
      waypoints: []
    };
    corridors.push(mainHall, lobby);
    if (connector.height > 0) corridors.push(connector);

    roomBands.push({ x: region.x, y: region.y, width: region.width, height: mainHall.y - region.y });
    roomBands.push({ x: region.x, y: mainHall.y + mainHall.height, width: Math.max(0, lobby.x - region.x), height: region.y + region.height - (mainHall.y + mainHall.height) });
    roomBands.push({
      x: lobby.x + lobby.width,
      y: mainHall.y + mainHall.height,
      width: Math.max(0, region.x + region.width - (lobby.x + lobby.width)),
      height: region.y + region.height - (mainHall.y + mainHall.height)
    });
  } else {
    const mainX = region.x + Math.floor(region.width / 2);
    const crossY = region.y + Math.max(formState.minRoomSize, Math.floor(region.height * 0.35));
    const lobby = {
      x: region.x + Math.floor((region.width - lobbyWidth) / 2),
      y: region.y + region.height - lobbyDepth,
      width: Math.min(lobbyWidth, region.width),
      height: lobbyDepth,
      waypoints: []
    };
    const mainHall = { x: clamp(mainX, region.x + 2, region.x + region.width - 3), y: region.y, width: corridorWidth, height: region.height, waypoints: [] };
    const crossHall = { x: region.x, y: clamp(crossY, region.y + 2, region.y + region.height - 3), width: region.width, height: corridorWidth, waypoints: [] };
    corridors.push(mainHall, crossHall, lobby);

    roomBands.push({ x: region.x, y: region.y, width: mainHall.x - region.x, height: crossHall.y - region.y });
    roomBands.push({ x: mainHall.x + mainHall.width, y: region.y, width: region.x + region.width - (mainHall.x + mainHall.width), height: crossHall.y - region.y });
    roomBands.push({ x: region.x, y: crossHall.y + crossHall.height, width: lobby.x - region.x, height: region.y + region.height - (crossHall.y + crossHall.height) });
    roomBands.push({
      x: lobby.x + lobby.width,
      y: crossHall.y + crossHall.height,
      width: region.x + region.width - (lobby.x + lobby.width),
      height: region.y + region.height - (crossHall.y + crossHall.height)
    });
  }

  return {
    corridors: corridors.filter((corridor) => corridor.width > 0 && corridor.height > 0),
    roomBands: roomBands.filter((band) => band.width > 0 && band.height > 0)
  };
}

function buildBuildingDeckWithHallway(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = buildHullRegions(formState.columns, formState.rows, formState.hullShape, "building");
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const hallways = [];
  const roomRects = [];

  for (const region of hullRegions) {
    const circulation = buildBuildingCirculation(region, formState);
    hallways.push(...circulation.corridors);
    const candidateBands = circulation.roomBands.filter((band) => band.width >= formState.minRoomSize && band.height >= formState.minRoomSize);
    const regionRoomCount = Math.max(2, Math.round(formState.roomCount * ((region.width * region.height) / Math.max(1, hull.width * hull.height))));
    const counts = allocateRoomCounts(candidateBands, regionRoomCount);
    candidateBands.forEach((band, index) => {
      roomRects.push(...splitRectExactCount(band, counts[index], formState.splitBias, formState.minRoomSize, rng));
    });
  }

  const rooms = roomRects.map((rect, index) => ({ id: `r${deckIndex}-${index}`, ...rect, shape: "rect", markers: [] }));
  const roomDoorTypes = assignBuildingRoomTypes(rooms, roomTables, formState.buildingSubtype, rng);
  applyFactionTerritories(rooms, formState);
  applyOrganicRoomShapes(rooms, formState, rng);
  const exteriorOpenings = buildBuildingExteriorOpenings(hullMask, rng, formState.buildingSubtype);
  const hallwayWalls = hallways.flatMap((hallRect) => buildHallwayWalls(hallRect, rooms));
  const wallSegments = [
    ...buildHullWallsWithDoorGaps(hullMask, exteriorOpenings),
    ...buildPartitionSegments(rooms, rng),
    ...hallwayWalls,
    ...exteriorOpenings
  ];
  const finishedWalls = dedupeSegments(injectHorrorDecay(applyDoorTypesToPartitions(wallSegments, rooms, roomDoorTypes), rooms, rng, formState.theme), true);

  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms,
    corridors: hallways,
    wallSegments: finishedWalls,
    deckConnectors: [],
    airlocks: [],
    exteriorOpenings
  };
}

function buildWildernessDeck(deckIndex, deckName, formState, roomTables, rng) {
  const hullRegions = [{ x: 1, y: 1, width: formState.columns - 2, height: formState.rows - 2 }];
  const hullMask = buildHullMask(formState.columns, formState.rows, hullRegions);
  const hull = boundingRectFromRegions(hullRegions);
  const clearings = [];
  const targetAreas = Math.max(5, Math.min(18, formState.roomCount));
  const attempts = targetAreas * 24;

  for (let i = 0; i < attempts && clearings.length < targetAreas; i += 1) {
    const width = randomInt(rng, Math.max(3, formState.minRoomSize), Math.max(4, formState.maxRoomSize + 2));
    const height = randomInt(rng, Math.max(3, formState.minRoomSize), Math.max(4, formState.maxRoomSize + 2));
    const x = randomInt(rng, hull.x, Math.max(hull.x, hull.x + hull.width - width));
    const y = randomInt(rng, hull.y, Math.max(hull.y, hull.y + hull.height - height));
    const rect = { x, y, width, height };
    if (clearings.some((room) => rectsOverlap(expandRect(room, 2), rect))) continue;
    clearings.push({
      id: `w${deckIndex}-${clearings.length}`,
      ...rect,
      shape: rng() > 0.55 ? "circle" : "rect",
      markers: []
    });
  }

  assignWildernessAreaTypes(clearings, roomTables, formState.theme, rng);
  applyFactionTerritories(clearings, formState);
  const occupancy = makeGrid(formState.columns, formState.rows, false);
  const roomType = makeGrid(formState.columns, formState.rows, "");
  const roomIdGrid = makeGrid(formState.columns, formState.rows, "");
  for (const room of clearings) {
    fillRectCells(occupancy, room, true);
    fillRectCells(roomType, room, "room");
    fillRectCells(roomIdGrid, room, room.id);
  }

  const trails = [];
  const connections = [];
  for (let i = 1; i < clearings.length; i += 1) {
    const from = roomCenter(clearings[i]);
    const to = roomCenter(nearestRoomForIndex(clearings, i));
    const trail = carveCorridor(to, from, occupancy, roomType, 1, hullMask);
    if (trail.length) {
      trails.push(...trail);
      connections.push([clearings[i].id, nearestRoomForIndex(clearings, i).id]);
    }
  }
  ensureCorridorConnectivity(clearings, connections, trails, occupancy, roomType, 1, hullMask, formState);

  const wilderness = buildWildernessFeatures(clearings, formState, rng);
  return {
    deckIndex,
    deckName,
    columns: formState.columns,
    rows: formState.rows,
    hull,
    hullRegions,
    hullMask,
    rooms: clearings,
    corridors: trails,
    wallSegments: wilderness.wallSegments,
    deckConnectors: [],
    airlocks: [],
    wilderness
  };
}

function applyOrganicRoomShapes(rooms, formState, rng) {
  if (!rooms?.length) return rooms;

  if (formState.circularSpecialRooms) {
    applyCircularRoomShapes(rooms);
  }

  if (formState.cornerStyle === "square") return rooms;

  for (const room of rooms) {
    if (room.shape === "circle" || room.shape === "cave") continue;
    if (formState.cornerStyle === "chamfer") {
      const points = buildChamferedPoints(room, formState.chamferSize);
      if (points) {
        room.shape = "polygon";
        room.points = points;
      }
      continue;
    }
    if (formState.cornerStyle === "perturb") {
      const points = buildPerturbedPoints(room, rng);
      if (points) {
        room.shape = "polygon";
        room.points = points;
      }
    }
  }
  return rooms;
}

function applyCircularRoomShapes(rooms) {
  for (const room of rooms) {
    if (!CIRCULAR_ROOM_TYPES.has(room.type)) continue;
    if (room.width < 3 || room.height < 3) continue;
    const size = Math.min(room.width, room.height);
    const offsetX = (room.width - size) / 2;
    const offsetY = (room.height - size) / 2;
    room.shape = "circle";
    room.circleX = room.x + offsetX;
    room.circleY = room.y + offsetY;
    room.circleR = size / 2;
  }
}

function buildChamferedPoints(room, chamferSize = 1) {
  if (room.width < chamferSize * 2 + 2 || room.height < chamferSize * 2 + 2) return null;
  const c = chamferSize;
  const { x, y, width: w, height: h } = room;
  return [
    { x: x + c, y },
    { x: x + w - c, y },
    { x: x + w, y: y + c },
    { x: x + w, y: y + h - c },
    { x: x + w - c, y: y + h },
    { x: x + c, y: y + h },
    { x, y: y + h - c },
    { x, y: y + c }
  ];
}

function buildPerturbedPoints(room, rng, amount = 0.4) {
  if (room.width < 3 || room.height < 3) return null;
  const jitter = () => round((rng() - 0.5) * 2 * amount, 2);
  return [
    { x: room.x + jitter(), y: room.y + jitter() },
    { x: room.x + room.width + jitter(), y: room.y + jitter() },
    { x: room.x + room.width + jitter(), y: room.y + room.height + jitter() },
    { x: room.x + jitter(), y: room.y + room.height + jitter() }
  ];
}

function countClosedNeighbours(openMask, x, y, columns, rows) {
  let closed = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows || !openMask[ny]?.[nx]) {
        closed += 1;
      }
    }
  }
  return closed;
}

function floodFillOpenRegion(openMask, visited, startX, startY, columns, rows) {
  const cells = [];
  const stack = [{ x: startX, y: startY }];
  while (stack.length) {
    const { x, y } = stack.pop();
    if (x < 0 || y < 0 || x >= columns || y >= rows) continue;
    if (visited[y][x] || !openMask[y][x]) continue;
    visited[y][x] = true;
    cells.push({ x, y });
    stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
  }
  return cells;
}

function buildCaveChambers(openMask, targetCount, minRoomSize, rng, deckIndex) {
  const openCells = [];
  for (let y = 1; y < openMask.length - 1; y += 1) {
    for (let x = 1; x < (openMask[y]?.length ?? 0) - 1; x += 1) {
      if (openMask[y][x]) openCells.push({ x, y });
    }
  }
  if (!openCells.length) return [];

  const seeds = pickSeparatedOpenCells(openCells, Math.min(targetCount, Math.max(4, Math.floor(openCells.length / 18))), Math.max(3, minRoomSize * 2), rng);
  if (!seeds.length) seeds.push(openCells[Math.floor(openCells.length / 2)]);

  const chamberCells = Array.from({ length: seeds.length }, () => []);
  const chamberIndexByCell = new Map();
  for (const cell of openCells) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < seeds.length; index += 1) {
      const seed = seeds[index];
      const distance = Math.abs(cell.x - seed.x) + Math.abs(cell.y - seed.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    chamberCells[bestIndex].push(cell);
    chamberIndexByCell.set(`${cell.x},${cell.y}`, bestIndex);
  }

  return chamberCells
    .filter((cells) => cells.length >= Math.max(6, minRoomSize * minRoomSize))
    .map((cells, index) => {
      const xs = cells.map((cell) => cell.x);
      const ys = cells.map((cell) => cell.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      return {
        id: `c${deckIndex}-${index}`,
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        shape: "cave",
        cells,
        markers: [],
        chamberIndexByCell
      };
    });
}

function pickSeparatedOpenCells(cells, targetCount, minDistance, rng) {
  const pool = [...cells];
  const chosen = [];
  while (pool.length && chosen.length < targetCount) {
    const pick = pool.splice(randomInt(rng, 0, pool.length - 1), 1)[0];
    if (chosen.every((cell) => Math.abs(cell.x - pick.x) + Math.abs(cell.y - pick.y) >= minDistance)) {
      chosen.push(pick);
    }
  }
  return chosen;
}

function buildCaveRoomConnections(rooms) {
  const cellToRoom = new Map();
  for (const room of rooms) {
    for (const cell of room.cells ?? []) {
      cellToRoom.set(`${cell.x},${cell.y}`, room.id);
    }
  }
  const connections = new Set();
  for (const room of rooms) {
    for (const cell of room.cells ?? []) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const neighbor = cellToRoom.get(`${cell.x + dx},${cell.y + dy}`);
        if (!neighbor || neighbor === room.id) continue;
        connections.add([room.id, neighbor].sort().join("|"));
      }
    }
  }
  return Array.from(connections, (key) => key.split("|"));
}

function extractGridWallSegments(openMask, columns, rows) {
  const segments = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!openMask[y]?.[x]) continue;
      if (!openMask[y - 1]?.[x]) segments.push({ x1: x, y1: y, x2: x + 1, y2: y });
      if (!openMask[y + 1]?.[x]) segments.push({ x1: x, y1: y + 1, x2: x + 1, y2: y + 1 });
      if (!openMask[y]?.[x - 1]) segments.push({ x1: x, y1: y, x2: x, y2: y + 1 });
      if (!openMask[y]?.[x + 1]) segments.push({ x1: x + 1, y1: y, x2: x + 1, y2: y + 1 });
    }
  }
  return mergeCollinearSegments(dedupeSegments(segments));
}

function mergeCollinearSegments(segments) {
  const horiz = segments.filter((segment) => segment.y1 === segment.y2).sort((a, b) => a.y1 - b.y1 || a.x1 - b.x1);
  const vert = segments.filter((segment) => segment.x1 === segment.x2).sort((a, b) => a.x1 - b.x1 || a.y1 - b.y1);
  return [...mergeRuns(horiz, true), ...mergeRuns(vert, false)];
}

function mergeRuns(segments, horizontal) {
  const out = [];
  for (const segment of segments) {
    const last = out[out.length - 1];
    if (last && horizontal && last.y1 === segment.y1 && last.x2 === segment.x1 && !last.door && !segment.door) {
      last.x2 = segment.x2;
      continue;
    }
    if (last && !horizontal && last.x1 === segment.x1 && last.y2 === segment.y1 && !last.door && !segment.door) {
      last.y2 = segment.y2;
      continue;
    }
    out.push({ ...segment });
  }
  return out;
}

function assignScifiRoomTypes(rooms, roomTables, rng) {
  const systemId = game.system?.id ?? "";
  const overrides = ["sla-mothership", "sla-industries-brp"].includes(systemId) ? roomTables.sla_overrides ?? {} : {};
  const usedKeys = new Set();
  const counters = new Map();

  const bowSorted = [...rooms].sort((a, b) => a.x - b.x || a.y - b.y);
  const sternSorted = [...rooms].sort((a, b) => (b.x + b.width) - (a.x + a.width) || a.y - b.y);
  const anySorted = [...rooms].sort((a, b) => (b.width * b.height) - (a.width * a.height));

  reserveRoom("bridge", bowSorted);
  reserveRoom("engineering", sternSorted);
  reserveRoom("medical", anySorted);

  const weightedPool = roomTables.rooms.filter((entry) => !entry.unique && entry.key !== "void");

  for (const room of rooms) {
    if (room.type) continue;
    const choice = weightedChoice(weightedPool, rng);
    room.type = choice.key;
    counters.set(choice.key, (counters.get(choice.key) ?? 0) + 1);
    const labelBase = overrides[choice.key]?.label ?? choice.label;
    room.label = choice.numbered ? `${labelBase} ${counters.get(choice.key)}` : labelBase;
  }

  function reserveRoom(key, orderedRooms) {
    const entry = roomTables.rooms.find((room) => room.key === key);
    if (!entry || usedKeys.has(key)) return;
    let target = orderedRooms.find((room) => room.width >= entry.minSize[0] && room.height >= entry.minSize[1] && !room.type);
    if (!target) {
      target = orderedRooms.find((room) => !room.type);
    }
    if (!target) return;
    usedKeys.add(key);
    target.type = key;
    const label = overrides[key]?.label ?? entry.label;
    target.label = label;
  }
}

function assignDungeonRoomTypes(rooms, roomTables, connections, hullMask, rng) {
  const entries = roomTables.dungeon?.rooms ?? [];
  const counters = new Map();
  const roomDoorTypes = {};
  const usedKeys = new Set();
  if (!rooms.length || !entries.length) return roomDoorTypes;

  const byAreaDesc = [...rooms].sort((a, b) => (b.width * b.height) - (a.width * a.height));
  const byAreaAsc = [...rooms].sort((a, b) => (a.width * a.height) - (b.width * b.height));
  const edgeRooms = [...rooms].sort((a, b) => edgeDistance(a, hullMask) - edgeDistance(b, hullMask));
  const entranceRoom = reserveRoomEntry(entries.find((entry) => entry.key === "entrance"), edgeRooms, "entrance");
  const distances = computeRoomGraphDistances(rooms, connections, entranceRoom?.id);
  const byDistanceDesc = [...rooms].sort((a, b) => (distances.get(b.id) ?? -1) - (distances.get(a.id) ?? -1));
  const byDistanceAsc = [...rooms].sort((a, b) => (distances.get(a.id) ?? 999) - (distances.get(b.id) ?? 999));
  const farLargeRooms = [...rooms]
    .sort((a, b) => ((distances.get(b.id) ?? -1) * 100 + (b.width * b.height)) - ((distances.get(a.id) ?? -1) * 100 + (a.width * a.height)));

  const bossRoom = reserveRoomEntry(entries.find((entry) => entry.key === "boss-chamber"), farLargeRooms, "boss-chamber");
  const throneRoom = reserveRoomEntry(entries.find((entry) => entry.key === "throne-room"), sortRoomsByProximity(rooms, bossRoom, distances, "support"), "throne-room");
  const vaultRoom = reserveRoomEntry(entries.find((entry) => entry.key === "vault"), sortRoomsByProximity(rooms, bossRoom ?? throneRoom, distances, "far"), "vault");
  const ritualRoom = reserveRoomEntry(entries.find((entry) => entry.key === "ritual-room"), sortRoomsByProximity(rooms, bossRoom ?? throneRoom, distances, "support"), "ritual-room");
  reserveRoomEntry(entries.find((entry) => entry.key === "shrine"), sortRoomsByDistanceBand(rooms, distances, 0.45, 0.75), "shrine");
  reserveRoomEntry(entries.find((entry) => entry.key === "library"), byAreaDesc, "library");
  reserveRoomEntry(entries.find((entry) => entry.key === "laboratory"), byAreaDesc, "laboratory");
  reserveRoomEntry(entries.find((entry) => entry.key === "alchemy"), sortRoomsByDistanceBand(rooms, distances, 0.35, 0.8), "alchemy");
  reserveRoomEntry(entries.find((entry) => entry.key === "forge"), sortRoomsByDistanceBand(rooms, distances, 0.25, 0.7), "forge");
  reserveRoomEntry(entries.find((entry) => entry.key === "trophy-room"), sortRoomsByProximity(rooms, bossRoom ?? throneRoom, distances, "support"), "trophy-room");
  reserveRoomEntry(entries.find((entry) => entry.key === "cistern"), byAreaDesc, "cistern");
  reserveRoomEntry(entries.find((entry) => entry.key === "prison"), byDistanceDesc, "prison");
  reserveRoomEntry(entries.find((entry) => entry.key === "armoury"), byDistanceAsc, "armoury");
  reserveRoomEntry(entries.find((entry) => entry.key === "guardroom"), byDistanceAsc, "guardroom");
  reserveRoomEntry(entries.find((entry) => entry.key === "antechamber"), sortRoomsByProximity(rooms, entranceRoom, distances, "support"), "antechamber");
  reserveRoomEntry(entries.find((entry) => entry.key === "torture"), byDistanceDesc, "torture");
  reserveRoomEntry(entries.find((entry) => entry.key === "collapsed"), byAreaAsc, "collapsed");
  reserveRoomEntry(entries.find((entry) => entry.key === "trap-room"), byAreaAsc, "trap-room");

  const weightedPool = entries.filter((entry) => !entry.unique && entry.key !== "void");
  for (const room of rooms) {
    if (room.type) continue;
    const choice = weightedChoice(weightedPool, rng);
    setRoomType(room, choice);
  }

  return roomDoorTypes;

  function reserveRoomEntry(entry, orderedRooms, labelKey) {
    if (!entry || usedKeys.has(labelKey)) return null;
    let target = orderedRooms.find((room) => !room.type && roomMeetsEntry(room, entry));
    if (!target) target = orderedRooms.find((room) => !room.type);
    if (!target) return null;
    setRoomType(target, entry);
    usedKeys.add(labelKey);
    return target;
  }

  function setRoomType(room, entry) {
    room.type = entry.key;
    counters.set(entry.key, (counters.get(entry.key) ?? 0) + 1);
    room.label = entry.numbered ? `${entry.label} ${counters.get(entry.key)}` : entry.label;
    roomDoorTypes[room.id] = entry.doorType ?? "normal";
  }
}

function sortRoomsByProximity(rooms, anchorRoom, distances, mode = "support") {
  if (!anchorRoom) return [...rooms];
  const anchorCenter = roomCenter(anchorRoom);
  return [...rooms].sort((a, b) => {
    const distA = Math.abs(roomCenter(a).x - anchorCenter.x) + Math.abs(roomCenter(a).y - anchorCenter.y);
    const distB = Math.abs(roomCenter(b).x - anchorCenter.x) + Math.abs(roomCenter(b).y - anchorCenter.y);
    const scoreA = mode === "far" ? ((distances.get(a.id) ?? 0) * 20 - distA) : ((distances.get(a.id) ?? 0) * 5 - distA);
    const scoreB = mode === "far" ? ((distances.get(b.id) ?? 0) * 20 - distB) : ((distances.get(b.id) ?? 0) * 5 - distB);
    return scoreB - scoreA;
  });
}

function sortRoomsByDistanceBand(rooms, distances, lowRatio = 0.3, highRatio = 0.8) {
  const maxDistance = Math.max(1, ...Array.from(distances.values(), (value) => value ?? 0));
  const low = maxDistance * lowRatio;
  const high = maxDistance * highRatio;
  return [...rooms].sort((a, b) => {
    const da = distances.get(a.id) ?? 0;
    const db = distances.get(b.id) ?? 0;
    const bandA = da >= low && da <= high ? 1 : 0;
    const bandB = db >= low && db <= high ? 1 : 0;
    if (bandA !== bandB) return bandB - bandA;
    return db - da;
  });
}

function assignBuildingRoomTypes(rooms, roomTables, subtype, rng) {
  const entries = roomTables.building?.subtypes?.[subtype]?.rooms ?? [];
  const counters = new Map();
  const roomDoorTypes = {};
  if (!rooms.length || !entries.length) return roomDoorTypes;

  const ordered = [...rooms].sort((a, b) => a.x - b.x || a.y - b.y);
  reserve(entries.find((entry) => entry.placement === "entrance"), ordered);
  reserve(entries.find((entry) => entry.key === "lobby" || entry.key === "foyer" || entry.key === "loading" || entry.key === "common-room"), ordered);

  const weightedPool = entries.filter((entry) => !entry.unique && entry.key !== "void");
  for (const room of rooms) {
    if (room.type) continue;
    const choice = weightedChoice(weightedPool, rng);
    assign(choice, room);
  }

  return roomDoorTypes;

  function reserve(entry, orderedRooms) {
    if (!entry) return;
    let target = orderedRooms.find((room) => !room.type && roomMeetsEntry(room, entry));
    if (!target) target = orderedRooms.find((room) => !room.type);
    if (!target) return;
    assign(entry, target);
  }

  function assign(entry, room) {
    room.type = entry.key;
    counters.set(entry.key, (counters.get(entry.key) ?? 0) + 1);
    room.label = entry.numbered ? `${entry.label} ${counters.get(entry.key)}` : entry.label;
    roomDoorTypes[room.id] = entry.doorType ?? "normal";
  }
}

function applyFactionTerritories(rooms, formState) {
  const preset = FACTION_PRESETS[formState.factionPreset];
  if (!preset?.length) return;
  for (const room of rooms) {
    const match = preset.find((faction) => faction.roomTypes.includes(room.type));
    const fallback = preset[hashSeed(room.id || room.label || room.type || "room") % preset.length];
    room.faction = match?.name ?? fallback.name;
    room.factionColor = match?.color ?? fallback.color;
  }
}

function assignWildernessAreaTypes(clearings, _roomTables, theme, rng) {
  const themedPools = {
    forest: [
      { key: "camp", label: "CAMP", weight: 2 },
      { key: "ruins", label: "RUINS", weight: 1 },
      { key: "glade", label: "GLADE", weight: 3 },
      { key: "ambush", label: "AMBUSH SITE", weight: 1 },
      { key: "water", label: "WATER EDGE", weight: 1 }
    ],
    jungle: [
      { key: "nest", label: "NEST", weight: 2 },
      { key: "glade", label: "JUNGLE GLADE", weight: 2 },
      { key: "ruins", label: "OVERGROWN RUINS", weight: 1 },
      { key: "ambush", label: "AMBUSH SITE", weight: 2 },
      { key: "water", label: "MUDDY POOL", weight: 1 }
    ],
    plains: [
      { key: "camp", label: "CAMP", weight: 2 },
      { key: "ridge", label: "RIDGE", weight: 2 },
      { key: "crossing", label: "TRAIL CROSSING", weight: 2 },
      { key: "ambush", label: "KILL ZONE", weight: 1 }
    ],
    swamp: [
      { key: "water", label: "MARSH POOL", weight: 3 },
      { key: "camp", label: "DRY CAMP", weight: 1 },
      { key: "ambush", label: "SUNKEN AMBUSH", weight: 2 },
      { key: "ruins", label: "SUNKEN RUINS", weight: 1 }
    ],
    tundra: [
      { key: "camp", label: "FROST CAMP", weight: 2 },
      { key: "ridge", label: "ICE RIDGE", weight: 2 },
      { key: "crossing", label: "SNOW TRACKS", weight: 2 },
      { key: "ambush", label: "WHITEOUT SITE", weight: 1 }
    ],
    badlands: [
      { key: "ridge", label: "RIDGE", weight: 3 },
      { key: "ruins", label: "SCRAP RUINS", weight: 2 },
      { key: "camp", label: "RAIDER CAMP", weight: 2 },
      { key: "ambush", label: "AMBUSH SITE", weight: 2 }
    ]
  };
  const pool = themedPools[theme] ?? themedPools.forest;
  const counters = new Map();
  for (const area of clearings) {
    const choice = weightedChoice(pool, rng);
    area.type = choice.key;
    counters.set(choice.key, (counters.get(choice.key) ?? 0) + 1);
    area.label = counters.get(choice.key) > 1 ? `${choice.label} ${counters.get(choice.key)}` : choice.label;
  }
}

function buildWildernessFeatures(clearings, formState, rng) {
  const treeClusters = [];
  const waterFeatures = [];
  const encounterZones = [];
  const wallSegments = [];
  const ridgelines = [];
  const ravines = [];

  for (const area of clearings) {
    const center = roomCenter(area);
    const clusterCount = Math.max(2, Math.round((area.width * area.height) / 8));
    if (!["plains", "tundra"].includes(formState.theme)) {
      treeClusters.push({
        x: center.x,
        y: center.y,
        radius: Math.max(1.2, Math.min(area.width, area.height) * 0.4),
        count: clusterCount
      });
    }
    if (area.type === "water" || (formState.theme === "swamp" && rng() > 0.55)) {
      waterFeatures.push({
        x: center.x,
        y: center.y,
        width: Math.max(2, Math.round(area.width * 0.7)),
        height: Math.max(2, Math.round(area.height * 0.45))
      });
    }
    if (["ambush", "nest", "ruins", "camp"].includes(area.type) && rng() > 0.35) {
      encounterZones.push({
        roomId: area.id,
        x: center.x,
        y: center.y,
        radius: Math.max(1.5, Math.min(area.width, area.height) * 0.35),
        label: area.label
      });
    }
    if (formState.hullShape === "camp" && area.type === "camp") {
      wallSegments.push(...rectangleSegments(area.x, area.y, area.width, area.height));
    }

    const elevationChance = ["ridge", "crossing", "ambush"].includes(area.type) ? 0.75 : 0.28;
    if (rng() < elevationChance) {
      const feature = buildElevationFeature(area, rng, ["badlands", "tundra"].includes(formState.theme) ? "ridge" : (rng() > 0.52 ? "ridge" : "ravine"));
      if (feature) {
        if (feature.kind === "ridge") ridgelines.push(feature);
        else ravines.push(feature);
        wallSegments.push(...feature.segments);
      }
    }
  }

  return { treeClusters, waterFeatures, encounterZones, wallSegments, ridgelines, ravines };
}

function buildElevationFeature(area, rng, preferredKind = "ridge") {
  const horizontal = area.width >= area.height ? rng() > 0.35 : rng() > 0.65;
  const marginX = Math.max(1, Math.floor(area.width * 0.15));
  const marginY = Math.max(1, Math.floor(area.height * 0.15));
  const x1 = area.x + marginX;
  const x2 = area.x + area.width - marginX;
  const y1 = area.y + marginY;
  const y2 = area.y + area.height - marginY;
  if (horizontal) {
    const y = clampInt(area.y + Math.floor(area.height / 2), area.y + 1, area.y + area.height - 1, area.y + 1);
    return {
      kind: preferredKind,
      x1,
      y1: y,
      x2,
      y2: y,
      segments: segmentedBarrier(x1, y, x2, y, preferredKind)
    };
  }
  const x = clampInt(area.x + Math.floor(area.width / 2), area.x + 1, area.x + area.width - 1, area.x + 1);
  return {
    kind: preferredKind,
    x1: x,
    y1,
    x2: x,
    y2,
    segments: segmentedBarrier(x, y1, x, y2, preferredKind)
  };
}

function segmentedBarrier(x1, y1, x2, y2, terrain = "ridge") {
  const out = [];
  if (y1 === y2) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x < end; x += 1) {
      out.push({
        x1: x,
        y1,
        x2: x + 1,
        y2,
        movementOnly: true,
        terrain
      });
    }
    return out;
  }

  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y < end; y += 1) {
    out.push({
      x1,
      y1: y,
      x2,
      y2: y + 1,
      movementOnly: true,
      terrain
    });
  }
  return out;
}

function roomMeetsEntry(room, entry) {
  const [minW, minH] = entry.minSize ?? [1, 1];
  return room.width >= minW && room.height >= minH;
}

function edgeDistance(room, hullMask) {
  let best = Number.POSITIVE_INFINITY;
  for (let y = room.y; y < room.y + room.height; y += 1) {
    for (let x = room.x; x < room.x + room.width; x += 1) {
      const distance = Number(!hullMask[y - 1]?.[x]) + Number(!hullMask[y + 1]?.[x]) + Number(!hullMask[y]?.[x - 1]) + Number(!hullMask[y]?.[x + 1]);
      if (distance > 0) return 0;
      best = Math.min(best, x + y);
    }
  }
  return best;
}

function computeRoomGraphDistances(rooms, connections, sourceId) {
  const adjacency = new Map(rooms.map((room) => [room.id, new Set()]));
  for (const [a, b] of connections) {
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }
  const distances = new Map();
  if (!sourceId) return distances;
  const queue = [[sourceId, 0]];
  distances.set(sourceId, 0);
  while (queue.length) {
    const [current, distance] = queue.shift();
    for (const next of adjacency.get(current) ?? []) {
      if (distances.has(next)) continue;
      distances.set(next, distance + 1);
      queue.push([next, distance + 1]);
    }
  }
  return distances;
}

function injectSecretDoors(wallSegments, rng, densityKey = "minimal") {
  const chance = SECRET_DOOR_CHANCE[densityKey] ?? 0.01;
  if (chance <= 0) return wallSegments;
  return wallSegments.map((segment) => {
    if (segment.door || segment.isWindow) return segment;
    const length = Math.abs(segment.x2 - segment.x1) + Math.abs(segment.y2 - segment.y1);
    if (length !== 1) return segment;
    if (rng() >= chance) return segment;
    return { ...segment, door: DOOR_SECRET, ds: DOOR_STATE_LOCKED };
  });
}

function injectHorrorDecay(wallSegments, _rooms, rng, theme) {
  if (!["derelict-house", "asylum", "haunted-manor", "bloodbath"].includes(theme)) return wallSegments;
  return wallSegments.map((segment) => {
    if (segment.door || segment.isWindow) return segment;
    const length = Math.abs(segment.x2 - segment.x1) + Math.abs(segment.y2 - segment.y1);
    if (length !== 1) return segment;
    const roll = rng();
    if (roll < 0.12) return { ...segment, door: DOOR_BASIC, ds: DOOR_STATE_LOCKED };
    if (roll < 0.18) return { ...segment, door: DOOR_BASIC, ds: DOOR_STATE_OPEN };
    return segment;
  });
}

function applyBulkheadUpgrades(wallSegments, rooms) {
  if (!rooms?.length) return wallSegments;
  return wallSegments.map((seg) => {
    if (!seg.door) return seg;
    const touchedRooms = rooms.filter((r) => segmentTouchesRoom(seg, r));
    const types = touchedRooms.map((r) => r.type);
    const isBulkhead = BULKHEAD_PAIRS.some(([a, b]) =>
      (types.includes(a) && types.includes(b)) ||
      types.includes("reactor") || types.includes("weapon-bay")
    );
    if (!isBulkhead) return seg;
    return { ...seg, ds: DOOR_STATE_LOCKED, isBulkhead: true };
  });
}

function buildBulkheadSvg(wallSegments, gridSize, palette) {
  const bulkheads = wallSegments.filter((s) => s.isBulkhead);
  if (!bulkheads.length) return "";
  return bulkheads.map((seg) => {
    const x1 = seg.x1 * gridSize, y1 = seg.y1 * gridSize;
    const x2 = seg.x2 * gridSize, y2 = seg.y2 * gridSize;
    const isH = y1 === y2;
    const off = 3;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${palette.hull}" stroke-width="6" stroke-linecap="square" opacity="0.9"/>` +
      `<line x1="${isH ? x1 : x1 - off}" y1="${isH ? y1 - off : y1}" x2="${isH ? x2 : x2 - off}" y2="${isH ? y2 - off : y2}" stroke="${palette.detail}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>` +
      `<line x1="${isH ? x1 : x1 + off}" y1="${isH ? y1 + off : y1}" x2="${isH ? x2 : x2 + off}" y2="${isH ? y2 + off : y2}" stroke="${palette.detail}" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.6"/>`;
  }).join("");
}

function nearestRoomEdgeCell(room, target) {
  const tc = roomCenter(target);
  const edgeCells = [
    { x: room.x,                                      y: Math.floor(room.y + room.height / 2) },
    { x: room.x + room.width - 1,                     y: Math.floor(room.y + room.height / 2) },
    { x: Math.floor(room.x + room.width / 2),         y: room.y },
    { x: Math.floor(room.x + room.width / 2),         y: room.y + room.height - 1 }
  ];
  return edgeCells.sort((a, b) =>
    (Math.abs(a.x - tc.x) + Math.abs(a.y - tc.y)) - (Math.abs(b.x - tc.x) + Math.abs(b.y - tc.y))
  )[0];
}

function traceMaintenanceShaft(src, dest) {
  const srcEdge = nearestRoomEdgeCell(src, dest);
  const dstEdge = nearestRoomEdgeCell(dest, src);
  const segments = [];
  const hatchPoints = [];

  // L-shaped route: horizontal then vertical
  const midX = srcEdge.x;
  const x1 = Math.min(srcEdge.x, midX), x2 = Math.max(srcEdge.x, midX);
  for (let x = x1; x <= x2; x++) segments.push({ x, y: srcEdge.y, width: 1, height: 1 });
  const y1 = Math.min(srcEdge.y, dstEdge.y), y2 = Math.max(srcEdge.y, dstEdge.y);
  for (let y = y1; y <= y2; y++) segments.push({ x: midX, y, width: 1, height: 1 });

  hatchPoints.push({ x: srcEdge.x, y: srcEdge.y, roomId: src.id, label: "ACCESS HATCH" });
  hatchPoints.push({ x: dstEdge.x, y: dstEdge.y, roomId: dest.id, label: "ACCESS HATCH" });

  return { id: `shaft-${src.id}-${dest.id}`, segments, hatchPoints, fromRoom: src.id, toRoom: dest.id };
}

function buildMaintenanceShafts(deck, formState, rng) {
  if (!["bsp", "corridor"].includes(formState.mode)) return [];
  if (formState.maintenanceShaftDensity === "none") return [];

  const densityChance = { sparse: 0.25, normal: 0.5, dense: 0.8 }[formState.maintenanceShaftDensity ?? "sparse"] ?? 0.3;
  const sourceRooms = deck.rooms.filter((r) => MAINTENANCE_SHAFT_SOURCES.has(r.type));
  const destRooms   = deck.rooms.filter((r) => MAINTENANCE_SHAFT_DESTINATIONS.has(r.type));
  if (!sourceRooms.length || !destRooms.length) return [];

  const shafts = [];
  const usedPairs = new Set();

  for (const src of sourceRooms) {
    if (rng() > densityChance) continue;
    const candidates = destRooms
      .filter((d) => d.id !== src.id)
      .sort((a, b) => {
        const ca = roomCenter(src);
        const da = Math.abs(roomCenter(a).x - ca.x) + Math.abs(roomCenter(a).y - ca.y);
        const db = Math.abs(roomCenter(b).x - ca.x) + Math.abs(roomCenter(b).y - ca.y);
        return da - db;
      });
    const dest = candidates[0];
    if (!dest) continue;

    const pairKey = [src.id, dest.id].sort().join("|");
    if (usedPairs.has(pairKey)) continue;
    usedPairs.add(pairKey);

    const shaft = traceMaintenanceShaft(src, dest);
    if (shaft) shafts.push(shaft);
  }

  return shafts;
}

function buildMaintenanceShaftDrawings(deck, formState) {
  const palette = paletteForFormState(formState);
  const shaftFill = palette.maintenanceFill ?? "#1a1a2a";
  const drawings = [];
  for (const shaft of deck.maintenanceShafts ?? []) {
    for (const seg of shaft.segments) {
      drawings.push({
        x: seg.x * formState.gridSize,
        y: seg.y * formState.gridSize,
        z: 5,
        hidden: true,
        locked: true,
        fillType: 1,
        fillColor: shaftFill,
        fillAlpha: 0.95,
        strokeWidth: 1,
        strokeColor: palette.line,
        strokeAlpha: 0.5,
        shape: { type: "r", width: formState.gridSize, height: formState.gridSize },
        flags: { [MODULE_ID]: { generatedDrawing: true, isMaintenanceShaft: true } }
      });
    }
  }
  return drawings;
}

function buildCellPerimeterWalls(cx, cy) {
  // Returns 4 wall segments (in cell coords) forming a 1×1 cell perimeter
  return [
    { x1: cx,   y1: cy,   x2: cx+1, y2: cy   },
    { x1: cx,   y1: cy+1, x2: cx+1, y2: cy+1 },
    { x1: cx,   y1: cy,   x2: cx,   y2: cy+1 },
    { x1: cx+1, y1: cy,   x2: cx+1, y2: cy+1 }
  ];
}

function buildMaintenanceShaftWalls(deck, formState) {
  const gs = formState.gridSize;
  const walls = [];
  for (const shaft of deck.maintenanceShafts ?? []) {
    for (const seg of shaft.segments) {
      for (const w of buildCellPerimeterWalls(seg.x, seg.y)) {
        walls.push({
          c: [w.x1 * gs, w.y1 * gs, w.x2 * gs, w.y2 * gs],
          move: MOVEMENT_NORMAL,
          sight: SENSE_NORMAL,
          sound: SENSE_NORMAL,
          light: SENSE_NORMAL,
          dir: CONST.WALL_DIRECTIONS?.BOTH ?? 0,
          door: DOOR_NONE,
          hidden: true,
          flags: { [MODULE_ID]: { generatedWall: true, isMaintenanceShaft: true } }
        });
      }
    }
    // Hatch doors (secret/locked) on room walls at shaft entry points
    for (const hatch of shaft.hatchPoints) {
      walls.push({
        c: [hatch.x * gs, hatch.y * gs, (hatch.x + 1) * gs, hatch.y * gs],
        move: MOVEMENT_NORMAL,
        sight: SENSE_NORMAL,
        sound: SENSE_NORMAL,
        light: SENSE_NORMAL,
        dir: CONST.WALL_DIRECTIONS?.BOTH ?? 0,
        door: DOOR_SECRET,
        ds: DOOR_STATE_LOCKED,
        hidden: true,
        flags: { [MODULE_ID]: { generatedWall: true, isMaintenanceShaft: true, isHatch: true } }
      });
    }
  }
  return walls;
}

function buildBuildingExteriorOpenings(hullMask, rng, subtype) {
  const hullWalls = buildHullWallSegments(hullMask);
  if (!hullWalls.length) return [];
  const hull = boundingRectFromRegions([{ x: 1, y: 1, width: hullMask[0]?.length - 2, height: hullMask.length - 2 }]);
  const bySide = classifyBuildingHullSides(hullWalls, hull);
  const config = getBuildingExteriorConfig(subtype);
  const chosen = [];
  const used = new Set();

  addOpenings(pickSideCandidates(bySide[config.front] ?? [], config.frontBias), config.frontDoors, "door", (segment) => ({
    ...collapseSegmentToSingleCell(segment),
    door: DOOR_BASIC,
    ds: DOOR_STATE_CLOSED
  }));

  addOpenings(pickSideCandidates(bySide[config.secondaryDoorSide] ?? [], "center"), config.secondaryDoors, "door", (segment) => ({
    ...collapseSegmentToSingleCell(segment),
    door: DOOR_BASIC,
    ds: DOOR_STATE_CLOSED
  }));

  const windowSides = config.windowSides.flatMap((side) => pickSideCandidates(bySide[side] ?? [], side === config.front ? "spread" : "edge"));
  addOpenings(windowSides, config.windows, "window", (segment) => ({
    ...collapseSegmentToSingleCell(segment),
    isWindow: true
  }));

  return chosen;

  function addOpenings(candidates, count, type, mapFn) {
    let added = 0;
    for (const segment of candidates) {
      if (added >= count) break;
      const opening = mapFn(segment);
      if (!opening) continue;
      const key = segmentKey(opening);
      if (used.has(key)) continue;
      used.add(key);
      chosen.push(opening);
      added += 1;
    }
  }
}

function classifyBuildingHullSides(hullWalls, hull) {
  const out = { north: [], south: [], east: [], west: [] };
  for (const segment of hullWalls) {
    if (segment.y1 === segment.y2) {
      if (segment.y1 <= hull.y) out.north.push(segment);
      else if (segment.y1 >= hull.y + hull.height) out.south.push(segment);
    } else if (segment.x1 === segment.x2) {
      if (segment.x1 <= hull.x) out.west.push(segment);
      else if (segment.x1 >= hull.x + hull.width) out.east.push(segment);
    }
  }
  for (const key of Object.keys(out)) {
    out[key].sort((a, b) => (a.x1 + a.x2 + a.y1 + a.y2) - (b.x1 + b.x2 + b.y1 + b.y2));
  }
  return out;
}

function getBuildingExteriorConfig(subtype) {
  switch (subtype) {
    case "warehouse":
      return { front: "south", secondaryDoorSide: "west", frontDoors: 2, secondaryDoors: 1, windows: 2, windowSides: ["north", "east"], frontBias: "center" };
    case "tavern":
      return { front: "south", secondaryDoorSide: "east", frontDoors: 2, secondaryDoors: 1, windows: 5, windowSides: ["south", "east", "west"], frontBias: "center" };
    case "mansion":
      return { front: "south", secondaryDoorSide: "north", frontDoors: 2, secondaryDoors: 1, windows: 8, windowSides: ["north", "south", "east", "west"], frontBias: "center" };
    case "horror":
      return { front: "south", secondaryDoorSide: "west", frontDoors: 1, secondaryDoors: 1, windows: 4, windowSides: ["north", "east", "west"], frontBias: "center" };
    case "residential":
      return { front: "south", secondaryDoorSide: "north", frontDoors: 1, secondaryDoors: 1, windows: 6, windowSides: ["south", "east", "west"], frontBias: "center" };
    case "office":
    default:
      return { front: "south", secondaryDoorSide: "east", frontDoors: 1, secondaryDoors: 1, windows: 6, windowSides: ["north", "south", "east", "west"], frontBias: "center" };
  }
}

function pickSideCandidates(segments, bias = "center") {
  if (!segments.length) return [];
  const sorted = [...segments];
  if (bias === "center") {
    const centerScore = averageSegmentPosition(sorted);
    sorted.sort((a, b) => Math.abs(segmentPosition(a) - centerScore) - Math.abs(segmentPosition(b) - centerScore));
    return sorted;
  }
  if (bias === "edge") {
    return sorted;
  }
  if (bias === "spread") {
    return spreadSegments(sorted);
  }
  return sorted;
}

function spreadSegments(segments) {
  if (segments.length <= 2) return segments;
  const result = [];
  const sorted = [...segments];
  let left = 0;
  let right = sorted.length - 1;
  while (left <= right) {
    if (left === right) {
      result.push(sorted[left]);
      break;
    }
    result.push(sorted[left], sorted[right]);
    left += 1;
    right -= 1;
  }
  return result;
}

function segmentPosition(segment) {
  return segment.x1 === segment.x2 ? (segment.y1 + segment.y2) / 2 : (segment.x1 + segment.x2) / 2;
}

function averageSegmentPosition(segments) {
  return segments.reduce((sum, segment) => sum + segmentPosition(segment), 0) / Math.max(1, segments.length);
}

function applyDoorTypesToPartitions(segments, rooms, roomDoorTypes) {
  if (!segments.length) return segments;
  return segments.map((segment) => {
    if (!segment.door || segment.isWindow) return segment;
    const room = rooms.find((candidate) => segmentTouchesRoom(segment, candidate));
    if (!room) return segment;
    const doorType = roomDoorTypes[room.id] ?? "normal";
    if (doorType === "locked") return { ...segment, ds: DOOR_STATE_LOCKED };
    if (doorType === "none") return { ...segment, door: false, ds: undefined };
    return segment;
  });
}

function segmentTouchesRoom(segment, room) {
  if (segment.x1 === segment.x2) {
    return segment.x1 >= room.x && segment.x1 <= room.x + room.width
      && Math.max(segment.y1, room.y) < Math.min(segment.y2, room.y + room.height);
  }
  return segment.y1 >= room.y && segment.y1 <= room.y + room.height
    && Math.max(segment.x1, room.x) < Math.min(segment.x2, room.x + room.width);
}

function segmentLength(segment) {
  return Math.abs(segment.x2 - segment.x1) + Math.abs(segment.y2 - segment.y1);
}

function countDoors(segments = []) {
  return segments.filter((segment) => Boolean(segment.door)).length;
}

function collapseSegmentToSingleCell(segment) {
  if (segment.x1 === segment.x2) {
    const y = Math.min(segment.y1, segment.y2);
    return { x1: segment.x1, y1: y, x2: segment.x2, y2: y + 1 };
  }
  const x = Math.min(segment.x1, segment.x2);
  return { x1: x, y1: segment.y1, x2: x + 1, y2: segment.y2 };
}

async function createFoundryScenes(deckPlan, formState) {
  const currentScene = game.scenes?.viewed ?? canvas.scene ?? null;
  const connectorJournal = await ensureConnectorJournal(deckPlan, formState);
  const connectorPages = new Map((connectorJournal?.pages?.contents ?? []).map((page) => [page.name, page.id]));
  const rootFolder = await ensureSceneFolder(ROOT_SCENE_FOLDER);
  const target = resolveRegenerationTarget(formState, deckPlan, currentScene);
  const furnitureTables = await getFurnitureTables().catch(() => null);
  const shipFolder = target.folder ?? await Folder.create({
    name: deckPlan.shipName,
    type: "Scene",
    color: "#2a4060",
    folder: rootFolder.id
  }).catch(async () => game.folders.find((folder) => folder.type === "Scene" && folder.name === deckPlan.shipName && folder.folder?.id === rootFolder.id));

  const scenes = [];
  for (let index = 0; index < deckPlan.decks.length; index += 1) {
    const deck = deckPlan.decks[index];
    await prepareDeckGenerationArtifacts(deck, formState, furnitureTables, deckPlan);
    const existingScene = target.scenes[index] ?? null;
    let scene = existingScene;
    if (existingScene) {
      await regenerateSceneInPlace(existingScene, deckPlan, deck, formState, connectorJournal, connectorPages);
    } else {
      scene = await Scene.create({
        name: `${deckPlan.shipName} — ${deck.deckName}`,
        folder: shipFolder?.id ?? rootFolder.id,
        width: deck.columns * formState.gridSize,
        height: deck.rows * formState.gridSize,
        padding: 0,
        tokenVision: true,
        fogExploration: false,
        grid: {
          type: resolveSceneGridType(formState.gridMode),
          size: formState.gridSize,
          distance: 1,
          units: "meter"
        },
      backgroundColor: paletteForFormState(formState).base,
        background: deck.backgroundSrc ? { src: deck.backgroundSrc } : undefined,
        thumb: deck.backgroundSrc ?? undefined
      });

      await populateSceneWithDeck(scene, deckPlan, deck, formState, connectorJournal, connectorPages);
    }

    scenes.push(scene);
  }

  if (formState.generateMissionBrief) {
    await JournalEntry.create({
      name: `${deckPlan.shipName} — Mission Brief`,
      pages: [{
        name: "Brief",
        type: "text",
        text: {
          content: buildMissionBriefContent(deckPlan, formState),
          format: 1
        }
      }]
    }).catch(() => null);
  }

  return scenes;
}

function resolveRegenerationTarget(formState, deckPlan, currentScene) {
  const mode = formState.regenerateTarget === "none" && formState.regenerateInPlace ? "viewed" : formState.regenerateTarget;
  if (mode === "viewed" && deckPlan.decks.length === 1 && currentScene) {
    return { scenes: [currentScene], folder: currentScene.folder ?? null };
  }
  if (mode === "viewed-folder" && currentScene?.folder) {
    return {
      scenes: getSortedScenesForFolder(currentScene.folder).slice(0, deckPlan.decks.length),
      folder: currentScene.folder
    };
  }
  if (mode === "folder" && formState.targetSceneFolder) {
    const folder = game.folders?.get(formState.targetSceneFolder) ?? null;
    if (folder?.type === "Scene") {
      return {
        scenes: getSortedScenesForFolder(folder).slice(0, deckPlan.decks.length),
        folder
      };
    }
  }
  return { scenes: [], folder: null };
}

function resolveSceneGridType(gridMode) {
  if (gridMode === "hex-row") return CONST.GRID_TYPES.HEXODDR;
  return CONST.GRID_TYPES.SQUARE;
}

function getSortedScenesForFolder(folder) {
  return (game.scenes?.contents ?? [])
    .filter((scene) => scene.folder?.id === folder.id)
    .sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name));
}

async function prepareDeckGenerationArtifacts(deck, formState, furnitureTables, deckPlan) {
  if (furnitureTables) {
    const furnitureSeed = hashSeed(`${formState.seed}:${deck.deckIndex}:${formState.mode}:${formState.furnitureDensity}`);
    deck.furniture = buildFurnitureForDeck(deck, formState, furnitureTables, mulberry32(furnitureSeed));
  } else {
    deck.furniture = [];
  }

  // Generate maintenance shafts (hidden crawlway network between key rooms)
  const shaftSeed = hashSeed(`${formState.seed}:${deck.deckIndex}:shafts`);
  deck.maintenanceShafts = buildMaintenanceShafts(deck, formState, mulberry32(shaftSeed));

  deck.backgroundSrc = await createDeckBackgroundAsset(deckPlan, deck, formState);
  deck.gmOverlaySrc = formState.createGmOverlay ? await createGmOverlayAsset(deckPlan, deck, formState) : null;
}

async function populateSceneWithDeck(scene, deckPlan, deck, formState, connectorJournal, connectorPages) {
  const drawings = sanitizeGeneratedDrawings([
    ...buildRoomFloorDrawings(deck, formState),
    ...buildCorridorFloorDrawings(deck, formState),
    ...buildFurnitureDrawings(deck, formState),
    ...buildHullOutlineDrawings(deck, formState)
  ]);
  if (drawings.length) {
    await scene.createEmbeddedDocuments("Drawing", drawings.map((drawing) => withGeneratedDrawingFlag(drawing)));
  }

  const gmOverlayTile = buildGmOverlayTile(deck, formState);
  if (gmOverlayTile) {
    await scene.createEmbeddedDocuments("Tile", [withGeneratedTileFlag(gmOverlayTile)]);
  }

  const walls = deck.wallSegments.map((segment) => wallSegmentToDocument(segment, formState.gridSize));
  if (walls.length) {
    await scene.createEmbeddedDocuments("Wall", walls.map((wall) => withGeneratedWallFlag(wall)));
  }

  const furnitureWalls = buildFurnitureOcclusionWalls(deck, formState);
  if (furnitureWalls.length) {
    await scene.createEmbeddedDocuments("Wall", furnitureWalls);
  }

  const notes = [
    ...buildDeckConnectorNotes(deck, formState, connectorJournal?.id, connectorPages),
    ...buildRoomZoneNotes(deck, formState)
  ];
  if (notes.length) {
    await scene.createEmbeddedDocuments("Note", notes.map((note) => withGeneratedNoteFlag(note)));
  }

  if (formState.placeLights) {
    const lights = buildAmbientLights(deck, formState);
    if (lights.length) {
      await scene.createEmbeddedDocuments("AmbientLight", lights.map((light) => withGeneratedLightFlag(light)));
    }
  }

  if (formState.seedEncounters) {
    const tokens = await buildEncounterTokens(deck, formState);
    if (tokens.length) {
      await scene.createEmbeddedDocuments("Token", tokens.map((token) => withGeneratedTokenFlag(token)));
    }
  }

  if (formState.populateRoomsFromCompendium && formState.roomPopulationPack) {
    const roomTokens = await buildRoomPopulationTokens(deck, formState);
    if (roomTokens.length) {
      await scene.createEmbeddedDocuments("Token", roomTokens.map((token) => withGeneratedTokenFlag(token)));
    }
  }

  if (formState.placeRegions) {
    try {
      const regions = buildRegionDocuments(deck, formState);
      if (regions.length) {
        await scene.createEmbeddedDocuments("Region", regions);
      }
    } catch (_err) {
      // Region documents are v13+ — silently skip on older Foundry versions
    }
  }

  // Maintenance shaft walls (hidden until GM reveals)
  const shaftWalls = buildMaintenanceShaftWalls(deck, formState);
  if (shaftWalls.length) {
    await scene.createEmbeddedDocuments("Wall", shaftWalls.map((w) => withGeneratedWallFlag(w)));
  }

  // Maintenance shaft floor drawings (hidden until GM reveals)
  const shaftDrawings = buildMaintenanceShaftDrawings(deck, formState);
  if (shaftDrawings.length) {
    await scene.createEmbeddedDocuments("Drawing", shaftDrawings.map((d) => withGeneratedDrawingFlag(d)));
  }

  applyGmOverlayVisibility(scene);
}

function buildRegionDocuments(deck, formState) {
  const gs = formState.gridSize;
  const regions = [];
  for (const room of deck.rooms) {
    const config = REGION_CONFIG[room.type];
    if (!config) continue;
    const pts = room.points
      ? room.points.flatMap((p) => [p.x * gs, p.y * gs])
      : [
          room.x * gs,                   room.y * gs,
          (room.x + room.width) * gs,    room.y * gs,
          (room.x + room.width) * gs,    (room.y + room.height) * gs,
          room.x * gs,                   (room.y + room.height) * gs
        ];
    regions.push({
      name: room.label ? `Region: ${room.label}` : `Region (${room.type})`,
      color: config.color,
      visibility: config.gmOnly ? 10 : 0,
      shapes: [{ type: "polygon", points: pts }],
      behaviors: config.behaviors ?? [],
      flags: { [MODULE_ID]: { generatedRegion: true, roomType: room.type } }
    });
  }
  return regions;
}

function buildGmOverlayTile(deck, formState) {
  if (!formState.createGmOverlay || !deck.gmOverlaySrc) return null;
  return {
    x: 0,
    y: 0,
    z: 1000,
    width: deck.columns * formState.gridSize,
    height: deck.rows * formState.gridSize,
    rotation: 0,
    hidden: true,
    locked: true,
    texture: {
      src: deck.gmOverlaySrc
    },
    flags: {
      [MODULE_ID]: {
        gmOverlay: true,
        deckIndex: deck.deckIndex,
        overlayType: "gm-room-overlay"
      }
    }
  };
}

async function regenerateSceneInPlace(scene, deckPlan, deck, formState, connectorJournal, connectorPages) {
  const furnitureTables = await getFurnitureTables().catch(() => null);
  await prepareDeckGenerationArtifacts(deck, formState, furnitureTables, deckPlan);
  await deleteGeneratedDocumentsInternal(scene);
  await scene.update({
    name: `${deckPlan.shipName} — ${deck.deckName}`,
    width: deck.columns * formState.gridSize,
    height: deck.rows * formState.gridSize,
    padding: 0,
    tokenVision: true,
    fogExploration: false,
    grid: {
      type: resolveSceneGridType(formState.gridMode),
      size: formState.gridSize,
      distance: 1,
      units: "meter"
    },
    backgroundColor: paletteForFormState(formState).base,
    background: deck.backgroundSrc ? { src: deck.backgroundSrc } : null,
    thumb: deck.backgroundSrc ?? null
  });
  await populateSceneWithDeck(scene, deckPlan, deck, formState, connectorJournal, connectorPages);
}

async function ensureConnectorJournal(deckPlan, formState) {
  if (deckPlan.decks.length < 2 || !["dungeon", "building"].includes(formState.mode)) return null;
  const pages = [];
  for (const deck of deckPlan.decks) {
    for (const connector of deck.deckConnectors ?? []) {
      pages.push({
        name: connectorNoteKey(deck, connector),
        type: "text",
        text: {
          content: `<h2>${escapeXml(connector.label)}</h2><p>${escapeXml(connector.access ?? "")}</p><p>${escapeXml(buildConnectorNoteCopy(formState.mode, deck, connector))}</p>`
        }
      });
    }
  }
  return JournalEntry.create({
    name: `${deckPlan.shipName} Level Connections`,
    pages
  }).catch(() => null);
}

function buildDeckConnectorNotes(deck, formState, entryId, connectorPages) {
  if (!entryId || !["dungeon", "building"].includes(formState.mode)) return [];
  return (deck.deckConnectors ?? []).map((connector) => ({
    entryId,
    pageId: connectorPages.get(connectorNoteKey(deck, connector)),
    x: round((connector.x + 0.5) * formState.gridSize),
    y: round((connector.y + 0.5) * formState.gridSize),
    iconSize: Math.max(36, Math.round(formState.gridSize * 0.55)),
    text: connector.label,
    hidden: true,
    texture: {
      src: "icons/svg/book.svg"
    },
    flags: {
      [MODULE_ID]: {
        gmOverlay: true,
        connectorId: connector.id,
        deckIndex: deck.deckIndex,
        regionKind: "connector",
        noteText: buildConnectorNoteCopy(formState.mode, deck, connector)
      }
    }
  })).filter((note) => note.pageId);
}

function buildRoomZoneNotes(deck, formState) {
  if (!formState.createRoomNotes) return [];
  const notes = deck.rooms.map((room) => {
    const center = roomCenter(room);
    const bounds = roomBounds(room);
    return ({
    x: round(center.x * formState.gridSize),
    y: round(center.y * formState.gridSize),
    iconSize: Math.max(24, Math.round(formState.gridSize * 0.35)),
    text: room.label || humanizeRoomType(room.type) || "Zone",
    texture: {
      src: "icons/svg/circle.svg"
    },
    hidden: true,
    flags: {
      [MODULE_ID]: {
        gmOverlay: true,
        roomId: room.id,
        roomType: room.type ?? "zone",
        roomLabel: room.label ?? "",
        deckIndex: deck.deckIndex,
        regionKind: "room",
        noteText: buildAutomaticRoomNote(deck, room),
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        },
        markers: room.markers ?? []
      }
    }
  })});

  if (deck.wilderness?.encounterZones?.length) {
    notes.push(...deck.wilderness.encounterZones.map((zone, index) => ({
      x: round(zone.x * formState.gridSize),
      y: round(zone.y * formState.gridSize),
      iconSize: Math.max(28, Math.round(formState.gridSize * 0.4)),
      text: zone.label || `Encounter Zone ${index + 1}`,
      texture: {
        src: "icons/svg/target.svg"
      },
      hidden: true,
      flags: {
        [MODULE_ID]: {
          gmOverlay: true,
          deckIndex: deck.deckIndex,
          regionKind: "encounter-zone",
          roomLabel: zone.label ?? "",
          noteText: `Encounter zone on ${deck.deckName}. Radius ${zone.radius} cells.`,
          bounds: {
            x: zone.x - zone.radius,
            y: zone.y - zone.radius,
            width: zone.radius * 2,
            height: zone.radius * 2
          },
          radius: zone.radius
        }
      }
    })));
  }

  return notes;
}

function connectorNoteKey(deck, connector) {
  return `${deck.deckIndex}:${connector.id}`;
}

function buildConnectorNoteCopy(mode, deck, connector) {
  if (mode === "dungeon") {
    return `${connector.label} links ${deck.deckName} to ${connector.access || "the adjoining level"}. Use this point for vertical movement between dungeon levels.`;
  }
  return `${connector.label} links ${deck.deckName} to ${connector.access || "the adjoining floor"}. Use this point for stairwell movement between building floors.`;
}

async function exportMothershipViewerJson(deckPlan) {
  const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  const worldId = game.world?.id;
  if (!worldId) return;
  const targetDir = `worlds/${worldId}/${ASSET_DIR}`;
  const json = JSON.stringify(buildMothershipMapViewerJSON(deckPlan), null, 2);
  const filename = `${slugify(deckPlan.shipName)}-${Date.now()}-mosh-map.json`;
  await FilePickerImpl.createDirectory("data", targetDir).catch(() => {});
  const file = new File([json], filename, { type: "application/json" });
  await FilePickerImpl.upload("data", targetDir, file, {}, { notify: false });
}

async function exportMapMetadataJson(deckPlan, formState, scenes = []) {
  const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  const worldId = game.world?.id;
  if (!worldId) return null;
  const targetDir = `worlds/${worldId}/${ASSET_DIR}`;
  const filename = `${slugify(deckPlan.shipName)}-${Date.now()}-metadata.json`;
  await FilePickerImpl.createDirectory("data", targetDir).catch(() => {});
  const payload = JSON.stringify(buildMapMetadata(deckPlan, formState, scenes), null, 2);
  const file = new File([payload], filename, { type: "application/json" });
  const response = await FilePickerImpl.upload("data", targetDir, file, {}, { notify: false });
  const path = response?.path ?? `${targetDir}/${filename}`;
  for (let index = 0; index < scenes.length; index += 1) {
    await scenes[index].update({
      [`flags.${MODULE_ID}.metadataExport`]: {
        path,
        deckIndex: index,
        mode: formState.mode,
        theme: formState.theme
      }
    }).catch(() => {});
  }
  return path;
}

async function createMissionPacket(deckPlan, formState, scenes = [], metadataPath = null) {
  const html = buildMissionPacketHtml(deckPlan, formState, scenes, metadataPath);
  const exportedPath = await exportMissionPacketHtml(deckPlan, html).catch(() => null);
  await JournalEntry.create({
    name: `${deckPlan.shipName} — Mission Packet`,
    pages: [{
      name: "Packet",
      type: "text",
      text: {
        content: html,
        format: 1
      }
    }]
  }).catch(() => null);
  if (exportedPath) {
    ui.notifications.info(`Mission packet exported to ${exportedPath}.`);
  }
  return exportedPath;
}

async function exportMissionPacketHtml(deckPlan, html) {
  const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  const worldId = game.world?.id;
  if (!worldId) return null;
  const targetDir = `worlds/${worldId}/${ASSET_DIR}`;
  const filename = `${slugify(deckPlan.shipName)}-${Date.now()}-mission-packet.html`;
  await FilePickerImpl.createDirectory("data", targetDir).catch(() => {});
  const file = new File([html], filename, { type: "text/html" });
  const response = await FilePickerImpl.upload("data", targetDir, file, {}, { notify: false });
  return response?.path ?? `${targetDir}/${filename}`;
}

function buildMissionPacketHtml(deckPlan, formState, scenes = [], metadataPath = null) {
  const brief = buildMissionBriefContent(deckPlan, formState);
  const previewCards = deckPlan.decks.map((deck, index) => {
    const scene = scenes[index];
    const sceneName = scene?.name ?? `${deckPlan.shipName} — ${deck.deckName}`;
    const imagePath = scene?.background?.src ?? deck.backgroundSrc ?? "";
    return `
      <section class="packet-card">
        <h3>${escapeXml(sceneName)}</h3>
        ${imagePath ? `<img src="${escapeXml(imagePath)}" alt="${escapeXml(sceneName)} thumbnail" />` : ""}
        <p><strong>Rooms:</strong> ${deck.rooms.length} <strong>Corridors:</strong> ${deck.corridors.length} <strong>Doors:</strong> ${countDoors(deck.wallSegments)}</p>
        <p>${escapeXml(summarizeDeckThreats(deck))}</p>
      </section>
    `;
  }).join("");
  const summaries = deckPlan.decks.map((deck) => `
    <tr>
      <td>${escapeXml(deck.deckName)}</td>
      <td>${deck.rooms.length}</td>
      <td>${deck.corridors.length}</td>
      <td>${countDoors(deck.wallSegments)}</td>
      <td>${(deck.wilderness?.encounterZones?.length ?? deck.rooms.filter((room) => ENCOUNTER_ROOM_TYPES.has(room.type)).length)}</td>
    </tr>
  `).join("");
  return `
    <style>
      body { font-family: Georgia, "Times New Roman", serif; color: #111; margin: 24px; }
      h1, h2, h3 { margin: 0 0 10px; }
      .packet-meta { margin: 12px 0 20px; font-size: 14px; }
      .packet-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; margin: 20px 0; }
      .packet-card { border: 1px solid #777; padding: 12px; break-inside: avoid; }
      .packet-card img { width: 100%; height: auto; display: block; margin-bottom: 10px; border: 1px solid #bbb; }
      table { width: 100%; border-collapse: collapse; margin-top: 14px; }
      th, td { border: 1px solid #777; padding: 6px 8px; text-align: left; }
      @media print { body { margin: 10mm; } .packet-card { page-break-inside: avoid; } }
    </style>
    <article class="mission-packet">
      ${brief}
      <div class="packet-meta">
        <strong>Metadata export:</strong> ${escapeXml(metadataPath ?? "Not exported")}<br />
        <strong>Encounter source:</strong> ${escapeXml(formState.encounterPack || resolveEncounterPreset(formState).key)}<br />
        <strong>Generated scenes:</strong> ${scenes.length}
      </div>
      <h2>Scene List & Preview</h2>
      <div class="packet-grid">${previewCards}</div>
      <h2>Metadata Summary</h2>
      <table>
        <thead><tr><th>Deck</th><th>Rooms</th><th>Corridors</th><th>Doors</th><th>Threat Nodes</th></tr></thead>
        <tbody>${summaries}</tbody>
      </table>
    </article>
  `.replace(/\n\s+/g, "");
}

function buildMapMetadata(deckPlan, formState, scenes = []) {
  return {
    module: MODULE_ID,
    version: game.modules?.get(MODULE_ID)?.version ?? "dev",
    name: deckPlan.shipName,
    seed: deckPlan.seed,
    mode: formState.mode,
    theme: formState.theme,
    missionTemplate: formState.missionTemplate,
    encounterFaction: resolveEncounterPreset(formState).key,
    encounterPack: formState.encounterPack || null,
    gridSize: formState.gridSize,
    decks: deckPlan.decks.map((deck, index) => ({
      deckIndex: deck.deckIndex,
      deckName: deck.deckName,
      sceneId: scenes[index]?.id ?? null,
      sceneName: scenes[index]?.name ?? null,
      rooms: deck.rooms.map((room) => ({
        id: room.id,
        label: room.label ?? "",
        type: room.type ?? "",
        faction: room.faction ?? "",
        factionColor: room.factionColor ?? "",
        x: room.x,
        y: room.y,
        width: room.width,
        height: room.height,
        shape: room.shape ?? "rect",
        markers: room.markers ?? []
      })),
      corridors: (deck.corridors ?? []).map((corridor) => ({
        x: corridor.x,
        y: corridor.y,
        width: corridor.width,
        height: corridor.height,
        waypoints: corridor.waypoints ?? []
      })),
      doors: (deck.wallSegments ?? []).filter((segment) => segment.door).map((segment) => ({
        x1: segment.x1,
        y1: segment.y1,
        x2: segment.x2,
        y2: segment.y2,
        state: segment.ds ?? DOOR_STATE_CLOSED,
        secret: segment.door === DOOR_SECRET
      })),
      walls: (deck.wallSegments ?? []).filter((segment) => !segment.door).map((segment) => ({
        x1: segment.x1,
        y1: segment.y1,
        x2: segment.x2,
        y2: segment.y2,
        isWindow: Boolean(segment.isWindow),
        movementOnly: Boolean(segment.movementOnly),
        terrain: segment.terrain ?? null
      })),
      wilderness: deck.wilderness ?? null
    }))
  };
}

function buildMothershipMapViewerJSON(deckPlan) {
  const gs = deckPlan.gridSize;
  return {
    name: deckPlan.shipName,
    floors: deckPlan.decks.map((deck, index) => ({
      floorNumber: index + 1,
      floorName: deck.deckName,
      rooms: deck.rooms.map((room) => ({
        id: room.id,
        type: room.shape === "circle" ? "circle" : "rect",
        x: room.x * gs,
        y: room.y * gs,
        width: room.width * gs,
        height: room.height * gs,
        label: room.label ?? "",
        markers: (room.markers ?? []).map((marker) => ({
          ...marker,
          x: Number.isFinite(marker.x) ? marker.x * gs : marker.x,
          y: Number.isFinite(marker.y) ? marker.y * gs : marker.y
        })),
        labels: room.label
          ? [{
            text: room.label,
            x: (room.x + room.width / 2) * gs,
            y: (room.y + room.height / 2) * gs,
            visible: true
          }]
          : []
      })),
      hallways: deck.corridors.map((corridor) => ({
        waypoints: (corridor.waypoints ?? []).map((wp) => ({
          x: wp.x * gs,
          y: wp.y * gs
        })),
        startType: corridor.startDoor ?? "door",
        endType: corridor.endDoor ?? "door"
      })),
      walls: deck.wallSegments.map((segment) => ({
        x1: segment.x1 * gs,
        y1: segment.y1 * gs,
        x2: segment.x2 * gs,
        y2: segment.y2 * gs,
        door: Boolean(segment.door)
      })),
      labels: deck.rooms
        .filter((room) => room.label)
        .map((room) => ({
        text: room.label,
        x: (room.x + room.width / 2) * gs,
        y: (room.y + room.height / 2) * gs
      }))
    }))
  };
}

function buildRoomFloorDrawings(deck, formState) {
  if (formState.mode === "wilderness" || deck.isCave) return [];
  const palette = paletteForFormState(formState);
  const ageOpacity = getAgeOpacity(formState);
  return deck.rooms.flatMap((room) => {
    const bounds = roomBounds(room);
    const base = {
      x: bounds.x * formState.gridSize,
      y: bounds.y * formState.gridSize,
      z: 0,
      hidden: false,
      locked: false,
      rotation: 0,
      strokeWidth: 2,
      strokeColor: room.factionColor ?? palette.roomStroke,
      strokeAlpha: 1,
      fillType: 1,
      fillColor: room.factionColor ?? palette.roomFill,
      fillAlpha: round(0.8 * ageOpacity, 3),
      textAlpha: 0,
      bezierFactor: 0,
      flags: {
        [MODULE_ID]: {
          roomId: room.id,
          roomType: room.type ?? "",
          roomLabel: room.label ?? "",
          faction: room.faction ?? "",
          factionColor: room.factionColor ?? ""
        }
      }
    };
    if (room.shape === "circle" && Number.isFinite(room.circleR)) {
      const size = room.circleR * 2 * formState.gridSize;
      return [{
        ...base,
        x: room.circleX * formState.gridSize,
        y: room.circleY * formState.gridSize,
        shape: {
          type: "e",
          width: size,
          height: size
        }
      }];
    }
    if (room.shape === "polygon" && room.points?.length >= 3) {
      return [{
        ...base,
        shape: {
          type: "p",
          width: bounds.width * formState.gridSize,
          height: bounds.height * formState.gridSize,
          points: room.points.flatMap((point) => [
            round((point.x - bounds.x) * formState.gridSize, 2),
            round((point.y - bounds.y) * formState.gridSize, 2)
          ])
        }
      }];
    }
    return [{
      ...base,
      shape: {
        type: "r",
        width: bounds.width * formState.gridSize,
        height: bounds.height * formState.gridSize
      }
    }];
  });
}

function buildCorridorFloorDrawings(deck, formState) {
  if (formState.mode === "wilderness") return [];
  const palette = paletteForFormState(formState);
  const ageOpacity = getAgeOpacity(formState);
  const drawings = [];
  for (const corridor of deck.corridors) {
    drawings.push({
      x: corridor.x * formState.gridSize,
      y: corridor.y * formState.gridSize,
      z: 0,
      hidden: false,
      locked: false,
      rotation: 0,
      strokeWidth: 0,
      strokeColor: palette.corridorFill,
      strokeAlpha: 0,
      fillType: 1,
      fillColor: palette.corridorFill,
      fillAlpha: round(0.86 * ageOpacity, 3),
      textAlpha: 0,
      bezierFactor: 0,
      shape: {
        type: "r",
        width: corridor.width * formState.gridSize,
        height: corridor.height * formState.gridSize
      }
    });
    if (corridor.width >= 2 || corridor.height >= 2) {
      const gs = formState.gridSize;
      const isHorizontal = corridor.width >= corridor.height;
      drawings.push({
        x: isHorizontal ? corridor.x * gs : round((corridor.x + corridor.width / 2 - 0.08) * gs),
        y: isHorizontal ? round((corridor.y + corridor.height / 2 - 0.08) * gs) : corridor.y * gs,
        z: 1,
        hidden: false,
        locked: false,
        rotation: 0,
        strokeWidth: 0,
        strokeColor: palette.corridorStripe ?? palette.line,
        strokeAlpha: 0,
        fillType: 1,
        fillColor: palette.corridorStripe ?? palette.line,
        fillAlpha: round(0.25 * ageOpacity, 3),
        textAlpha: 0,
        bezierFactor: 0,
        shape: {
          type: "r",
          width: isHorizontal ? corridor.width * gs : Math.max(8, Math.round(gs * 0.16)),
          height: isHorizontal ? Math.max(8, Math.round(gs * 0.16)) : corridor.height * gs
        }
      });
    }
  }
  return drawings;
}

function buildAmbientLights(deck, formState) {
  const config = THEME_LIGHT_CONFIG[formState.theme] ?? THEME_LIGHT_CONFIG.steel;
  const ageOpacity = getAgeOpacity(formState);
  const gs = formState.gridSize;
  const lights = [];

  if (config.ambient) {
    const lightDoc = {
      x: Math.round((deck.columns * gs) / 2),
      y: Math.round((deck.rows * gs) / 2),
      hidden: false,
      config: {
        dim: Math.round(deck.columns * gs * 0.75),
        bright: 0,
        color: config.color,
        alpha: round(config.alpha * Math.max(0.45, ageOpacity), 3),
        luminosity: config.luminosity ?? 0.5,
        walls: true,
        vision: false
      }
    };
    if (config.animation) {
      lightDoc.config.animation = config.animation;
    }
    lights.push(lightDoc);
  }

  for (const room of deck.rooms) {
    if (!config.roomTypes?.includes(room.type)) continue;
    const radius = Math.min(room.width, room.height) * gs;
    const roomLightDoc = {
      x: Math.round((room.x + room.width / 2) * gs),
      y: Math.round((room.y + room.height / 2) * gs),
      hidden: false,
      config: {
        dim: Math.round(radius * 1.5),
        bright: Math.round(radius * 0.5),
        color: config.accentColor ?? config.color,
        alpha: round(0.58 * Math.max(0.45, ageOpacity), 3),
        luminosity: config.roomLuminosity ?? 0.65,
        walls: true,
        vision: false
      }
    };
    if (config.roomAnimation ?? config.animation) {
      roomLightDoc.config.animation = config.roomAnimation ?? config.animation;
    }
    lights.push(roomLightDoc);
  }

  return dedupeLights(lights);
}

function buildFurnitureDrawings(deck, formState) {
  if (!deck.furniture?.length) return [];
  const palette = paletteForFormState(formState);
  const ageOpacity = getAgeOpacity(formState);
  return deck.furniture.map((piece) => {
    const isSolid = piece.occlusion === "solid";
    return {
      x: piece.x * formState.gridSize,
      y: piece.y * formState.gridSize,
      z: 10,
      hidden: false,
      locked: false,
      rotation: piece.rotation ?? 0,
      strokeWidth: isSolid ? 4 : 2,
      strokeColor: palette.furnitureStroke,
      strokeAlpha: round((isSolid ? 0.98 : 0.94) * ageOpacity, 3),
      fillType: 1,
      fillColor: palette.furnitureFill,
      fillAlpha: round((isSolid ? 0.92 : 0.78) * ageOpacity, 3),
      textAlpha: piece.label ? 1 : 0,
      text: piece.label ?? "",
      fontSize: Math.max(8, Math.round(formState.gridSize * 0.12)),
      fontFamily: "Courier New",
      bezierFactor: 0,
      shape: {
        type: piece.shape === "e" ? "e" : "r",
        width: piece.w * formState.gridSize,
        height: piece.h * formState.gridSize
      }
    };
  });
}

function buildFurnitureOcclusionWalls(deck, formState) {
  const walls = [];
  const gs = formState.gridSize;

  for (const piece of deck.furniture ?? []) {
    const occlusion = piece.occlusion ?? "none";
    if (occlusion === "none") continue;

    const isSight = occlusion === "sight" || occlusion === "solid";
    const isMove  = occlusion === "move"  || occlusion === "solid";

    const x = piece.x, y = piece.y, w = piece.w, h = piece.h;
    const perimeter = [
      { x1: x,     y1: y,     x2: x + w, y2: y     },
      { x1: x,     y1: y + h, x2: x + w, y2: y + h },
      { x1: x,     y1: y,     x2: x,     y2: y + h },
      { x1: x + w, y1: y,     x2: x + w, y2: y + h }
    ];

    for (const seg of perimeter) {
      walls.push({
        c: [
          Math.round(seg.x1 * gs), Math.round(seg.y1 * gs),
          Math.round(seg.x2 * gs), Math.round(seg.y2 * gs)
        ],
        move:  isMove  ? MOVEMENT_NORMAL : SENSE_NONE,
        sight: isSight ? SENSE_NORMAL    : SENSE_NONE,
        sound: isSight ? SENSE_NORMAL    : SENSE_NONE,
        light: isSight ? SENSE_NORMAL    : SENSE_NONE,
        dir:   CONST.WALL_DIRECTIONS?.BOTH ?? 0,
        door:  DOOR_NONE,
        flags: { [MODULE_ID]: { generatedWall: true, furnitureWall: true } }
      });
    }
  }

  return walls;
}

function buildHullOutlineDrawings(deck, formState) {
  if (formState.mode === "wilderness") return [];
  if (!["corridor", "dungeon"].includes(formState.mode) || !deck.hull) return [];
  const palette = paletteForFormState(formState);
  const ageOpacity = getAgeOpacity(formState);
  return [{
    x: deck.hull.x * formState.gridSize,
    y: deck.hull.y * formState.gridSize,
    z: -10,
    hidden: false,
    locked: false,
    rotation: 0,
    strokeWidth: 6,
    strokeColor: palette.hull,
    strokeAlpha: round(0.35 * ageOpacity, 3),
    fillType: 0,
    fillColor: palette.hull,
    fillAlpha: 0,
    textAlpha: 0,
    bezierFactor: 0,
    shape: {
      type: "r",
      width: deck.hull.width * formState.gridSize,
      height: deck.hull.height * formState.gridSize
    }
  }];
}

function buildDeckSVG(deckPlan, deck, formState) {
  const width = deck.columns * formState.gridSize;
  const height = deck.rows * formState.gridSize;
  const palette = paletteForFormState(formState);
  const defs = buildThemePattern(formState.theme, palette, formState);
  const labels = formState.coordinates === "none"
    ? ""
    : buildCoordinateSvg(deck.columns, deck.rows, formState.gridSize, width, height, palette, formState.coordinates);
  const roomFloors = formState.mode === "wilderness" ? "" : buildRoomFillSvg(deck.rooms, formState.gridSize, palette, formState);
  const corridorFloors = formState.mode === "wilderness"
    ? ""
    : buildOrganicCorridorSvg(deck.corridors, formState.gridSize, palette, formState);
  const softOutlines = formState.softRoomOutlines && formState.mode !== "wilderness"
    ? buildSoftRoomOutlinesSvg(deck.rooms, formState.gridSize, palette, formState)
    : "";
  const roomLabels = formState.showRoomLabels
    ? buildRoomLabelSvg(deck.rooms, formState.gridSize, palette)
    : "";
  const connectorLabels = buildDeckConnectorSvg(deck.deckConnectors ?? [], formState.gridSize, palette);
  const hullPath = formState.mode === "wilderness" ? "" : buildHullPathSvg(deck.hullMask ?? [], formState.gridSize, palette);
  const exteriorOpenings = formState.mode === "wilderness" ? "" : buildExteriorOpeningsSvg(deck, formState.gridSize, palette);
  // Secret doors are GM-only — moved to buildGmOverlaySVG
  const bulkheads = ["bsp", "corridor"].includes(formState.mode) ? buildBulkheadSvg(deck.wallSegments ?? [], formState.gridSize, palette) : "";
  const roomOverlays = formState.mode === "wilderness"
    ? buildWildernessOverlaySvg(deck, formState.gridSize, palette, formState)
    : ["bsp", "corridor"].includes(formState.mode)
      ? buildScifiRoomOverlaySvg(deck.rooms, formState.gridSize, palette)
      : buildDungeonRoomOverlaySvg(deck.rooms, formState.gridSize, palette, formState.theme, formState);
  const weathering = buildWeatheringOverlay(width, height, palette, formState);
  const ageOpacity = getAgeOpacity(formState);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>${defs}</defs>
    <rect width="${width}" height="${height}" fill="${palette.base}" />
    <rect width="${width}" height="${height}" fill="url(#sdpg-panel-pattern)" opacity="${round(ageOpacity, 3)}" />
    ${corridorFloors}
    ${roomFloors}
    ${softOutlines}
    ${roomOverlays}
    ${bulkheads}
    ${hullPath}
    ${exteriorOpenings}
    ${weathering}
    ${labels}
    ${roomLabels}
    ${connectorLabels}
  </svg>`.replace(/\n+/g, " ").trim();
}

function buildGmTrapMarkerSvg(rooms, gridSize) {
  return rooms.filter((r) => r.type === "trap-room" || r.isTrap).map((room) => {
    const cx = (room.x + room.width / 2) * gridSize;
    const cy = (room.y + room.height / 2) * gridSize;
    // Large warning circle: dark shadow halo + vivid orange fill + white ⚠ glyph
    const r = Math.max(14, Math.round(gridSize * 0.30));
    return `<g><circle cx="${Math.round(cx)}" cy="${Math.round(cy)}" r="${r + 4}" fill="rgba(0,0,0,0.72)" /><circle cx="${Math.round(cx)}" cy="${Math.round(cy)}" r="${r}" fill="#d94000" stroke="#ffcc00" stroke-width="2.5" /><text x="${Math.round(cx)}" y="${Math.round(cy + 1)}" text-anchor="middle" dominant-baseline="middle" font-size="${Math.round(r * 1.15)}" font-family="Courier New, monospace" font-weight="900" fill="#ffffff" stroke="rgba(0,0,0,0.4)" stroke-width="1.5" paint-order="stroke fill">&#9888;</text></g>`;
  }).join("");
}

function buildGmUnexploredTintSvg(rooms, gridSize) {
  // Raised opacity: makes unlabelled rooms clearly visible to the GM
  return rooms.filter((r) => !r.label && r.type !== "void").map((room) => {
    return `<rect x="${room.x * gridSize}" y="${room.y * gridSize}" width="${room.width * gridSize}" height="${room.height * gridSize}" fill="#2200cc" opacity="0.18"/>`;
  }).join("");
}

// Coloured border rings around tactically important rooms so the GM can spot them instantly
const GM_SPECIAL_ROOM_COLORS = {
  "reactor":       { stroke: "#ff6600", fill: "rgba(255,102,0,0.08)", label: "REACTOR" },
  "boss-chamber":  { stroke: "#dd0000", fill: "rgba(220,0,0,0.10)",   label: "BOSS" },
  "trap-room":     { stroke: "#ffcc00", fill: "rgba(255,204,0,0.08)", label: "TRAP" },
  "brig":          { stroke: "#00aaff", fill: "rgba(0,170,255,0.08)", label: "BRIG" },
  "armory":        { stroke: "#cc6600", fill: "rgba(204,102,0,0.08)", label: "ARMORY" },
  "weapon-bay":    { stroke: "#cc2200", fill: "rgba(204,34,0,0.08)",  label: "WEAPONS" },
  "airlock":       { stroke: "#00ffcc", fill: "rgba(0,255,204,0.07)", label: "AIRLOCK" },
  "bridge":        { stroke: "#66aaff", fill: "rgba(102,170,255,0.06)", label: "" },
};

function buildGmSpecialRoomBorderSvg(rooms, gridSize) {
  const sw = Math.max(3, Math.round(gridSize * 0.06));
  return rooms.flatMap((room) => {
    const cfg = GM_SPECIAL_ROOM_COLORS[room.type];
    if (!cfg) return [];
    const x = room.x * gridSize;
    const y = room.y * gridSize;
    const w = room.width * gridSize;
    const h = room.height * gridSize;
    const pad = Math.round(sw / 2);
    return [`<rect x="${x + pad}" y="${y + pad}" width="${w - sw}" height="${h - sw}" rx="4" fill="${cfg.fill}" stroke="${cfg.stroke}" stroke-width="${sw}" stroke-dasharray="${Math.round(gridSize * 0.18)} ${Math.round(gridSize * 0.09)}" />`];
  }).join("");
}

function buildGmNpcBadgeSvg(rooms, gridSize) {
  const badgeMap = { "boss-chamber": "BOSS", "guardroom": "GUARD", "barracks": "SQUAD", "brig": "DETAINEE", "padded-cell": "INMATE", "surgery": "THREAT" };
  return rooms.filter((r) => badgeMap[r.type]).map((room) => {
    const cx = (room.x + room.width - 0.5) * gridSize;
    const cy = (room.y + 0.5) * gridSize;
    const label = badgeMap[room.type];
    // Scale badge with gridSize: wide pill badge, vivid purple, bold white text
    const bw = Math.max(56, Math.round(gridSize * 0.78));
    const bh = Math.max(22, Math.round(gridSize * 0.30));
    const fs = Math.max(11, Math.round(gridSize * 0.165));
    return `<g><rect x="${Math.round(cx - bw / 2 - 3)}" y="${Math.round(cy - bh / 2 - 3)}" width="${bw + 6}" height="${bh + 6}" rx="7" fill="rgba(0,0,0,0.72)" /><rect x="${Math.round(cx - bw / 2)}" y="${Math.round(cy - bh / 2)}" width="${bw}" height="${bh}" rx="5" fill="#520066" stroke="#dd77ff" stroke-width="2" /><text x="${Math.round(cx)}" y="${Math.round(cy + 1)}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" font-family="Courier New, monospace" font-weight="900" fill="#ffffff">${label}</text></g>`;
  }).join("");
}

function buildHatchGlyphSvg(furniture, gridSize, palette) {
  return (furniture ?? []).filter((p) => p.isHatch).map((p) => {
    const cx = (p.x + p.w / 2) * gridSize;
    const cy = (p.y + p.h / 2) * gridSize;
    const r = Math.round(gridSize * 0.28);
    return `<g opacity="0.7"><rect x="${Math.round(cx - r)}" y="${Math.round(cy - r)}" width="${r * 2}" height="${r * 2}" rx="3" fill="none" stroke="${palette.detail}" stroke-width="2"/><line x1="${Math.round(cx - r)}" y1="${Math.round(cy - r)}" x2="${Math.round(cx + r)}" y2="${Math.round(cy + r)}" stroke="${palette.detail}" stroke-width="1.5" opacity="0.7"/><line x1="${Math.round(cx + r)}" y1="${Math.round(cy - r)}" x2="${Math.round(cx - r)}" y2="${Math.round(cy + r)}" stroke="${palette.detail}" stroke-width="1.5" opacity="0.7"/><circle cx="${Math.round(cx)}" cy="${Math.round(cy)}" r="${Math.round(r * 0.25)}" fill="${palette.detail}" opacity="0.8"/></g>`;
  }).join("");
}

function buildMaintenanceShaftSvg(shafts, gridSize, palette) {
  const color = palette.maintenanceFill ?? "#cc4400";
  return shafts.flatMap((shaft) => shaft.segments.map((seg) => {
    return `<rect x="${seg.x * gridSize + 2}" y="${seg.y * gridSize + 2}" width="${gridSize - 4}" height="${gridSize - 4}" rx="3" fill="${color}" opacity="0.55"/>`;
  })).join("");
}

function buildGmOverlaySVG(_deckPlan, deck, formState) {
  const width = deck.columns * formState.gridSize;
  const height = deck.rows * formState.gridSize;
  const palette = paletteForFormState(formState);
  const gs = formState.gridSize;
  const title = escapeXml(deck.deckName || "GM Overlay");
  const roomBadges = deck.rooms.map((room) => buildGmOverlayRoomBadge(room, formState, palette)).join("");
  const connectorBadges = (deck.deckConnectors ?? []).map((connector) => buildGmOverlayConnectorBadge(connector, formState, palette)).join("");
  const zoneBadges = (deck.wilderness?.encounterZones ?? []).map((zone, index) => buildGmOverlayZoneBadge(zone, index, formState, palette)).join("");
  // GM-only elements — never appear in the player SVG
  const secretDoors = formState.mode === "wilderness" ? "" : buildSecretDoorSvg(deck.wallSegments ?? [], gs, palette);
  const trapMarkers = buildGmTrapMarkerSvg(deck.rooms, gs);
  const unexploredTint = buildGmUnexploredTintSvg(deck.rooms, gs);
  const specialBorders = buildGmSpecialRoomBorderSvg(deck.rooms, gs);
  const npcBadges = buildGmNpcBadgeSvg(deck.rooms, gs);
  const hatchGlyphs = buildHatchGlyphSvg(deck.furniture ?? [], gs, palette);
  const maintShafts = buildMaintenanceShaftSvg(deck.maintenanceShafts ?? [], gs, palette);

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${unexploredTint}
    ${specialBorders}
    ${secretDoors}
    ${trapMarkers}
    ${hatchGlyphs}
    ${maintShafts}
    <g opacity="0.96">
      <rect x="14" y="14" width="${Math.max(180, Math.round(width * 0.26))}" height="40" rx="12" fill="rgba(8,14,22,0.82)" stroke="${palette.connectorStroke}" stroke-width="2" />
      <text x="30" y="40" font-size="20" font-family="Courier New, monospace" font-weight="700" fill="#f2fbff">${title}</text>
    </g>
    ${roomBadges}
    ${connectorBadges}
    ${zoneBadges}
    ${npcBadges}
  </svg>`.replace(/\n+/g, " ").trim();
}

function buildRoomFillSvg(rooms, gridSize, palette, formState) {
  const ageOpacity = getAgeOpacity(formState);
  return rooms.map((room) => {
    const fill = room.factionColor ?? palette.roomFill;
    if (room.shape === "circle" && Number.isFinite(room.circleR)) {
      const cx = (room.circleX + room.circleR) * gridSize;
      const cy = (room.circleY + room.circleR) * gridSize;
      const r = room.circleR * gridSize;
      return `<ellipse cx="${round(cx)}" cy="${round(cy)}" rx="${round(r)}" ry="${round(r)}" fill="${fill}" opacity="${round(0.68 * ageOpacity, 3)}" stroke="${palette.roomStroke}" stroke-width="2" />`;
    }
    if (room.shape === "polygon" && room.points?.length >= 3) {
      const points = room.points.map((point) => `${round(point.x * gridSize, 2)},${round(point.y * gridSize, 2)}`).join(" ");
      return `<polygon points="${points}" fill="${fill}" opacity="${round(0.68 * ageOpacity, 3)}" stroke="${palette.roomStroke}" stroke-width="2" />`;
    }
    if (room.shape === "cave" && room.cells?.length) {
      return compressCellsToRects(room.cells).map((rect) => `<rect x="${rect.x * gridSize}" y="${rect.y * gridSize}" width="${rect.width * gridSize}" height="${rect.height * gridSize}" fill="${fill}" opacity="${round(0.62 * ageOpacity, 3)}" stroke="none" />`).join("");
    }
    return `<rect x="${room.x * gridSize}" y="${room.y * gridSize}" width="${room.width * gridSize}" height="${room.height * gridSize}" fill="${fill}" opacity="${round(0.68 * ageOpacity, 3)}" stroke="${palette.roomStroke}" stroke-width="2" />`;
  }).join("");
}

function buildCorridorFillSvg(corridors, gridSize, palette, formState) {
  const ageOpacity = getAgeOpacity(formState);
  return corridors.map((corridor) => `<rect x="${corridor.x * gridSize}" y="${corridor.y * gridSize}" width="${corridor.width * gridSize}" height="${corridor.height * gridSize}" fill="${palette.corridorFill}" opacity="${round(0.72 * ageOpacity, 3)}" />`).join("");
}

function buildOrganicCorridorSvg(corridors, gridSize, palette, formState) {
  const ageOpacity = getAgeOpacity(formState);
  return corridors.map((corridor, index) => {
    const px = corridor.x * gridSize;
    const py = corridor.y * gridSize;
    const pw = corridor.width * gridSize;
    const ph = corridor.height * gridSize;
    const isHorizontal = pw >= ph;
    const bow = Math.max(4, Math.round(Math.min(pw, ph) * 0.35)) * (((index % 3) - 1) || 0);
    let path;
    if (isHorizontal) {
      const midX = px + pw / 2;
      path = `M ${px} ${py} Q ${midX} ${py + bow} ${px + pw} ${py} L ${px + pw} ${py + ph} Q ${midX} ${py + ph - bow} ${px} ${py + ph} Z`;
    } else {
      const midY = py + ph / 2;
      path = `M ${px} ${py} L ${px + pw} ${py} Q ${px + pw + bow} ${midY} ${px + pw} ${py + ph} L ${px} ${py + ph} Q ${px - bow} ${midY} ${px} ${py} Z`;
    }
    return `<path d="${path}" fill="${palette.corridorFill}" opacity="${round(0.72 * ageOpacity, 3)}" />`;
  }).join("");
}

function buildSoftRoomOutlinesSvg(rooms, gridSize, palette, formState) {
  const ageOpacity = getAgeOpacity(formState);
  return rooms.map((room) => {
    if (room.shape === "cave") return "";
    if (room.shape === "polygon" && room.points?.length >= 3) {
      const points = room.points.map((point) => `${round(point.x * gridSize, 2)},${round(point.y * gridSize, 2)}`).join(" ");
      return `<polygon points="${points}" fill="none" stroke="${palette.roomStroke}" stroke-width="1.5" opacity="${round(0.24 * ageOpacity, 3)}" stroke-linejoin="round" />`;
    }
    if (room.shape === "circle" && Number.isFinite(room.circleR)) {
      const cx = (room.circleX + room.circleR) * gridSize;
      const cy = (room.circleY + room.circleR) * gridSize;
      const r = room.circleR * gridSize;
      return `<ellipse cx="${round(cx)}" cy="${round(cy)}" rx="${round(r)}" ry="${round(r)}" fill="none" stroke="${palette.roomStroke}" stroke-width="1.5" opacity="${round(0.22 * ageOpacity, 3)}" />`;
    }
    const px = room.x * gridSize;
    const py = room.y * gridSize;
    const pw = room.width * gridSize;
    const ph = room.height * gridSize;
    const radius = Math.min(pw, ph) * 0.18;
    const path = `M ${px + radius} ${py} L ${px + pw - radius} ${py} Q ${px + pw} ${py} ${px + pw} ${py + radius} L ${px + pw} ${py + ph - radius} Q ${px + pw} ${py + ph} ${px + pw - radius} ${py + ph} L ${px + radius} ${py + ph} Q ${px} ${py + ph} ${px} ${py + ph - radius} L ${px} ${py + radius} Q ${px} ${py} ${px + radius} ${py} Z`;
    return `<path d="${path}" fill="none" stroke="${palette.roomStroke}" stroke-width="1.5" opacity="${round(0.22 * ageOpacity, 3)}" />`;
  }).join("");
}

function buildThemePattern(theme, palette, formState = {}) {
  const ageOpacity = getAgeOpacity(formState);
  if (theme === "stone") {
    return `
      <pattern id="sdpg-panel-pattern" width="200" height="120" patternUnits="userSpaceOnUse">
        <rect width="200" height="120" fill="${palette.fill}" />
        <line x1="0" y1="48" x2="200" y2="48" stroke="${palette.line}" stroke-width="3.2" opacity="${round(0.55 * ageOpacity, 3)}" />
        <line x1="0" y1="88" x2="200" y2="88" stroke="${palette.line}" stroke-width="3.2" opacity="${round(0.55 * ageOpacity, 3)}" />
        <line x1="60" y1="0" x2="60" y2="48" stroke="${palette.line}" stroke-width="2" opacity="${round(0.42 * ageOpacity, 3)}" />
        <line x1="145" y1="0" x2="145" y2="48" stroke="${palette.line}" stroke-width="2" opacity="${round(0.38 * ageOpacity, 3)}" />
        <line x1="32" y1="48" x2="32" y2="88" stroke="${palette.line}" stroke-width="2" opacity="${round(0.4 * ageOpacity, 3)}" />
        <line x1="100" y1="48" x2="100" y2="88" stroke="${palette.line}" stroke-width="2" opacity="${round(0.38 * ageOpacity, 3)}" />
        <line x1="175" y1="48" x2="175" y2="88" stroke="${palette.line}" stroke-width="2" opacity="${round(0.42 * ageOpacity, 3)}" />
        <line x1="75" y1="88" x2="75" y2="120" stroke="${palette.line}" stroke-width="2" opacity="${round(0.4 * ageOpacity, 3)}" />
        <line x1="160" y1="88" x2="160" y2="120" stroke="${palette.line}" stroke-width="2" opacity="${round(0.38 * ageOpacity, 3)}" />
        <ellipse cx="90" cy="24" rx="8" ry="5" fill="${palette.detail}" opacity="${round(0.1 * ageOpacity, 3)}" />
        <ellipse cx="160" cy="78" rx="10" ry="6" fill="${palette.detail}" opacity="${round(0.08 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "cave") {
    return `
      <pattern id="sdpg-panel-pattern" width="320" height="220" patternUnits="userSpaceOnUse">
        <rect width="320" height="220" fill="${palette.fill}" />
        <path d="M0 65 C50 48 100 70 160 60 S250 44 320 68" stroke="${palette.line}" stroke-width="5" opacity="${round(0.3 * ageOpacity, 3)}" fill="none" />
        <path d="M0 130 C60 112 120 140 180 125 S270 108 320 135" stroke="${palette.line}" stroke-width="4" opacity="${round(0.24 * ageOpacity, 3)}" fill="none" />
        <polygon points="25,220 35,190 45,220" fill="${palette.detail}" opacity="${round(0.22 * ageOpacity, 3)}" />
        <polygon points="190,220 198,195 207,220" fill="${palette.detail}" opacity="${round(0.2 * ageOpacity, 3)}" />
        <polygon points="55,0 65,28 75,0" fill="${palette.detail}" opacity="${round(0.2 * ageOpacity, 3)}" />
        <ellipse cx="160" cy="155" rx="45" ry="20" fill="${palette.water ?? "#1a3a5c"}" opacity="${round(0.22 * ageOpacity, 3)}" />
        <ellipse cx="160" cy="155" rx="45" ry="20" fill="none" stroke="${palette.detail}" stroke-width="1.5" opacity="${round(0.3 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "wood" || theme === "wood-floor") {
    return `
      <pattern id="sdpg-panel-pattern" width="140" height="140" patternUnits="userSpaceOnUse">
        <rect width="140" height="140" fill="${palette.fill}" />
        <path d="M0 28 H140 M0 56 H140 M0 84 H140 M0 112 H140" stroke="${palette.line}" stroke-width="3" opacity="0.32" />
        <path d="M20 0 V140 M70 0 V140 M118 0 V140" stroke="${palette.detail}" stroke-width="2" opacity="0.16" />
      </pattern>`;
  }
  if (theme === "crypt") {
    return `
      <pattern id="sdpg-panel-pattern" width="200" height="200" patternUnits="userSpaceOnUse">
        <rect width="200" height="200" fill="${palette.fill}" />
        <rect x="2" y="2" width="95" height="95" fill="none" stroke="${palette.line}" stroke-width="2.5" opacity="${round(0.3 * ageOpacity, 3)}" />
        <rect x="103" y="2" width="95" height="95" fill="none" stroke="${palette.line}" stroke-width="2.5" opacity="${round(0.3 * ageOpacity, 3)}" />
        <rect x="2" y="103" width="95" height="95" fill="none" stroke="${palette.line}" stroke-width="2.5" opacity="${round(0.3 * ageOpacity, 3)}" />
        <rect x="103" y="103" width="95" height="95" fill="none" stroke="${palette.line}" stroke-width="2.5" opacity="${round(0.3 * ageOpacity, 3)}" />
        <path d="M20 10 Q38 30 30 55 Q22 75 45 90" stroke="${palette.detail}" stroke-width="1" opacity="${round(0.35 * ageOpacity, 3)}" fill="none" />
        <circle cx="100" cy="100" r="7" fill="none" stroke="${palette.detail}" stroke-width="2" opacity="${round(0.28 * ageOpacity, 3)}" />
        <circle cx="100" cy="100" r="3" fill="${palette.detail}" opacity="${round(0.3 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "sewer") {
    return `
      <pattern id="sdpg-panel-pattern" width="200" height="160" patternUnits="userSpaceOnUse">
        <rect width="200" height="160" fill="${palette.fill}" />
        <rect x="0" y="68" width="200" height="24" fill="${palette.water ?? "#1a2a18"}" opacity="${round(0.35 * ageOpacity, 3)}" />
        <path d="M10 76 Q30 72 50 76 T90 76 T130 76 T170 76" stroke="${palette.detail}" stroke-width="1" opacity="${round(0.3 * ageOpacity, 3)}" fill="none" />
        <line x1="0" y1="68" x2="200" y2="68" stroke="${palette.line}" stroke-width="3" opacity="${round(0.4 * ageOpacity, 3)}" />
        <line x1="0" y1="92" x2="200" y2="92" stroke="${palette.line}" stroke-width="3" opacity="${round(0.4 * ageOpacity, 3)}" />
        <ellipse cx="30" cy="52" rx="14" ry="8" fill="${palette.detail}" opacity="${round(0.18 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "brick") {
    return `
      <pattern id="sdpg-panel-pattern" width="160" height="96" patternUnits="userSpaceOnUse">
        <rect width="160" height="96" fill="${palette.fill}" />
        <line x1="0" y1="32" x2="160" y2="32" stroke="${palette.line}" stroke-width="3" opacity="0.32" />
        <line x1="0" y1="64" x2="160" y2="64" stroke="${palette.line}" stroke-width="3" opacity="0.32" />
        <line x1="40" y1="0" x2="40" y2="32" stroke="${palette.line}" stroke-width="2" opacity="0.28" />
        <line x1="120" y1="0" x2="120" y2="32" stroke="${palette.line}" stroke-width="2" opacity="0.28" />
        <line x1="0" y1="32" x2="0" y2="64" stroke="${palette.line}" stroke-width="2" opacity="0.28" />
        <line x1="80" y1="32" x2="80" y2="64" stroke="${palette.line}" stroke-width="2" opacity="0.28" />
        <line x1="160" y1="32" x2="160" y2="64" stroke="${palette.line}" stroke-width="2" opacity="0.28" />
      </pattern>`;
  }
  if (theme === "carpet" || theme === "tile" || theme === "concrete-office") {
    return `
      <pattern id="sdpg-panel-pattern" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="${palette.fill}" />
        <path d="M0 60 H120 M60 0 V120" stroke="${palette.line}" stroke-width="2" opacity="0.2" />
        <circle cx="30" cy="30" r="3" fill="${palette.detail}" opacity="0.12" />
        <circle cx="90" cy="90" r="3" fill="${palette.detail}" opacity="0.12" />
      </pattern>`;
  }
  if (theme === "alien-organic") {
    return `
      <pattern id="sdpg-panel-pattern" width="180" height="180" patternUnits="userSpaceOnUse">
        <rect width="180" height="180" fill="${palette.fill}" />
        <path d="M0 40 C40 10 80 10 120 40 S180 70 180 110 M0 120 C50 90 90 95 140 125 S180 160 180 180" stroke="${palette.line}" stroke-width="6" opacity="${round(0.22 * ageOpacity, 3)}" fill="none" />
        <circle cx="45" cy="45" r="12" fill="none" stroke="${palette.detail}" stroke-width="2" opacity="${round(0.16 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "clean-corporate") {
    return `
      <pattern id="sdpg-panel-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
        <rect width="160" height="160" fill="${palette.fill}" />
        <path d="M0 80 H160 M80 0 V160" stroke="${palette.line}" stroke-width="3" opacity="0.18" />
        <circle cx="20" cy="20" r="3" fill="${palette.detail}" />
        <circle cx="140" cy="140" r="3" fill="${palette.detail}" />
      </pattern>`;
  }
  if (theme === "derelict-house") {
    return `
      <pattern id="sdpg-panel-pattern" width="180" height="120" patternUnits="userSpaceOnUse">
        <rect width="180" height="120" fill="${palette.fill}" />
        <rect x="0" y="0" width="18" height="120" fill="${palette.line}" opacity="${round(0.08 * ageOpacity, 3)}" />
        <rect x="72" y="0" width="18" height="120" fill="${palette.line}" opacity="${round(0.08 * ageOpacity, 3)}" />
        <polygon points="0,0 45,0 0,38" fill="${palette.detail}" opacity="${round(0.18 * ageOpacity, 3)}" />
        <polygon points="0,120 38,120 0,82" fill="${palette.detail}" opacity="${round(0.16 * ageOpacity, 3)}" />
        <ellipse cx="90" cy="60" rx="35" ry="22" fill="${palette.detail}" opacity="${round(0.14 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "asylum") {
    return `
      <pattern id="sdpg-panel-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
        <rect width="160" height="160" fill="${palette.fill}" />
        <line x1="0" y1="40" x2="160" y2="40" stroke="${palette.line}" stroke-width="2" opacity="${round(0.28 * ageOpacity, 3)}" />
        <line x1="0" y1="80" x2="160" y2="80" stroke="${palette.line}" stroke-width="2" opacity="${round(0.28 * ageOpacity, 3)}" />
        <line x1="40" y1="0" x2="40" y2="160" stroke="${palette.line}" stroke-width="2" opacity="${round(0.28 * ageOpacity, 3)}" />
        <line x1="80" y1="0" x2="80" y2="160" stroke="${palette.line}" stroke-width="2" opacity="${round(0.28 * ageOpacity, 3)}" />
        <path d="M50 5 L62 22 L58 30 L68 40" stroke="${palette.detail}" stroke-width="1" opacity="${round(0.35 * ageOpacity, 3)}" fill="none" />
        <ellipse cx="22" cy="22" rx="14" ry="9" fill="${palette.bloodStain}" opacity="${round(0.25 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "haunted-manor") {
    return `
      <pattern id="sdpg-panel-pattern" width="120" height="60" patternUnits="userSpaceOnUse">
        <rect width="120" height="60" fill="${palette.fill}" />
        <path d="M0,30 L15,0 L30,0 L15,30 Z M15,30 L30,0 L45,0 L30,30 Z M30,30 L45,0 L60,0 L45,30 Z M45,30 L60,0 L75,0 L60,30 Z M60,30 L75,0 L90,0 L75,30 Z M75,30 L90,0 L105,0 L90,30 Z M90,30 L105,0 L120,0 L105,30 Z" fill="none" stroke="${palette.line}" stroke-width="1.5" opacity="${round(0.28 * ageOpacity, 3)}" />
        <ellipse cx="55" cy="15" rx="6" ry="4" fill="${palette.detail}" opacity="${round(0.18 * ageOpacity, 3)}" />
        <ellipse cx="100" cy="45" rx="5" ry="3" fill="${palette.detail}" opacity="${round(0.15 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "bloodbath") {
    return `
      <pattern id="sdpg-panel-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
        <rect width="160" height="160" fill="${palette.fill}" />
        <path d="M0 80 H160 M80 0 V160" stroke="${palette.line}" stroke-width="2" opacity="${round(0.22 * ageOpacity, 3)}" />
        <ellipse cx="42" cy="44" rx="18" ry="11" fill="${palette.bloodStain}" opacity="${round(0.28 * ageOpacity, 3)}" />
        <ellipse cx="110" cy="90" rx="24" ry="14" fill="${palette.bloodStain}" opacity="${round(0.22 * ageOpacity, 3)}" />
        <circle cx="122" cy="54" r="4" fill="${palette.bloodStain}" opacity="${round(0.36 * ageOpacity, 3)}" />
      </pattern>`;
  }
  if (theme === "forest" || theme === "jungle") {
    return `
      <pattern id="sdpg-panel-pattern" width="180" height="180" patternUnits="userSpaceOnUse">
        <rect width="180" height="180" fill="${palette.fill}" />
        <circle cx="26" cy="30" r="18" fill="${palette.treeColor}" opacity="${round(0.22 * ageOpacity, 3)}" />
        <circle cx="92" cy="62" r="22" fill="${palette.treeColor}" opacity="${round(0.2 * ageOpacity, 3)}" />
        <circle cx="148" cy="126" r="20" fill="${palette.treeColor}" opacity="${round(0.18 * ageOpacity, 3)}" />
        <path d="M0 96 Q38 84 66 96 T132 96 T180 96" stroke="${palette.line}" stroke-width="2" opacity="${round(0.18 * ageOpacity, 3)}" fill="none" />
      </pattern>`;
  }
  if (theme === "plains" || theme === "badlands") {
    return `
      <pattern id="sdpg-panel-pattern" width="220" height="140" patternUnits="userSpaceOnUse">
        <rect width="220" height="140" fill="${palette.fill}" />
        <path d="M0 90 Q30 80 55 92 T110 88 T165 92 T220 86" stroke="${palette.line}" stroke-width="2" opacity="${round(0.22 * ageOpacity, 3)}" fill="none" />
        <path d="M18 28 l4 16 M42 24 l3 15 M76 30 l5 14 M142 26 l4 15 M186 32 l4 14" stroke="${palette.detail}" stroke-width="2" opacity="${round(0.18 * ageOpacity, 3)}" fill="none" />
      </pattern>`;
  }
  if (theme === "swamp") {
    return `
      <pattern id="sdpg-panel-pattern" width="220" height="160" patternUnits="userSpaceOnUse">
        <rect width="220" height="160" fill="${palette.fill}" />
        <ellipse cx="72" cy="88" rx="42" ry="18" fill="${palette.water}" opacity="${round(0.24 * ageOpacity, 3)}" />
        <ellipse cx="160" cy="56" rx="34" ry="14" fill="${palette.water}" opacity="${round(0.18 * ageOpacity, 3)}" />
        <path d="M0 122 Q42 108 86 118 T168 122 T220 114" stroke="${palette.line}" stroke-width="2" opacity="${round(0.18 * ageOpacity, 3)}" fill="none" />
      </pattern>`;
  }
  if (theme === "tundra") {
    return `
      <pattern id="sdpg-panel-pattern" width="220" height="160" patternUnits="userSpaceOnUse">
        <rect width="220" height="160" fill="${palette.fill}" />
        <path d="M0 54 Q28 46 52 54 T104 54 T156 54 T220 52" stroke="${palette.line}" stroke-width="2" opacity="${round(0.18 * ageOpacity, 3)}" fill="none" />
        <path d="M24 116 L42 100 L58 118 M128 132 L144 118 L160 134" stroke="${palette.detail}" stroke-width="2" opacity="${round(0.22 * ageOpacity, 3)}" fill="none" />
      </pattern>`;
  }
  if (theme === "alien-terminal") {
    // CRT phosphor-screen effect: tight horizontal scanlines + faint grid overlay
    // Pattern tile 120×60 for a natural repeating scanline rhythm
    return `
      <pattern id="sdpg-panel-pattern" width="120" height="60" patternUnits="userSpaceOnUse">
        <rect width="120" height="60" fill="${palette.fill}" />
        <line x1="0" y1="0"  x2="120" y2="0"  stroke="#001f06" stroke-width="2" opacity="0.95" />
        <line x1="0" y1="6"  x2="120" y2="6"  stroke="#00120a" stroke-width="1" opacity="0.55" />
        <line x1="0" y1="12" x2="120" y2="12" stroke="#001f06" stroke-width="2" opacity="0.95" />
        <line x1="0" y1="18" x2="120" y2="18" stroke="#00120a" stroke-width="1" opacity="0.55" />
        <line x1="0" y1="24" x2="120" y2="24" stroke="#001f06" stroke-width="2" opacity="0.95" />
        <line x1="0" y1="30" x2="120" y2="30" stroke="#00120a" stroke-width="1" opacity="0.55" />
        <line x1="0" y1="36" x2="120" y2="36" stroke="#001f06" stroke-width="2" opacity="0.95" />
        <line x1="0" y1="42" x2="120" y2="42" stroke="#00120a" stroke-width="1" opacity="0.55" />
        <line x1="0" y1="48" x2="120" y2="48" stroke="#001f06" stroke-width="2" opacity="0.95" />
        <line x1="0" y1="54" x2="120" y2="54" stroke="#00120a" stroke-width="1" opacity="0.55" />
        <path d="M60 0 V60 M0 30 H120" stroke="${palette.detail}" stroke-width="0.5" opacity="0.07" />
      </pattern>`;
  }
  return `
    <pattern id="sdpg-panel-pattern" width="160" height="160" patternUnits="userSpaceOnUse">
      <rect width="160" height="160" fill="${palette.fill}" />
      <path d="M0 52 H160 M0 108 H160 M52 0 V160 M108 0 V160" stroke="${palette.line}" stroke-width="4" opacity="${round(0.25 * ageOpacity, 3)}" />
      <circle cx="18" cy="18" r="4" fill="${palette.detail}" />
      <circle cx="142" cy="18" r="4" fill="${palette.detail}" />
      <circle cx="18" cy="142" r="4" fill="${palette.detail}" />
      <circle cx="142" cy="142" r="4" fill="${palette.detail}" />
    </pattern>`;
}

function buildCoordinateSvg(columns, rows, gridSize, width, height, palette, mode) {
  const out = [];
  const fontSize = Math.max(11, Math.round(gridSize * 0.18));
  const coordStroke = textStrokeFor(palette.coordText);
  const cellStroke = textStrokeFor(palette.coordCell);
  for (let col = 0; col < columns; col += 1) {
    const x = col * gridSize + gridSize / 2;
    const label = columnLabel(col);
    out.push(`<text x="${round(x)}" y="${round(fontSize + 4)}" text-anchor="middle" font-size="${fontSize}" font-family="Courier New, monospace" fill="${palette.coordText}" stroke="${coordStroke}" stroke-width="1.8" paint-order="stroke fill" opacity="0.98">${label}</text>`);
  }
  for (let row = 0; row < rows; row += 1) {
    const y = row * gridSize + gridSize / 2 + fontSize * 0.35;
    out.push(`<text x="${round(fontSize + 4)}" y="${round(y)}" text-anchor="middle" font-size="${fontSize}" font-family="Courier New, monospace" fill="${palette.coordText}" stroke="${coordStroke}" stroke-width="1.8" paint-order="stroke fill" opacity="0.98">${row + 1}</text>`);
  }
  if (mode === "full") {
    const cellFont = Math.max(8, Math.round(gridSize * 0.11));
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < columns; col += 1) {
        out.push(`<text x="${round(col * gridSize + 5)}" y="${round(row * gridSize + cellFont + 4)}" font-size="${cellFont}" font-family="Courier New, monospace" fill="${palette.coordCell}" stroke="${cellStroke}" stroke-width="1.2" paint-order="stroke fill" opacity="0.7">${columnLabel(col)}${row + 1}</text>`);
      }
    }
  }
  return out.join("");
}

function buildRoomLabelSvg(rooms, gridSize, palette) {
  const labelStroke = textStrokeFor(palette.label);
  return rooms.filter((room) => room.label).map((room) => {
    const center = roomCenter(room);
    const bounds = roomBounds(room);
    const x = center.x * gridSize;
    const y = center.y * gridSize;
    const roomPxW = bounds.width * gridSize;
    const fontSize = Math.max(9, Math.min(16, Math.round(Math.min(bounds.width, bounds.height) * gridSize * 0.12)));
    const approxCharW = fontSize * 0.6;
    const charsPerLine = Math.max(4, Math.floor(roomPxW / Math.max(1, approxCharW)) - 2);
    const words = room.label.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > charsPerLine && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    const lineHeight = fontSize * 1.22;
    const totalHeight = lines.length * lineHeight;
    return lines.map((line, index) => {
      const lineY = y - totalHeight / 2 + index * lineHeight + lineHeight / 2;
      return `<text x="${round(x)}" y="${round(lineY)}" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}" font-family="Courier New, monospace" font-weight="700" fill="${palette.label}" stroke="${labelStroke}" stroke-width="${Math.max(2, Math.round(fontSize * 0.14))}" paint-order="stroke fill" opacity="1">${escapeXml(line)}</text>`;
    }).join("");
  }).join("");
}

function buildGmOverlayRoomBadge(room, formState, palette) {
  const label = room.label || humanizeRoomType(room.type) || "Zone";
  const section = buildRoomSectionLine(room);
  const center = roomCenter(room);
  const bounds = roomBounds(room);
  const x = center.x * formState.gridSize;
  const y = center.y * formState.gridSize;
  const roomPxW = Math.max(120, Math.min(bounds.width * formState.gridSize - 12, 260));
  const badgeW = Math.max(120, Math.min(roomPxW, Math.max(120, label.length * 10 + 36)));
  const badgeH = section ? 44 : 30;
  const left = round(x - badgeW / 2);
  const top = round(y - badgeH / 2);
  const stroke = room.factionColor ?? palette.connectorStroke;
  const subText = section ? `<text x="${round(x)}" y="${round(top + 34)}" text-anchor="middle" font-size="11" font-family="Courier New, monospace" fill="#cfe9f6">${escapeXml(section)}</text>` : "";
  return `
    <g opacity="0.94">
      <rect x="${left}" y="${top}" width="${round(badgeW)}" height="${badgeH}" rx="10" fill="rgba(8,14,22,0.78)" stroke="${stroke}" stroke-width="2" />
      <text x="${round(x)}" y="${round(top + 19)}" text-anchor="middle" font-size="13" font-family="Courier New, monospace" font-weight="700" fill="#f4fbff">${escapeXml(label)}</text>
      ${subText}
    </g>
  `.replace(/\n+/g, " ");
}

function buildGmOverlayConnectorBadge(connector, formState, palette) {
  const cx = connector.x * formState.gridSize + formState.gridSize / 2;
  const cy = connector.y * formState.gridSize + formState.gridSize / 2;
  return `
    <g opacity="0.95">
      <circle cx="${round(cx)}" cy="${round(cy)}" r="${Math.max(12, Math.round(formState.gridSize * 0.2))}" fill="rgba(8,14,22,0.84)" stroke="${palette.connectorStroke}" stroke-width="2" />
      <text x="${round(cx)}" y="${round(cy + 4)}" text-anchor="middle" font-size="12" font-family="Courier New, monospace" font-weight="700" fill="#f4fbff">${escapeXml((connector.label || "C").charAt(0))}</text>
    </g>
  `.replace(/\n+/g, " ");
}

function buildGmOverlayZoneBadge(zone, index, formState, palette) {
  const x = zone.x * formState.gridSize;
  const y = zone.y * formState.gridSize;
  const label = zone.label || `Encounter Zone ${index + 1}`;
  return `
    <g opacity="0.94">
      <circle cx="${round(x)}" cy="${round(y)}" r="${Math.max(18, Math.round(zone.radius * formState.gridSize * 0.32))}" fill="rgba(8,14,22,0.8)" stroke="${palette.secretDoor}" stroke-width="2" />
      <text x="${round(x)}" y="${round(y + 4)}" text-anchor="middle" font-size="10" font-family="Courier New, monospace" font-weight="700" fill="#fff4ef">${escapeXml(label)}</text>
    </g>
  `.replace(/\n+/g, " ");
}

function buildRoomSectionLine(room) {
  const parts = [];
  if (room.type) parts.push(humanizeRoomType(room.type));
  if (room.factionName) parts.push(room.factionName);
  return parts.join(" • ");
}

function buildAutomaticRoomNote(deck, room) {
  const lines = [
    `Section: ${room.label || humanizeRoomType(room.type) || "Zone"}`,
    `Type: ${humanizeRoomType(room.type) || "Unassigned"}`,
    `Deck: ${deck.deckName}`
  ];
  if (room.factionName) lines.push(`Faction: ${room.factionName}`);
  if (Array.isArray(room.markers) && room.markers.length) {
    const markers = room.markers.map((marker) => marker.text || marker.label).filter(Boolean);
    if (markers.length) lines.push(`Markers: ${markers.join(", ")}`);
  }
  return lines.join("\n");
}

function humanizeRoomType(value) {
  return String(value ?? "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildDeckConnectorSvg(connectors, gridSize, palette) {
  const connectorTextStroke = textStrokeFor(palette.connectorText);
  return connectors.map((connector) => {
    const cx = connector.x * gridSize + gridSize / 2;
    const cy = connector.y * gridSize + gridSize / 2;
    const size = Math.max(12, Math.round(gridSize * 0.5));
    const labelY = cy + size * 0.95;
    const accessY = labelY + Math.max(8, Math.round(gridSize * 0.14));
    const glyph = connector.type === "ladder"
      ? "L"
      : connector.type === "stairs"
        ? "S"
        : "E";
    return `
      <g>
        <rect x="${round(cx - size / 2)}" y="${round(cy - size / 2)}" width="${size}" height="${size}" rx="8" fill="${palette.connectorFill}" stroke="${palette.connectorStroke}" stroke-width="3" opacity="0.96" />
        <text x="${round(cx)}" y="${round(cy + 1)}" text-anchor="middle" dominant-baseline="middle" font-size="${Math.max(10, Math.round(size * 0.46))}" font-family="Courier New, monospace" fill="${palette.connectorText}" stroke="${connectorTextStroke}" stroke-width="2" paint-order="stroke fill" font-weight="700">${glyph}</text>
        <text x="${round(cx)}" y="${round(labelY)}" text-anchor="middle" font-size="${Math.max(8, Math.round(gridSize * 0.15))}" font-family="Courier New, monospace" font-weight="700" fill="${palette.connectorText}" stroke="${connectorTextStroke}" stroke-width="1.8" paint-order="stroke fill" opacity="1">${escapeXml(connector.label)}</text>
        <text x="${round(cx)}" y="${round(accessY)}" text-anchor="middle" font-size="${Math.max(7, Math.round(gridSize * 0.12))}" font-family="Courier New, monospace" fill="${palette.connectorText}" stroke="${connectorTextStroke}" stroke-width="1.4" paint-order="stroke fill" opacity="0.94">${escapeXml(connector.access ?? "")}</text>
      </g>`;
  }).join("");
}

function buildHullPathSvg(hullMask, gridSize, palette) {
  return buildHullWallSegments(hullMask).map((segment) => `
    <line x1="${segment.x1 * gridSize}" y1="${segment.y1 * gridSize}" x2="${segment.x2 * gridSize}" y2="${segment.y2 * gridSize}" stroke="${palette.hull}" stroke-width="8" stroke-linecap="round" />
  `).join("");
}

function buildSecretDoorSvg(wallSegments, gridSize, palette) {
  return wallSegments
    .filter((segment) => segment.door === DOOR_SECRET)
    .map((segment) => {
      const cx = ((segment.x1 + segment.x2) / 2) * gridSize;
      const cy = ((segment.y1 + segment.y2) / 2) * gridSize;
      // Large, high-contrast S-glyph: solid dark halo + bright filled circle + bold white "S"
      const r = Math.max(12, Math.round(gridSize * 0.28));
      return `<g><circle cx="${round(cx)}" cy="${round(cy)}" r="${r + 4}" fill="rgba(0,0,0,0.72)" /><circle cx="${round(cx)}" cy="${round(cy)}" r="${r}" fill="${palette.secretDoor}" stroke="#ffffff" stroke-width="2.5" /><text x="${round(cx)}" y="${round(cy + 1)}" text-anchor="middle" dominant-baseline="middle" font-size="${round(r * 1.1)}" font-family="Courier New, monospace" font-weight="900" fill="#ffffff" stroke="rgba(0,0,0,0.5)" stroke-width="1.5" paint-order="stroke fill">S</text></g>`;
    })
    .join("");
}

function buildExteriorOpeningsSvg(deck, gridSize, palette) {
  const windows = (deck.exteriorOpenings ?? []).filter((segment) => segment.isWindow).map((segment) => {
    const x1 = segment.x1 * gridSize;
    const y1 = segment.y1 * gridSize;
    const x2 = segment.x2 * gridSize;
    const y2 = segment.y2 * gridSize;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${palette.connectorStroke}" stroke-width="${Math.max(4, Math.round(gridSize * 0.1))}" stroke-linecap="round" opacity="0.95" />`;
  });

  const doors = (deck.exteriorOpenings ?? []).filter((segment) => segment.door).map((segment) => buildExteriorDoorGlyph(segment, gridSize, palette));
  const airlocks = (deck.airlocks ?? []).map((airlock) => {
    const x = airlock.x * gridSize;
    const y = airlock.y * gridSize;
    const isVertical = airlock.edge === "V";
    const width = isVertical ? Math.max(8, Math.round(gridSize * 0.14)) : gridSize;
    const height = isVertical ? gridSize : Math.max(8, Math.round(gridSize * 0.14));
    const cx = isVertical ? x : x + gridSize / 2;
    const cy = isVertical ? y + gridSize / 2 : y;
    const box = `<rect x="${round(isVertical ? x - width / 2 : x)}" y="${round(isVertical ? y : y - height / 2)}" width="${round(width)}" height="${round(height)}" rx="3" fill="${palette.connectorFill}" stroke="${palette.connectorStroke}" stroke-width="2.5" opacity="0.95"/>`;
    const stripe1 = isVertical
      ? `<line x1="${round(cx - width / 2 + 2)}" y1="${round(y + gridSize * 0.25)}" x2="${round(cx + width / 2 - 2)}" y2="${round(y + gridSize * 0.25)}" stroke="${palette.detail}" stroke-width="2" opacity="0.6"/>`
      : `<line x1="${round(x + gridSize * 0.25)}" y1="${round(cy - height / 2 + 2)}" x2="${round(x + gridSize * 0.25)}" y2="${round(cy + height / 2 - 2)}" stroke="${palette.detail}" stroke-width="2" opacity="0.6"/>`;
    const stripe2 = isVertical
      ? `<line x1="${round(cx - width / 2 + 2)}" y1="${round(y + gridSize * 0.75)}" x2="${round(cx + width / 2 - 2)}" y2="${round(y + gridSize * 0.75)}" stroke="${palette.detail}" stroke-width="2" opacity="0.6"/>`
      : `<line x1="${round(x + gridSize * 0.75)}" y1="${round(cy - height / 2 + 2)}" x2="${round(x + gridSize * 0.75)}" y2="${round(cy + height / 2 - 2)}" stroke="${palette.detail}" stroke-width="2" opacity="0.6"/>`;
    return `${box}${stripe1}${stripe2}`;
  });

  return [...windows, ...doors, ...airlocks].join("");
}

function buildExteriorDoorGlyph(segment, gridSize, palette) {
  const x1 = segment.x1 * gridSize;
  const y1 = segment.y1 * gridSize;
  const x2 = segment.x2 * gridSize;
  const y2 = segment.y2 * gridSize;
  const doorStroke = Math.max(4, Math.round(gridSize * 0.08));
  return `<g opacity="0.95"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${palette.secretDoor}" stroke-width="${doorStroke}" stroke-linecap="round" /><circle cx="${round((x1 + x2) / 2)}" cy="${round((y1 + y2) / 2)}" r="${Math.max(3, Math.round(gridSize * 0.06))}" fill="${palette.connectorStroke}" /></g>`;
}

function buildScifiRoomOverlaySvg(rooms, gridSize, palette) {
  return rooms.map((room) => {
    const bounds = roomBounds(room);
    const center = roomCenter(room);
    const px = bounds.x * gridSize;
    const py = bounds.y * gridSize;
    const pw = bounds.width * gridSize;
    const ph = bounds.height * gridSize;
    const cx = center.x * gridSize;
    const cy = center.y * gridSize;
    switch (room.type) {
      case "reactor":
        return buildReactorOverlay(cx, cy, Math.min(pw, ph) * 0.38, palette);
      case "airlock":
      case "escape-pods":
      case "weapon-bay":
        return buildHazardStripeOverlay(px, py, pw, ph, palette);
      case "cargo":
        return buildCargoHatchOverlay(px, py, pw, ph, palette);
      case "medical":
        return buildMedicalCrossOverlay(cx, cy, Math.min(pw, ph) * 0.22, palette);
      case "bridge":
        return buildBridgeDisplayOverlay(cx, cy, pw, ph, palette);
      case "brig":
        return buildBrigBarOverlay(px, py, pw, ph, palette);
      case "observation":
        return buildViewportOverlay(cx, cy, Math.min(pw, ph) * 0.3, palette);
      default:
        return "";
    }
  }).join("");
}

function buildDungeonRoomOverlaySvg(rooms, gridSize, palette, theme, formState = {}) {
  const overlays = rooms.map((room) => {
    const bounds = roomBounds(room);
    const center = roomCenter(room);
    const px = bounds.x * gridSize;
    const py = bounds.y * gridSize;
    const pw = bounds.width * gridSize;
    const ph = bounds.height * gridSize;
    const cx = center.x * gridSize;
    const cy = center.y * gridSize;
    const r = Math.min(pw, ph) * 0.3;
    switch (room.type) {
      case "shrine":
      case "ritual-room":
        return buildRitualCircleOverlay(cx, cy, r, palette);
      case "boss-chamber":
      case "throne-room":
        return buildBossFrameOverlay(px, py, pw, ph, palette);
      case "cistern":
        return buildWaterPoolOverlay(cx, cy, r * 1.1, palette);
      case "vault":
        return buildVaultFloorOverlay(px, py, pw, ph, palette);
      case "crypt":
        return buildCryptStoneSlotsOverlay(px, py, pw, ph, gridSize, palette);
      case "torture":
        return buildTortureStainOverlay(cx, cy, r * 0.6, palette);
      case "collapsed":
      case "collapse":
        return buildRubbleOverlay(px, py, pw, ph, palette);
      case "laboratory":
      case "alchemy":
        return buildLabBenchOverlay(px, py, pw, ph, palette);
      case "living-room":
      case "entrance-hall":
      case "surgery":
      case "padded-cell":
        return ["derelict-house", "asylum", "haunted-manor", "bloodbath"].includes(theme)
          ? buildHorrorRoomOverlay(room.type, px, py, pw, ph, cx, cy, palette, formState)
          : "";
      default:
        return "";
    }
  });
  return overlays.join("");
}

function buildReactorOverlay(cx, cy, r, palette) {
  const glow = palette.detail;
  return `<g opacity="0.45"><circle cx="${cx}" cy="${cy}" r="${r * 1.6}" fill="none" stroke="${glow}" stroke-width="1" opacity="0.2"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${glow}" stroke-width="2.5" opacity="0.5"/><circle cx="${cx}" cy="${cy}" r="${r * 0.5}" fill="none" stroke="${glow}" stroke-width="2" opacity="0.6"/><circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="${glow}" opacity="0.75"/><line x1="${cx - r * 1.4}" y1="${cy}" x2="${cx + r * 1.4}" y2="${cy}" stroke="${glow}" stroke-width="1" opacity="0.25"/><line x1="${cx}" y1="${cy - r * 1.4}" x2="${cx}" y2="${cy + r * 1.4}" stroke="${glow}" stroke-width="1" opacity="0.25"/></g>`;
}

function buildHazardStripeOverlay(px, py, pw, ph, palette) {
  const sw = 12;
  const stripes = [];
  for (let x = px - ph; x < px + pw; x += sw * 2) {
    stripes.push(`<polygon points="${x},${py} ${x + sw},${py} ${x + sw + ph},${py + ph} ${x + ph},${py + ph}" fill="${palette.detail}" opacity="0.12"/>`);
  }
  return `<g>${stripes.join("")}</g>`;
}

function buildCargoHatchOverlay(px, py, pw, ph, palette) {
  const lines = [];
  const step = Math.max(12, Math.round(Math.min(pw, ph) * 0.18));
  for (let i = 1; i * step < pw; i += 1) {
    lines.push(`<line x1="${px + i * step}" y1="${py + 4}" x2="${px + i * step}" y2="${py + ph - 4}" stroke="${palette.line}" stroke-width="1" opacity="0.18"/>`);
  }
  return lines.join("");
}

function buildMedicalCrossOverlay(cx, cy, r, palette) {
  const t = r * 0.35;
  return `<g opacity="0.3"><rect x="${cx - t}" y="${cy - r}" width="${t * 2}" height="${r * 2}" rx="2" fill="${palette.detail}"/><rect x="${cx - r}" y="${cy - t}" width="${r * 2}" height="${t * 2}" rx="2" fill="${palette.detail}"/></g>`;
}

function buildBridgeDisplayOverlay(cx, cy, pw, ph, palette) {
  const r = Math.min(pw, ph) * 0.28;
  return `<g opacity="0.22"><path d="M${cx - r} ${cy} A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${palette.detail}" stroke-width="3"/><line x1="${cx}" y1="${cy - r * 0.8}" x2="${cx}" y2="${cy}" stroke="${palette.detail}" stroke-width="2"/><line x1="${cx}" y1="${cy}" x2="${cx + r * 0.6}" y2="${cy - r * 0.5}" stroke="${palette.detail}" stroke-width="1.5"/></g>`;
}

function buildBrigBarOverlay(px, py, pw, ph, palette) {
  const barCount = Math.max(3, Math.round(pw / 18));
  const barSpacing = pw / (barCount + 1);
  const bars = [];
  for (let i = 1; i <= barCount; i += 1) {
    bars.push(`<line x1="${px + i * barSpacing}" y1="${py + 6}" x2="${px + i * barSpacing}" y2="${py + ph - 6}" stroke="${palette.line}" stroke-width="3" opacity="0.3" stroke-linecap="round"/>`);
  }
  return bars.join("");
}

function buildViewportOverlay(cx, cy, r, palette) {
  return `<g opacity="0.25"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.detail}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${r * 0.7}" fill="none" stroke="${palette.detail}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${r * 0.2}" fill="${palette.detail}" opacity="0.5"/></g>`;
}

function buildRitualCircleOverlay(cx, cy, r, palette) {
  const pts = 12;
  const star = Array.from({ length: pts }, (_, index) => {
    const angle = (Math.PI / 6) * index - Math.PI / 2;
    const radius = index % 2 === 0 ? r : r * 0.45;
    return `${Math.round(cx + Math.cos(angle) * radius)},${Math.round(cy + Math.sin(angle) * radius)}`;
  }).join(" ");
  return `<g opacity="0.28"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.detail}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="${r * 0.15}" fill="${palette.detail}"/><polygon points="${star}" fill="none" stroke="${palette.detail}" stroke-width="1.5"/></g>`;
}

function buildBossFrameOverlay(px, py, pw, ph, palette) {
  const m = Math.min(pw, ph) * 0.08;
  return `<g opacity="0.22"><rect x="${px + m}" y="${py + m}" width="${pw - m * 2}" height="${ph - m * 2}" fill="none" stroke="${palette.detail}" stroke-width="2.5" stroke-dasharray="8,4"/><line x1="${px + m}" y1="${py + m}" x2="${px + m * 3}" y2="${py + m * 3}" stroke="${palette.detail}" stroke-width="2"/><line x1="${px + pw - m}" y1="${py + m}" x2="${px + pw - m * 3}" y2="${py + m * 3}" stroke="${palette.detail}" stroke-width="2"/></g>`;
}

function buildWaterPoolOverlay(cx, cy, r, palette) {
  return `<g opacity="0.5"><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.65}" fill="${palette.water ?? "#1a3a5c"}"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.65}" fill="none" stroke="${palette.detail}" stroke-width="2"/><path d="M${cx - r * 0.5} ${cy} Q${cx} ${cy - r * 0.2} ${cx + r * 0.5} ${cy}" stroke="${palette.detail}" stroke-width="1.5" fill="none" opacity="0.6"/></g>`;
}

function buildVaultFloorOverlay(px, py, pw, ph, palette) {
  const step = Math.max(14, Math.round(Math.min(pw, ph) * 0.16));
  const parts = [];
  for (let x = px + step; x < px + pw - step / 2; x += step) parts.push(`<line x1="${x}" y1="${py + 6}" x2="${x}" y2="${py + ph - 6}" stroke="${palette.detail}" stroke-width="1.5" opacity="0.2"/>`);
  for (let y = py + step; y < py + ph - step / 2; y += step) parts.push(`<line x1="${px + 6}" y1="${y}" x2="${px + pw - 6}" y2="${y}" stroke="${palette.detail}" stroke-width="1.5" opacity="0.16"/>`);
  return `<g>${parts.join("")}</g>`;
}

function buildCryptStoneSlotsOverlay(px, py, pw, ph, gridSize, palette) {
  const parts = [];
  const slotHeight = Math.max(10, Math.round(gridSize * 0.4));
  for (let y = py + slotHeight; y < py + ph - slotHeight / 2; y += slotHeight * 1.8) {
    parts.push(`<rect x="${px + 8}" y="${round(y)}" width="${Math.max(18, pw - 16)}" height="${round(slotHeight)}" rx="4" fill="none" stroke="${palette.detail}" stroke-width="1.5" opacity="0.18"/>`);
  }
  return `<g>${parts.join("")}</g>`;
}

function buildTortureStainOverlay(cx, cy, r, palette) {
  return `<g opacity="0.45"><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.7}" fill="${palette.bloodStain}"/><circle cx="${cx + r * 0.8}" cy="${cy + r * 0.2}" r="${r * 0.18}" fill="${palette.bloodStain}" opacity="0.9"/></g>`;
}

function buildRubbleOverlay(px, py, pw, ph, palette) {
  const rubble = [];
  for (let i = 0; i < 8; i += 1) {
    const x = px + ((i * 37) % Math.max(40, pw - 12));
    const y = py + ((i * 29) % Math.max(40, ph - 12));
    rubble.push(`<circle cx="${round(x + 8)}" cy="${round(y + 6)}" r="${4 + (i % 3)}" fill="${palette.detail}" opacity="0.18"/>`);
  }
  return `<g>${rubble.join("")}</g>`;
}

function buildLabBenchOverlay(px, py, pw, ph, palette) {
  const inset = Math.max(8, Math.round(Math.min(pw, ph) * 0.1));
  return `<g opacity="0.24"><rect x="${px + inset}" y="${py + inset}" width="${Math.max(18, pw - inset * 2)}" height="${Math.max(10, ph * 0.18)}" rx="4" fill="${palette.detail}"/><rect x="${px + inset}" y="${py + ph - inset - Math.max(10, ph * 0.18)}" width="${Math.max(18, pw - inset * 2)}" height="${Math.max(10, ph * 0.18)}" rx="4" fill="${palette.detail}" opacity="0.85"/></g>`;
}

function buildHorrorRoomOverlay(type, px, py, pw, ph, cx, cy, palette, formState) {
  if (type === "surgery") return `<g opacity="${round(0.26 * getAgeOpacity(formState), 3)}"><ellipse cx="${cx}" cy="${cy}" rx="${pw * 0.22}" ry="${ph * 0.12}" fill="${palette.bloodStain}"/><rect x="${cx - pw * 0.18}" y="${cy - ph * 0.05}" width="${pw * 0.36}" height="${ph * 0.1}" rx="4" fill="none" stroke="${palette.detail}" stroke-width="2"/></g>`;
  if (type === "padded-cell") return `<g opacity="${round(0.2 * getAgeOpacity(formState), 3)}"><rect x="${px + 8}" y="${py + 8}" width="${pw - 16}" height="${ph - 16}" rx="14" fill="none" stroke="${palette.detail}" stroke-width="3"/></g>`;
  return `<g opacity="${round(0.18 * getAgeOpacity(formState), 3)}"><ellipse cx="${cx}" cy="${cy}" rx="${pw * 0.22}" ry="${ph * 0.12}" fill="${palette.bloodStain}"/></g>`;
}

function buildWeatheringOverlay(width, height, palette, formState) {
  if (!formState.mapAge) return "";
  const opacity = (formState.mapAge / 100) * 0.24;
  const cracks = [];
  for (let index = 0; index < 8; index += 1) {
    const x = ((index * 113) % Math.max(80, width - 30)) + 12;
    const y = ((index * 79) % Math.max(80, height - 30)) + 12;
    cracks.push(`<path d="M${x} ${y} L${x + 12} ${y + 18} L${x + 8} ${y + 24} L${x + 18} ${y + 34}" stroke="${palette.detail}" stroke-width="1.2" opacity="${round(opacity, 3)}" fill="none"/>`);
  }
  const stains = [];
  for (let index = 0; index < 5; index += 1) {
    const x = ((index * 151) % Math.max(90, width - 60)) + 30;
    const y = ((index * 97) % Math.max(90, height - 50)) + 20;
    stains.push(`<ellipse cx="${x}" cy="${y}" rx="${18 + index * 4}" ry="${10 + index * 3}" fill="${palette.bloodStain ?? palette.detail}" opacity="${round(opacity * 0.65, 3)}"/>`);
  }
  return `<g>${cracks.join("")}${stains.join("")}</g>`;
}

function getAgeOpacity(formState = {}) {
  return 1 - ((Number(formState.mapAge) || 0) / 100) * 0.35;
}

function buildWildernessOverlaySvg(deck, gridSize, palette, formState) {
  const parts = [];
  const ageOpacity = getAgeOpacity(formState);

  for (const corridor of deck.corridors ?? []) {
    const x = corridor.x * gridSize;
    const y = corridor.y * gridSize;
    const w = corridor.width * gridSize;
    const h = corridor.height * gridSize;
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${palette.corridorFill}" opacity="${round(0.45 * ageOpacity, 3)}" rx="${Math.max(4, Math.round(gridSize * 0.12))}"/>`);
    const isHorizontal = corridor.width >= corridor.height;
    if (isHorizontal) {
      parts.push(`<line x1="${x + 6}" y1="${y + h / 2}" x2="${x + w - 6}" y2="${y + h / 2}" stroke="${palette.corridorStripe ?? palette.line}" stroke-width="${Math.max(3, Math.round(gridSize * 0.08))}" opacity="${round(0.4 * ageOpacity, 3)}" stroke-linecap="round"/>`);
    } else {
      parts.push(`<line x1="${x + w / 2}" y1="${y + 6}" x2="${x + w / 2}" y2="${y + h - 6}" stroke="${palette.corridorStripe ?? palette.line}" stroke-width="${Math.max(3, Math.round(gridSize * 0.08))}" opacity="${round(0.4 * ageOpacity, 3)}" stroke-linecap="round"/>`);
    }
  }

  for (const room of deck.rooms ?? []) {
    const px = room.x * gridSize;
    const py = room.y * gridSize;
    const pw = room.width * gridSize;
    const ph = room.height * gridSize;
    parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="${Math.max(8, Math.round(gridSize * 0.16))}" fill="${palette.roomFill}" opacity="${round(0.14 * ageOpacity, 3)}" stroke="${palette.roomStroke}" stroke-width="2" stroke-opacity="${round(0.2 * ageOpacity, 3)}"/>`);
  }

  for (const cluster of deck.wilderness?.treeClusters ?? []) {
    for (let i = 0; i < cluster.count; i += 1) {
      const angle = (Math.PI * 2 * i) / Math.max(1, cluster.count);
      const dist = cluster.radius * 0.55 * ((i % 3) + 1) / 3;
      const x = (cluster.x + Math.cos(angle) * dist) * gridSize;
      const y = (cluster.y + Math.sin(angle) * dist) * gridSize;
      const r = Math.max(6, gridSize * 0.22);
      parts.push(`<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" fill="${palette.treeColor ?? palette.detail}" opacity="${round(0.42 * ageOpacity, 3)}"/>`);
      parts.push(`<circle cx="${round(x)}" cy="${round(y)}" r="${round(r * 0.55)}" fill="${palette.treeColor ?? palette.detail}" opacity="${round(0.65 * ageOpacity, 3)}"/>`);
    }
  }

  for (const water of deck.wilderness?.waterFeatures ?? []) {
    parts.push(`<ellipse cx="${round((water.x + 0.1) * gridSize)}" cy="${round(water.y * gridSize)}" rx="${round((water.width * gridSize) / 2)}" ry="${round((water.height * gridSize) / 2)}" fill="${palette.water ?? palette.detail}" opacity="${round(0.4 * ageOpacity, 3)}"/>`);
    parts.push(`<ellipse cx="${round((water.x + 0.1) * gridSize)}" cy="${round(water.y * gridSize)}" rx="${round((water.width * gridSize) / 2)}" ry="${round((water.height * gridSize) / 2)}" fill="none" stroke="${palette.detail}" stroke-width="2" opacity="${round(0.3 * ageOpacity, 3)}"/>`);
  }

  for (const ridge of deck.wilderness?.ridgelines ?? []) {
    parts.push(`<line x1="${round(ridge.x1 * gridSize)}" y1="${round(ridge.y1 * gridSize)}" x2="${round(ridge.x2 * gridSize)}" y2="${round(ridge.y2 * gridSize)}" stroke="${palette.detail}" stroke-width="${Math.max(5, Math.round(gridSize * 0.12))}" opacity="${round(0.45 * ageOpacity, 3)}" stroke-linecap="round"/>`);
    parts.push(`<line x1="${round(ridge.x1 * gridSize)}" y1="${round(ridge.y1 * gridSize)}" x2="${round(ridge.x2 * gridSize)}" y2="${round(ridge.y2 * gridSize)}" stroke="${palette.label}" stroke-width="${Math.max(2, Math.round(gridSize * 0.05))}" opacity="${round(0.7 * ageOpacity, 3)}" stroke-dasharray="12,8" stroke-linecap="round"/>`);
  }

  for (const ravine of deck.wilderness?.ravines ?? []) {
    parts.push(`<line x1="${round(ravine.x1 * gridSize)}" y1="${round(ravine.y1 * gridSize)}" x2="${round(ravine.x2 * gridSize)}" y2="${round(ravine.y2 * gridSize)}" stroke="${palette.water ?? palette.secretDoor}" stroke-width="${Math.max(8, Math.round(gridSize * 0.16))}" opacity="${round(0.38 * ageOpacity, 3)}" stroke-linecap="round"/>`);
    parts.push(`<line x1="${round(ravine.x1 * gridSize)}" y1="${round(ravine.y1 * gridSize)}" x2="${round(ravine.x2 * gridSize)}" y2="${round(ravine.y2 * gridSize)}" stroke="${palette.detail}" stroke-width="${Math.max(2, Math.round(gridSize * 0.05))}" opacity="${round(0.55 * ageOpacity, 3)}" stroke-dasharray="7,7" stroke-linecap="round"/>`);
  }

  for (const zone of deck.wilderness?.encounterZones ?? []) {
    parts.push(`<circle cx="${round(zone.x * gridSize)}" cy="${round(zone.y * gridSize)}" r="${round(zone.radius * gridSize)}" fill="none" stroke="${palette.bloodStain ?? palette.secretDoor}" stroke-width="3" stroke-dasharray="10,7" opacity="${round(0.4 * ageOpacity, 3)}"/>`);
  }

  return parts.join("");
}

function buildFurnitureForDeck(deck, formState, furnitureTables, rng) {
  if (formState.furnitureDensity === "off") return [];
  const densityMultiplier = { sparse: 0.5, normal: 1, dense: 1.6 }[formState.furnitureDensity] ?? 1;
  const modeKey = ["bsp", "corridor"].includes(formState.mode) ? "scifi" : formState.mode;
  const tableSource = furnitureTables[modeKey] ?? {};
  const doorZonesByRoom = buildRoomDoorAvoidanceZones(deck);
  const furniture = [];

  for (const room of deck.rooms) {
    if (!room.type || room.type === "void") continue;
    const archetypes = tableSource[room.type];
    if (!archetypes?.length) continue;
    const placed = [];
    for (const archetype of archetypes) {
      const [minQty, maxQty] = archetype.qty ?? [0, 0];
      const archDensityMod = archetype.densityMod ?? 1.0;
      let qty = Math.round(randomInt(rng, minQty, maxQty) * densityMultiplier * archDensityMod);
      if (archetype.placement === "corners") qty = Math.min(qty, 4);
      for (let index = 0; index < qty; index += 1) {
        const piece = tryPlaceFurniturePiece(archetype, room, placed, doorZonesByRoom.get(room.id) ?? [], rng);
        if (!piece) continue;
        furniture.push(piece);
        placed.push({ x: piece.x, y: piece.y, width: piece.w, height: piece.h });
      }
    }
  }

  return furniture;
}

function tryPlaceFurniturePiece(archetype, room, placed, doorZones, rng) {
  const margin = 1;
  const maxAttempts = archetype.placement === "corners" ? 12 : 8;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const pos = pickFurniturePosition(archetype, room, margin, rng, placed);
    if (!pos) continue;
    const rect = { x: pos.x, y: pos.y, width: pos.w, height: pos.h };
    if (rect.x < room.x + margin || rect.y < room.y + margin) continue;
    if (rect.x + rect.width > room.x + room.width - margin) continue;
    if (rect.y + rect.height > room.y + room.height - margin) continue;
    if (placed.some((existing) => rectsOverlap(existing, rect))) continue;
    if (doorZones.some((zone) => rectsOverlap(zone, expandRect(rect, 0)))) continue;
    return { ...archetype, x: rect.x, y: rect.y, w: rect.width, h: rect.height, rotation: pos.rotation ?? 0, roomId: room.id };
  }
  return null;
}

function pickFurniturePosition(archetype, room, margin, rng, placed = []) {
  const innerX1 = room.x + margin;
  const innerY1 = room.y + margin;
  const randomRotation = archetype.w !== archetype.h && rng() > 0.5 ? 90 : 0;

  switch (archetype.placement) {
    case "wall": {
      const side = Math.floor(rng() * 4);
      const dims = side >= 2 && archetype.w !== archetype.h
        ? { w: archetype.h, h: archetype.w, rotation: 90 }
        : { w: archetype.w, h: archetype.h, rotation: 0 };
      const innerX2 = room.x + room.width - margin - dims.w;
      const innerY2 = room.y + room.height - margin - dims.h;
      if (innerX2 < innerX1 || innerY2 < innerY1) return null;
      if (side === 0) return { x: randomInt(rng, innerX1, innerX2), y: innerY1, ...dims };
      if (side === 1) return { x: randomInt(rng, innerX1, innerX2), y: room.y + room.height - margin - dims.h, ...dims };
      if (side === 2) return { x: innerX1, y: randomInt(rng, innerY1, innerY2), ...dims };
      return { x: room.x + room.width - margin - dims.w, y: randomInt(rng, innerY1, innerY2), ...dims };
    }
    case "far-wall": {
      const dims = { w: archetype.w, h: archetype.h, rotation: 0 };
      const innerX2 = room.x + room.width - margin - dims.w;
      const innerY2 = room.y + room.height - margin - dims.h;
      if (innerX2 < innerX1 || innerY2 < innerY1) return null;
      const farY = room.y + room.height - margin - dims.h;
      return {
        x: clamp(Math.floor(room.x + (room.width - dims.w) / 2), innerX1, innerX2),
        y: clamp(farY, innerY1, innerY2),
        ...dims
      };
    }
    case "center": {
      const dims = randomRotation === 90 ? { w: archetype.h, h: archetype.w, rotation: 90 } : { w: archetype.w, h: archetype.h, rotation: 0 };
      const innerX2 = room.x + room.width - margin - dims.w;
      const innerY2 = room.y + room.height - margin - dims.h;
      if (innerX2 < innerX1 || innerY2 < innerY1) return null;
      const cx = room.x + Math.floor((room.width - dims.w) / 2) + randomInt(rng, -1, 1);
      const cy = room.y + Math.floor((room.height - dims.h) / 2) + randomInt(rng, -1, 1);
      return { x: clamp(cx, innerX1, innerX2), y: clamp(cy, innerY1, innerY2), ...dims };
    }
    case "corners": {
      const dims = { w: archetype.w, h: archetype.h, rotation: 0 };
      const innerX2 = room.x + room.width - margin - dims.w;
      const innerY2 = room.y + room.height - margin - dims.h;
      if (innerX2 < innerX1 || innerY2 < innerY1) return null;
      const corners = [
        { x: innerX1, y: innerY1, ...dims },
        { x: innerX2, y: innerY1, ...dims },
        { x: innerX1, y: innerY2, ...dims },
        { x: innerX2, y: innerY2, ...dims }
      ];
      const unused = corners.filter((corner) => !placed.some((existing) => existing.x === corner.x && existing.y === corner.y));
      const pool = unused.length ? unused : corners;
      return pool[Math.floor(rng() * pool.length)];
    }
    case "scatter":
    default:
      {
        const dims = randomRotation === 90 ? { w: archetype.h, h: archetype.w, rotation: 90 } : { w: archetype.w, h: archetype.h, rotation: 0 };
        const innerX2 = room.x + room.width - margin - dims.w;
        const innerY2 = room.y + room.height - margin - dims.h;
        if (innerX2 < innerX1 || innerY2 < innerY1) return null;
        return { x: randomInt(rng, innerX1, innerX2), y: randomInt(rng, innerY1, innerY2), ...dims };
      }
  }
}

function buildRoomDoorAvoidanceZones(deck) {
  const out = new Map();
  for (const room of deck.rooms) out.set(room.id, []);
  for (const segment of deck.wallSegments ?? []) {
    if (!segment.door) continue;
    for (const room of deck.rooms) {
      const zone = buildDoorAvoidanceZone(room, segment);
      if (zone) out.get(room.id)?.push(zone);
    }
  }
  return out;
}

function buildDoorAvoidanceZone(room, segment) {
  if (!segmentTouchesRoom(segment, room)) return null;
  if (segment.x1 === segment.x2) {
    const doorY = Math.min(segment.y1, segment.y2);
    if (segment.x1 === room.x) return clampRectToRoom(room, { x: room.x, y: doorY - 1, width: 2, height: 3 });
    if (segment.x1 === room.x + room.width) return clampRectToRoom(room, { x: room.x + room.width - 2, y: doorY - 1, width: 2, height: 3 });
  } else {
    const doorX = Math.min(segment.x1, segment.x2);
    if (segment.y1 === room.y) return clampRectToRoom(room, { x: doorX - 1, y: room.y, width: 3, height: 2 });
    if (segment.y1 === room.y + room.height) return clampRectToRoom(room, { x: doorX - 1, y: room.y + room.height - 2, width: 3, height: 2 });
  }
  return null;
}

function clampRectToRoom(room, rect) {
  const x1 = Math.max(room.x, rect.x);
  const y1 = Math.max(room.y, rect.y);
  const x2 = Math.min(room.x + room.width, rect.x + rect.width);
  const y2 = Math.min(room.y + room.height, rect.y + rect.height);
  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

async function createDeckBackgroundAsset(deckPlan, deck, formState) {
  return createSvgAsset(`${slugify(deckPlan.shipName)}-deck-${deck.deckIndex + 1}`, buildDeckSVG(deckPlan, deck, formState));
}

async function createGmOverlayAsset(deckPlan, deck, formState) {
  return createSvgAsset(`${slugify(deckPlan.shipName)}-deck-${deck.deckIndex + 1}-gm-overlay`, buildGmOverlaySVG(deckPlan, deck, formState));
}

async function createSvgAsset(baseName, svg) {
  const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
  const worldId = game.world?.id;
  if (!worldId) return null;

  const targetDir = `worlds/${worldId}/${ASSET_DIR}`;
  const filename = `${slugify(baseName)}-${Date.now()}.svg`;
  await FilePickerImpl.createDirectory("data", targetDir).catch(() => {});
  const file = new File([svg], filename, { type: "image/svg+xml" });
  const response = await FilePickerImpl.upload("data", targetDir, file, {}, { notify: false });
  return response?.path ?? `${targetDir}/${filename}`;
}

function wallSegmentToDocument(segment, gridSize) {
  const isWindow = Boolean(segment.isWindow);
  const movementOnly = Boolean(segment.movementOnly);
  const doorValue = segment.door === DOOR_SECRET
    ? DOOR_SECRET
    : (segment.door ? DOOR_BASIC : DOOR_NONE);
  const wall = {
    c: [
      round(segment.x1 * gridSize),
      round(segment.y1 * gridSize),
      round(segment.x2 * gridSize),
      round(segment.y2 * gridSize)
    ],
    move: segment.move ?? MOVEMENT_NORMAL,
    sight: movementOnly || isWindow ? SENSE_NONE : SENSE_NORMAL,
    sound: movementOnly ? SENSE_NONE : SENSE_NORMAL,
    light: movementOnly || isWindow ? SENSE_NONE : SENSE_NORMAL,
    dir: CONST.WALL_DIRECTIONS.BOTH,
    door: doorValue,
    ds: segment.ds ?? DOOR_STATE_CLOSED
  };
  return wall;
}

function withGeneratedWallFlag(wall) {
  return {
    ...wall,
    flags: {
      ...(wall.flags ?? {}),
      [MODULE_ID]: {
        ...(wall.flags?.[MODULE_ID] ?? {}),
        generatedWall: true
      }
    }
  };
}

function withGeneratedDrawingFlag(drawing) {
  return {
    ...drawing,
    flags: {
      ...(drawing.flags ?? {}),
      [MODULE_ID]: {
        ...(drawing.flags?.[MODULE_ID] ?? {}),
        generatedDrawing: true
      }
    }
  };
}

function withGeneratedTileFlag(tile) {
  return {
    ...tile,
    flags: {
      ...(tile.flags ?? {}),
      [MODULE_ID]: {
        ...(tile.flags?.[MODULE_ID] ?? {}),
        generatedTile: true
      }
    }
  };
}

function sanitizeGeneratedDrawings(drawings = []) {
  return drawings.filter((drawing) => {
    const polygonPoints = Array.isArray(drawing?.shape?.points) ? drawing.shape.points : [];
    const width = Number(drawing?.shape?.width ?? 0);
    const height = Number(drawing?.shape?.height ?? 0);
    const hasPolygon = drawing?.shape?.type === "p" && polygonPoints.length >= 6;
    if (!hasPolygon && (!(width > 0) || !(height > 0))) return false;

    const textVisible = Number(drawing?.textAlpha ?? 0) > 0 && String(drawing?.text ?? "").trim().length > 0;
    const fillVisible = Number(drawing?.fillAlpha ?? 0) > 0 && Number(drawing?.fillType ?? 0) !== 0;
    const strokeVisible = Number(drawing?.strokeAlpha ?? 0) > 0 && Number(drawing?.strokeWidth ?? 0) > 0;

    return textVisible || fillVisible || strokeVisible;
  });
}

function withGeneratedLightFlag(light) {
  return {
    ...light,
    flags: {
      ...(light.flags ?? {}),
      [MODULE_ID]: {
        ...(light.flags?.[MODULE_ID] ?? {}),
        generatedLight: true
      }
    }
  };
}

function withGeneratedTokenFlag(token) {
  return {
    ...token,
    flags: {
      ...(token.flags ?? {}),
      [MODULE_ID]: {
        ...(token.flags?.[MODULE_ID] ?? {}),
        generatedToken: true
      }
    }
  };
}

function withGeneratedNoteFlag(note) {
  return {
    ...note,
    flags: {
      ...(note.flags ?? {}),
      [MODULE_ID]: {
        ...(note.flags?.[MODULE_ID] ?? {}),
        generatedNote: true
      }
    }
  };
}

async function buildEncounterTokens(deck, formState) {
  const preset = resolveEncounterPreset(formState);
  const packActors = await getEncounterPackActors(formState.encounterPack);
  const targets = formState.mode === "wilderness"
    ? (deck.wilderness?.encounterZones ?? []).map((zone) => ({
        type: "encounter-zone",
        label: zone.label,
        x: zone.x,
        y: zone.y,
        width: 2,
        height: 2
      }))
    : deck.rooms.filter((room) => ENCOUNTER_ROOM_TYPES.has(room.type));
  const densityBase = { light: 1, standard: 2, heavy: 3 }[formState.encounterDensity] ?? 2;
  const tokens = [];
  let counter = 0;
  for (const room of targets) {
    const count = determineEncounterCount(room, densityBase);
    const center = roomCenter(room);
    for (let index = 0; index < count; index += 1) {
      const offset = encounterOffset(index, count);
      const actor = packActors.length ? packActors[counter % packActors.length] : null;
      tokens.push({
        x: Math.round((center.x - 0.5 + offset.x) * formState.gridSize),
        y: Math.round((center.y - 0.5 + offset.y) * formState.gridSize),
        width: 1,
        height: 1,
        hidden: true,
        name: actor?.name || buildEncounterName(preset, room, counter),
        texture: {
          src: actor?.texture || preset.icon
        },
        flags: actor
          ? {
              [MODULE_ID]: {
                encounterPack: formState.encounterPack,
                sourceActorUuid: actor.uuid,
                sourceActorId: actor.id
              }
            }
          : undefined
      });
      counter += 1;
    }
  }
  return tokens;
}

async function getEncounterPackActors(packId) {
  const key = String(packId ?? "").trim();
  if (!key) return [];
  if (encounterPackCache.has(key)) return encounterPackCache.get(key);
  const pack = game.packs?.get(key);
  if (!pack || pack.documentName !== "Actor") {
    encounterPackCache.set(key, []);
    return [];
  }
  const docs = await pack.getDocuments().catch(() => []);
  const actors = docs
    .filter((doc) => doc)
    .map((doc) => ({
      id: doc.id,
      uuid: doc.uuid,
      name: doc.name,
      texture: doc.prototypeToken?.texture?.src || doc.img || "icons/svg/mystery-man.svg"
    }));
  encounterPackCache.set(key, actors);
  return actors;
}

async function buildRoomPopulationTokens(deck, formState) {
  const actors = await getEncounterPackActors(formState.roomPopulationPack);
  if (!actors.length) return [];
  const tokens = [];
  for (const room of deck.rooms) {
    const actor = matchActorToRoom(actors, room);
    if (!actor) continue;
    const center = roomCenter(room);
    tokens.push({
      x: Math.round((center.x - 0.5) * formState.gridSize),
      y: Math.round((center.y - 0.5) * formState.gridSize),
      width: 1,
      height: 1,
      hidden: false,
      name: actor.name,
      texture: {
        src: actor.texture
      },
      flags: {
        [MODULE_ID]: {
          roomPopulation: true,
          roomId: room.id,
          sourceActorUuid: actor.uuid,
          sourceActorId: actor.id,
          sourceRoomType: room.type ?? "",
          sourceRoomLabel: room.label ?? ""
        }
      }
    });
  }
  return tokens;
}

function matchActorToRoom(actors, room) {
  const tokens = roomMatchTokens(room);
  return actors.find((actor) => {
    const name = normalizeMatchText(actor.name);
    return tokens.some((token) => name.includes(token));
  }) ?? null;
}

function roomMatchTokens(room) {
  const values = [room.type, room.label, ...(room.markers ?? []).map((marker) => marker.text || marker.label)].filter(Boolean);
  const set = new Set();
  for (const value of values) {
    const normalized = normalizeMatchText(value);
    if (!normalized) continue;
    set.add(normalized);
    normalized.split(/\s+/).filter((part) => part.length > 2).forEach((part) => set.add(part));
  }
  return Array.from(set);
}

function normalizeMatchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveEncounterPreset(formState) {
  const auto = (() => {
    if (formState.encounterFaction !== "auto") return formState.encounterFaction;
    if (["sla-mothership", "sla-industries-brp"].includes(game.system?.id ?? "")) return "sla";
    if (formState.mode === "wilderness") return "wildlife";
    if (formState.mode === "dungeon") return formState.theme === "crypt" ? "undead" : "cult";
    if (["derelict-house", "asylum", "haunted-manor", "bloodbath"].includes(formState.theme)) return "cult";
    return "marines";
  })();

  const presets = {
    corporate: { key: "corporate", icon: "icons/svg/shield.svg", names: ["Guard", "Security", "Response Team"] },
    marines: { key: "marines", icon: "icons/svg/sword.svg", names: ["Trooper", "Marine", "Assault Team"] },
    cult: { key: "cult", icon: "icons/svg/eye.svg", names: ["Cultist", "Fanatic", "Acolyte"] },
    undead: { key: "undead", icon: "icons/svg/skull.svg", names: ["Undead", "Wight", "Ghoul"] },
    wildlife: { key: "wildlife", icon: "icons/svg/pawprint.svg", names: ["Beast", "Predator", "Lurker"] },
    sla: { key: "sla", icon: "icons/svg/target.svg", names: ["Operative", "Contractor", "Sector Team"] }
  };
  return presets[auto] ?? presets.marines;
}

function determineEncounterCount(room, densityBase) {
  const bonus = ["boss-chamber", "barracks", "camp", "encounter-zone"].includes(room.type) ? 1 : 0;
  return Math.max(1, densityBase + bonus - (["vault", "basement"].includes(room.type) ? 1 : 0));
}

function encounterOffset(index, count) {
  if (count <= 1) return { x: 0, y: 0 };
  const positions = [
    { x: -0.35, y: -0.2 },
    { x: 0.35, y: -0.2 },
    { x: -0.25, y: 0.28 },
    { x: 0.25, y: 0.28 }
  ];
  return positions[index % positions.length];
}

function buildEncounterName(preset, room, counter) {
  const base = preset.names[counter % preset.names.length];
  const suffix = ENCOUNTER_ROOM_LABELS[room.type] ?? room.label ?? "Hostile";
  return `${base} (${suffix})`;
}

function splitRectExactCount(root, targetCount, splitBias, minRoomSize, rng) {
  const rooms = [{ ...root }];
  while (rooms.length < targetCount) {
    const candidates = rooms
      .map((room, index) => ({ room, index }))
      .filter(({ room }) => room.width >= minRoomSize * 2 || room.height >= minRoomSize * 2)
      .sort((a, b) => (b.room.width * b.room.height) - (a.room.width * a.room.height));
    const candidate = candidates[0];
    if (!candidate) break;
    const room = rooms.splice(candidate.index, 1)[0];
    const splitVertical = chooseSplitOrientation(room, splitBias, rng);
    if (splitVertical && room.width >= minRoomSize * 2) {
      const split = randomInt(rng, minRoomSize, room.width - minRoomSize);
      rooms.push(
        { x: room.x, y: room.y, width: split, height: room.height },
        { x: room.x + split, y: room.y, width: room.width - split, height: room.height }
      );
      continue;
    }
    if (room.height >= minRoomSize * 2) {
      const split = randomInt(rng, minRoomSize, room.height - minRoomSize);
      rooms.push(
        { x: room.x, y: room.y, width: room.width, height: split },
        { x: room.x, y: room.y + split, width: room.width, height: room.height - split }
      );
      continue;
    }
    rooms.push(room);
    break;
  }
  return rooms.slice(0, targetCount);
}

function buildSpineWalls(spineRect, rooms) {
  const northEdge = spineRect.y;
  const southEdge = spineRect.y + spineRect.height;
  const northRooms = rooms.filter((room) => room.y + room.height === northEdge);
  const southRooms = rooms.filter((room) => room.y === southEdge);
  const segments = [];

  segments.push(...edgeWithGaps(
    { x1: spineRect.x, y1: northEdge, x2: spineRect.x + spineRect.width, y2: northEdge },
    northRooms.map((room) => ({ x1: room.x + 1, y1: northEdge, x2: room.x + Math.max(1, room.width - 1), y2: northEdge }))
  ).map((segment) => segment.gap
    ? { ...segment, door: true, ds: DOOR_STATE_CLOSED }
    : { ...segment }));

  segments.push(...edgeWithGaps(
    { x1: spineRect.x, y1: southEdge, x2: spineRect.x + spineRect.width, y2: southEdge },
    southRooms.map((room) => ({ x1: room.x + 1, y1: southEdge, x2: room.x + Math.max(1, room.width - 1), y2: southEdge }))
  ).map((segment) => segment.gap
    ? { ...segment, door: true, ds: DOOR_STATE_CLOSED }
    : { ...segment }));

  return segments;
}

function buildHallwayWalls(hallRect, rooms) {
  const segments = [];
  const isHorizontal = hallRect.width >= hallRect.height;
  if (isHorizontal) {
    const northEdge = hallRect.y;
    const southEdge = hallRect.y + hallRect.height;
    const northRooms = rooms.filter((room) => room.y + room.height === northEdge);
    const southRooms = rooms.filter((room) => room.y === southEdge);
    segments.push(...edgeWithGaps(
      { x1: hallRect.x, y1: northEdge, x2: hallRect.x + hallRect.width, y2: northEdge },
      northRooms.map((room) => ({ x1: room.x + 1, y1: northEdge, x2: room.x + Math.max(1, room.width - 1), y2: northEdge }))
    ).map((segment) => segment.gap
      ? { ...segment, door: true, ds: DOOR_STATE_CLOSED }
      : { ...segment }));
    segments.push(...edgeWithGaps(
      { x1: hallRect.x, y1: southEdge, x2: hallRect.x + hallRect.width, y2: southEdge },
      southRooms.map((room) => ({ x1: room.x + 1, y1: southEdge, x2: room.x + Math.max(1, room.width - 1), y2: southEdge }))
    ).map((segment) => segment.gap
      ? { ...segment, door: true, ds: DOOR_STATE_CLOSED }
      : { ...segment }));
  } else {
    const westEdge = hallRect.x;
    const eastEdge = hallRect.x + hallRect.width;
    const westRooms = rooms.filter((room) => room.x + room.width === westEdge);
    const eastRooms = rooms.filter((room) => room.x === eastEdge);
    segments.push(...edgeWithGaps(
      { x1: westEdge, y1: hallRect.y, x2: westEdge, y2: hallRect.y + hallRect.height },
      westRooms.map((room) => ({ x1: westEdge, y1: room.y + 1, x2: westEdge, y2: room.y + Math.max(1, room.height - 1) }))
    ).map((segment) => segment.gap
      ? { ...segment, door: true, ds: DOOR_STATE_CLOSED }
      : { ...segment }));
    segments.push(...edgeWithGaps(
      { x1: eastEdge, y1: hallRect.y, x2: eastEdge, y2: hallRect.y + hallRect.height },
      eastRooms.map((room) => ({ x1: eastEdge, y1: room.y + 1, x2: eastEdge, y2: room.y + Math.max(1, room.height - 1) }))
    ).map((segment) => segment.gap
      ? { ...segment, door: true, ds: DOOR_STATE_CLOSED }
      : { ...segment }));
  }
  return segments;
}

function edgeWithGaps(edge, gaps) {
  if (edge.y1 === edge.y2) {
    return splitLinearEdge(edge.x1, edge.x2, edge.y1, gaps.map((gap) => [gap.x1, gap.x2]), "h");
  }
  return splitLinearEdge(edge.y1, edge.y2, edge.x1, gaps.map((gap) => [gap.y1, gap.y2]), "v");
}

function splitLinearEdge(start, end, fixed, gaps, orientation) {
  const normalized = gaps
    .map(([a, b]) => [Math.max(start, Math.min(a, b)), Math.min(end, Math.max(a, b))])
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
  const segments = [];
  let cursor = start;
  for (const [gapStart, gapEnd] of normalized) {
    if (gapStart > cursor) {
      segments.push(orientation === "h"
        ? { x1: cursor, y1: fixed, x2: gapStart, y2: fixed }
        : { x1: fixed, y1: cursor, x2: fixed, y2: gapStart });
    }
    segments.push(orientation === "h"
      ? { x1: gapStart, y1: fixed, x2: gapEnd, y2: fixed, gap: true }
      : { x1: fixed, y1: gapStart, x2: fixed, y2: gapEnd, gap: true });
    cursor = gapEnd;
  }
  if (cursor < end) {
    segments.push(orientation === "h"
      ? { x1: cursor, y1: fixed, x2: end, y2: fixed }
      : { x1: fixed, y1: cursor, x2: fixed, y2: end });
  }
  return segments;
}

function chooseSplitOrientation(room, splitBias, rng) {
  if (splitBias === "horizontal") return false;
  if (splitBias === "vertical") return true;
  if (room.width === room.height) return rng() > 0.5;
  return room.width > room.height;
}

function buildPartitionSegments(rooms, rng) {
  const segments = [];
  const seen = new Set();
  for (let i = 0; i < rooms.length; i += 1) {
    for (let j = i + 1; j < rooms.length; j += 1) {
      const shared = sharedWall(rooms[i], rooms[j]);
      if (!shared) continue;
      const key = shared.orientation === "v"
        ? `v:${shared.x}:${shared.y1}:${shared.y2}`
        : `h:${shared.y}:${shared.x1}:${shared.x2}`;
      if (seen.has(key)) continue;
      seen.add(key);
      segments.push(...splitSharedWall(shared, rng));
    }
  }
  return segments;
}

function dedupeLights(lights) {
  const seen = new Set();
  return lights.filter((light) => {
    const key = `${light.x},${light.y},${light.config?.dim ?? 0},${light.config?.bright ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sharedWall(a, b) {
  if (a.x + a.width === b.x || b.x + b.width === a.x) {
    const x = a.x + a.width === b.x ? b.x : a.x;
    const y1 = Math.max(a.y, b.y);
    const y2 = Math.min(a.y + a.height, b.y + b.height);
    if (y2 - y1 >= 2) return { orientation: "v", x, y1, y2 };
  }
  if (a.y + a.height === b.y || b.y + b.height === a.y) {
    const y = a.y + a.height === b.y ? b.y : a.y;
    const x1 = Math.max(a.x, b.x);
    const x2 = Math.min(a.x + a.width, b.x + b.width);
    if (x2 - x1 >= 2) return { orientation: "h", y, x1, x2 };
  }
  return null;
}

function splitSharedWall(shared, rng) {
  if (shared.orientation === "v") {
    const doorY = randomInt(rng, shared.y1, shared.y2 - 1);
    const out = [];
    if (doorY > shared.y1) out.push({ x1: shared.x, y1: shared.y1, x2: shared.x, y2: doorY });
    out.push({ x1: shared.x, y1: doorY, x2: shared.x, y2: doorY + 1, door: true, ds: 0 });
    if (shared.y2 > doorY + 1) out.push({ x1: shared.x, y1: doorY + 1, x2: shared.x, y2: shared.y2 });
    return out;
  }
  const doorX = randomInt(rng, shared.x1, shared.x2 - 1);
  const out = [];
  if (doorX > shared.x1) out.push({ x1: shared.x1, y1: shared.y, x2: doorX, y2: shared.y });
  out.push({ x1: doorX, y1: shared.y, x2: doorX + 1, y2: shared.y, door: true, ds: 0 });
  if (shared.x2 > doorX + 1) out.push({ x1: doorX + 1, y1: shared.y, x2: shared.x2, y2: shared.y });
  return out;
}

function buildHullDoors(hull, rng) {
  const options = [
    { x1: hull.x + Math.floor(hull.width / 2), y1: hull.y, x2: hull.x + Math.floor(hull.width / 2) + 1, y2: hull.y },
    { x1: hull.x + Math.floor(hull.width / 2), y1: hull.y + hull.height, x2: hull.x + Math.floor(hull.width / 2) + 1, y2: hull.y + hull.height },
    { x1: hull.x, y1: hull.y + Math.floor(hull.height / 2), x2: hull.x, y2: hull.y + Math.floor(hull.height / 2) + 1 },
    { x1: hull.x + hull.width, y1: hull.y + Math.floor(hull.height / 2), x2: hull.x + hull.width, y2: hull.y + Math.floor(hull.height / 2) + 1 }
  ];
  return [options[randomInt(rng, 0, options.length - 1)]];
}

function buildHullDoorsFromMask(hullMask, rng) {
  const segments = buildHullWallSegments(hullMask).filter((segment) => {
    const length = Math.abs(segment.x2 - segment.x1) + Math.abs(segment.y2 - segment.y1);
    return length >= 1;
  });
  if (!segments.length) return [];
  const picks = [];
  const desiredCount = segments.length > 40 ? 2 : 1;
  const used = new Set();
  while (picks.length < desiredCount && used.size < segments.length) {
    const segment = segments[randomInt(rng, 0, segments.length - 1)];
    const key = `${segment.x1},${segment.y1},${segment.x2},${segment.y2}`;
    if (used.has(key)) continue;
    used.add(key);
    if (segment.x1 === segment.x2) {
      const y = Math.min(segment.y1, segment.y2);
      picks.push({ x1: segment.x1, y1: y, x2: segment.x2, y2: y + 1 });
    } else {
      const x = Math.min(segment.x1, segment.x2);
      picks.push({ x1: x, y1: segment.y1, x2: x + 1, y2: segment.y2 });
    }
  }
  return picks.length ? picks : buildHullDoors(boundingRectFromRegions([{ x: 1, y: 1, width: hullMask[0]?.length ?? 10, height: hullMask.length }]), rng);
}

function rectangleSegments(x, y, width, height, door = false) {
  return [
    { x1: x, y1: y, x2: x + width, y2: y, door },
    { x1: x + width, y1: y, x2: x + width, y2: y + height, door },
    { x1: x + width, y1: y + height, x2: x, y2: y + height, door },
    { x1: x, y1: y + height, x2: x, y2: y, door }
  ];
}

function buildOccupancyWalls(occupancy, roomType, roomIdGrid, options = {}) {
  const edges = [];
  const thresholds = [];
  const roomDoorTypes = options.roomDoorTypes ?? {};
  const height = occupancy.length;
  const width = occupancy[0]?.length ?? 0;
  const dirs = [
    { dx: 0, dy: -1, key: "n" },
    { dx: 1, dy: 0, key: "e" },
    { dx: 0, dy: 1, key: "s" },
    { dx: -1, dy: 0, key: "w" }
  ];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!occupancy[y]?.[x]) continue;
      for (const dir of dirs) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || !occupancy[ny]?.[nx]) {
          edges.push(cellEdge(x, y, dir.key));
          continue;
        }
        if (roomType[y]?.[x] === "room" && roomType[ny]?.[nx] === "corridor") {
          thresholds.push({
            ...cellEdge(x, y, dir.key),
            roomId: roomIdGrid[y]?.[x] || ""
          });
        }
      }
    }
  }

  const uniqueEdges = dedupeSegments(edges);
  const thresholdEdges = dedupeSegments(thresholds, true);
  const doorEdges = chooseCorridorDoorEdges(thresholdEdges);
  const doorKeys = new Set(doorEdges.map((edge) => segmentKey(edge)));
  const thresholdWalls = thresholdEdges
    .filter((edge) => !doorKeys.has(segmentKey(edge)))
    .map(({ roomId, ...edge }) => edge);
  const wallSegments = [...uniqueEdges.map((edge) => ({ ...edge })), ...thresholdWalls];
  for (const edge of doorEdges) {
    const { roomId, ...doorEdge } = edge;
    const doorType = roomDoorTypes[roomId] ?? "normal";
    if (doorType === "none") {
      wallSegments.push(doorEdge);
      continue;
    }
    const ds = doorType === "locked" ? DOOR_STATE_LOCKED : DOOR_STATE_OPEN;
    wallSegments.push({ ...doorEdge, door: true, ds });
  }
  return dedupeSegments(wallSegments, true);
}

function carveCorridor(from, to, occupancy, roomType, width, hullMask) {
  const path = findHullPath(from, to, hullMask);
  if (!path.length) return [];

  const painted = new Set();
  for (const point of path) {
    const brush = corridorBrush(point, width, hullMask);
    for (const cell of brush) {
      painted.add(`${cell.x},${cell.y}`);
      if (occupancy[cell.y]?.[cell.x] !== undefined) occupancy[cell.y][cell.x] = true;
      if (roomType[cell.y]?.[cell.x] !== undefined && roomType[cell.y][cell.x] !== "room") {
        roomType[cell.y][cell.x] = "corridor";
      }
    }
  }

  const rects = compressCellsToRects(Array.from(painted).map((key) => {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }));

  return rects.map((rect) => ({
    ...rect,
    waypoints: path.map((point) => ({ x: point.x, y: point.y })),
    startDoor: "door",
    endDoor: "door"
  }));
}

function ensureCorridorConnectivity(rooms, connections, corridors, occupancy, roomType, corridorWidth, hullMask, formState = null) {
  if (rooms.length <= 1) return;

  const connected = reachableRoomIds(rooms, connections);
  const reachable = new Set(connected);

  while (reachable.size < rooms.length) {
    const unreachableRooms = rooms.filter((room) => !reachable.has(room.id));
    if (!unreachableRooms.length) break;

    let repaired = false;
    for (const room of unreachableRooms) {
      const rescueTarget = nearestReachableRoom(room, rooms, reachable);
      if (!rescueTarget) continue;
      const width = formState ? corridorWidthForConnection(room, rescueTarget, formState) : corridorWidth;
      const hall = carveCorridor(roomCenter(room), roomCenter(rescueTarget), occupancy, roomType, width, hullMask);
      if (!hall.length) continue;
      corridors.push(...hall);
      connections.push([room.id, rescueTarget.id]);
      const updated = reachableRoomIds(rooms, connections);
      reachable.clear();
      for (const id of updated) reachable.add(id);
      repaired = true;
      break;
    }

    if (!repaired) break;
  }
}

function corridorWidthForConnection(roomA, roomB, formState) {
  const important = new Set(["bridge", "engineering", "boss-chamber", "throne-room", "entrance", "reactor"]);
  if (important.has(roomA?.type) || important.has(roomB?.type)) return Math.max(2, formState.corridorWidth);
  return formState.corridorWidth;
}

function roomCenter(room) {
  if (room.shape === "circle" && Number.isFinite(room.circleR)) {
    return {
      x: room.circleX + room.circleR,
      y: room.circleY + room.circleR
    };
  }
  return {
    x: room.x + Math.floor(room.width / 2),
    y: room.y + Math.floor(room.height / 2)
  };
}

function roomBounds(room) {
  if (room.shape === "circle" && Number.isFinite(room.circleR)) {
    return {
      x: room.circleX,
      y: room.circleY,
      width: room.circleR * 2,
      height: room.circleR * 2
    };
  }
  if (room.shape === "polygon" && room.points?.length) {
    const xs = room.points.map((point) => point.x);
    const ys = room.points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  return {
    x: room.x,
    y: room.y,
    width: room.width,
    height: room.height
  };
}

function pointInRoom(point, room) {
  return point.x >= room.x
    && point.x < room.x + room.width
    && point.y >= room.y
    && point.y < room.y + room.height;
}

function nearestRoomForIndex(rooms, index) {
  const current = roomCenter(rooms[index]);
  let nearest = rooms[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < index; i += 1) {
    const centre = roomCenter(rooms[i]);
    const distance = Math.abs(current.x - centre.x) + Math.abs(current.y - centre.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = rooms[i];
    }
  }
  return nearest;
}

function nearestReachableRoom(room, rooms, reachableIds) {
  const current = roomCenter(room);
  let nearest = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of rooms) {
    if (!reachableIds.has(candidate.id) || candidate.id === room.id) continue;
    const centre = roomCenter(candidate);
    const distance = Math.abs(current.x - centre.x) + Math.abs(current.y - centre.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      nearest = candidate;
    }
  }
  return nearest;
}

function makeGrid(width, height, value) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => value));
}

function fillRectCells(grid, rect, value) {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      if (grid[y]?.[x] !== undefined) grid[y][x] = value;
    }
  }
}

function rectsOverlap(a, b) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

function expandRect(rect, amount) {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2
  };
}

function cellEdge(x, y, side) {
  if (side === "n") return { x1: x, y1: y, x2: x + 1, y2: y };
  if (side === "s") return { x1: x, y1: y + 1, x2: x + 1, y2: y + 1 };
  if (side === "e") return { x1: x + 1, y1: y, x2: x + 1, y2: y + 1 };
  return { x1: x, y1: y, x2: x, y2: y + 1 };
}

function dedupeSegments(segments, preserveDoor = false) {
  const map = new Map();
  for (const segment of segments) {
    const key = `${segment.x1},${segment.y1},${segment.x2},${segment.y2}`;
    if (!preserveDoor || !map.has(key) || segment.door) {
      map.set(key, segment);
    }
  }
  return Array.from(map.values());
}

function chooseCorridorDoorEdges(thresholdEdges) {
  const groupedByRoom = new Map();
  for (const edge of thresholdEdges) {
    const roomId = edge.roomId || "unknown";
    if (!groupedByRoom.has(roomId)) groupedByRoom.set(roomId, []);
    groupedByRoom.get(roomId).push(edge);
  }

  const doorEdges = [];
  for (const edges of groupedByRoom.values()) {
    const runs = groupContiguousDoorRuns(edges);
    for (const run of runs) {
      doorEdges.push(run[Math.floor(run.length / 2)]);
    }
  }
  return dedupeSegments(doorEdges, true);
}

function groupContiguousDoorRuns(edges) {
  const buckets = new Map();
  for (const edge of edges) {
    const orientation = edge.y1 === edge.y2 ? "h" : "v";
    const line = orientation === "h" ? edge.y1 : edge.x1;
    const bucketKey = `${orientation}:${line}`;
    if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
    buckets.get(bucketKey).push(edge);
  }

  const runs = [];
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => {
      if (a.y1 === a.y2) return a.x1 - b.x1;
      return a.y1 - b.y1;
    });

    let currentRun = [];
    for (const edge of bucket) {
      if (!currentRun.length) {
        currentRun.push(edge);
        continue;
      }
      const previous = currentRun[currentRun.length - 1];
      const contiguous = previous.y1 === previous.y2
        ? previous.x2 === edge.x1
        : previous.y2 === edge.y1;
      if (contiguous) {
        currentRun.push(edge);
      } else {
        runs.push(currentRun);
        currentRun = [edge];
      }
    }
    if (currentRun.length) runs.push(currentRun);
  }

  return runs;
}

function reachableRoomIds(rooms, connections) {
  if (!rooms.length) return new Set();
  const adjacency = new Map(rooms.map((room) => [room.id, new Set()]));
  for (const [a, b] of connections) {
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  }

  const reachable = new Set([rooms[0].id]);
  const queue = [rooms[0].id];
  while (queue.length) {
    const current = queue.shift();
    for (const next of adjacency.get(current) ?? []) {
      if (reachable.has(next)) continue;
      reachable.add(next);
      queue.push(next);
    }
  }
  return reachable;
}

function weightedChoice(entries, rng) {
  const total = entries.reduce((sum, entry) => sum + (entry.weight ?? 1), 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= entry.weight ?? 1;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
}

function paletteForFormState(formState) {
  if (!formState?.compactPrintMode) return themePalette(formState?.theme);
  return {
    base: "#ffffff",
    fill: "#ffffff",
    line: "#d4d4d4",
    detail: "#888888",
    hull: "#222222",
    roomFill: "#f7f7f7",
    roomStroke: "#222222",
    corridorFill: "#ececec",
    corridorStripe: "#c8c8c8",
    label: "#111111",
    coordText: "#444444",
    coordCell: "#777777",
    connectorFill: "#ffffff",
    connectorStroke: "#444444",
    connectorText: "#111111",
    furnitureFill: "#dcdcdc",
    furnitureStroke: "#666666",
    furnitureLabel: "#111111",
    secretDoor: "#555555",
    bloodStain: "#999999",
    water: "#c9d7e5",
    treeColor: "#aeb8a0"
  };
}

function themePalette(theme) {
  switch (theme) {
    case "stone":
      return { base: "#4a453e", fill: "#5c5650", line: "#2e2b26", detail: "#8c8278", hull: "#1a1714", roomFill: "#c8c0b4", roomStroke: "#1a1714", corridorFill: "#a89e94", corridorStripe: "#c5bbaf", label: "#f5f0e8", coordText: "#ede6da", coordCell: "#ddd4c4", connectorFill: "#57443b", connectorStroke: "#d3b798", connectorText: "#fff5e6", furnitureFill: "#5a5040", furnitureStroke: "#8a7860", furnitureLabel: "#fff5e6", secretDoor: "#884422", water: "#33485b", bloodStain: "#5a2720" };
    case "cave":
      return { base: "#2e3530", fill: "#3d4840", line: "#181f1c", detail: "#6e7f72", hull: "#0d110e", roomFill: "#8fa690", roomStroke: "#0d110e", corridorFill: "#6d8070", corridorStripe: "#91a094", label: "#e8f5ec", coordText: "#d8eadd", coordCell: "#c4d8c8", connectorFill: "#30453a", connectorStroke: "#9fd0af", connectorText: "#effff4", furnitureFill: "#3a3028", furnitureStroke: "#7a6a50", furnitureLabel: "#effff4", secretDoor: "#9c5f3a", water: "#1f4960", bloodStain: "#4a1714" };
    case "wood":
    case "wood-floor":
      return { base: "#4a3828", fill: "#5c4a35", line: "#2b2015", detail: "#9c7c56", hull: "#160f08", roomFill: "#c8aa88", roomStroke: "#1a1008", corridorFill: "#a88c6c", label: "#fff4e2", coordText: "#f5e4c4", coordCell: "#e8d0a8", connectorFill: "#5d3922", connectorStroke: "#dca86a", connectorText: "#fff1dd", furnitureFill: "#6a4a28", furnitureStroke: "#9a7040", furnitureLabel: "#fff1dd", secretDoor: "#a45d2d" };
    case "crypt":
      return { base: "#2a2e35", fill: "#373d46", line: "#151820", detail: "#6070a0", hull: "#0a0c12", roomFill: "#a0aac0", roomStroke: "#0a0c12", corridorFill: "#808898", corridorStripe: "#a4adbf", label: "#e8eeff", coordText: "#d4d8f0", coordCell: "#c0c8e0", connectorFill: "#283152", connectorStroke: "#91a7de", connectorText: "#eef3ff", furnitureFill: "#3a3040", furnitureStroke: "#7a6a8a", furnitureLabel: "#eef3ff", secretDoor: "#b36b58", water: "#27395a", bloodStain: "#4c151d" };
    case "sewer":
      return { base: "#2e3828", fill: "#3c4835", line: "#1a2018", detail: "#7e9060", hull: "#0e1410", roomFill: "#a0b890", roomStroke: "#0e1410", corridorFill: "#7c9870", corridorStripe: "#9bb38f", label: "#eafff0", coordText: "#d4f0da", coordCell: "#b8e0c0", connectorFill: "#3c4a28", connectorStroke: "#b5d06d", connectorText: "#f6ffe2", furnitureFill: "#2a3a28", furnitureStroke: "#5a7a50", furnitureLabel: "#f6ffe2", secretDoor: "#996644", water: "#2b4731", bloodStain: "#4f241c" };
    case "concrete-office":
      return { base: "#5a5f64", fill: "#767b80", line: "#2f3438", detail: "#a5adb7", hull: "#171a1d", roomFill: "#dddfe1", roomStroke: "#23272a", corridorFill: "#cacdd1", corridorStripe: "#9fc7f1", label: "#ffffff", coordText: "#f0f4f8", coordCell: "#d8dfe6", connectorFill: "#42515e", connectorStroke: "#9fc7f1", connectorText: "#eef7ff", furnitureFill: "#c0c8d0", furnitureStroke: "#8090a0", furnitureLabel: "#243442", secretDoor: "#b54b38", bloodStain: "#781d1d" };
    case "brick":
      return { base: "#4c3a36", fill: "#604944", line: "#2b1f1b", detail: "#9e7568", hull: "#150f0d", roomFill: "#d7c4bf", roomStroke: "#1c1412", corridorFill: "#c0aaa4", label: "#fff2ef", coordText: "#f1ddd8", coordCell: "#e3c8c0", connectorFill: "#5b3429", connectorStroke: "#d59e88", connectorText: "#fff0eb", furnitureFill: "#7a5040", furnitureStroke: "#a06050", furnitureLabel: "#fff0eb", secretDoor: "#b84d3a" };
    case "carpet":
      return { base: "#3d2e44", fill: "#4d3a55", line: "#24192a", detail: "#8f73a1", hull: "#110b15", roomFill: "#d6cbdd", roomStroke: "#1e1623", corridorFill: "#c0b0ca", label: "#faf3ff", coordText: "#eadcf0", coordCell: "#dbc9e3", connectorFill: "#493660", connectorStroke: "#c4a7e6", connectorText: "#fbf3ff", furnitureFill: "#6a4a6a", furnitureStroke: "#9a7090", furnitureLabel: "#fbf3ff", secretDoor: "#d26767" };
    case "tile":
      return { base: "#405055", fill: "#57666b", line: "#223036", detail: "#95b4b9", hull: "#11181b", roomFill: "#d9e3e4", roomStroke: "#1a2529", corridorFill: "#c3d1d2", label: "#f5ffff", coordText: "#dcedef", coordCell: "#cae0e2", connectorFill: "#2f5962", connectorStroke: "#8fd3dc", connectorText: "#eeffff", furnitureFill: "#c0c8c0", furnitureStroke: "#808888", furnitureLabel: "#274156", secretDoor: "#c05042" };
    case "industrial":
      return { base: "#45413d", fill: "#5c5751", line: "#2f2c29", detail: "#bb8b3d", hull: "#121110", roomFill: "#c8c3ba", roomStroke: "#151515", corridorFill: "#b8b1a6", corridorStripe: "#d5a852", label: "#f7efe2", coordText: "#f6efe4", coordCell: "#eee6da", connectorFill: "#4b3c23", connectorStroke: "#d5a852", connectorText: "#fff1c8", furnitureFill: "#4a3a2a", furnitureStroke: "#7a6040", furnitureLabel: "#fff1c8", secretDoor: "#c65f40", bloodStain: "#7a1e10" };
    case "derelict":
      return { base: "#313538", fill: "#44484b", line: "#1f2123", detail: "#6e4a3b", hull: "#0d0e10", roomFill: "#b8b1aa", roomStroke: "#111111", corridorFill: "#8e857d", corridorStripe: "#b38b72", label: "#f4dcc8", coordText: "#e8d7c6", coordCell: "#dcc9b4", connectorFill: "#402a24", connectorStroke: "#c38b72", connectorText: "#fde6db", furnitureFill: "#2a2a2a", furnitureStroke: "#5a5050", furnitureLabel: "#fde6db", secretDoor: "#aa5b4a", bloodStain: "#632420" };
    case "alien-organic":
      return { base: "#232b28", fill: "#31413b", line: "#18211d", detail: "#7db39a", hull: "#09100d", roomFill: "#98b7aa", roomStroke: "#101715", corridorFill: "#7c9e92", label: "#e2fff1", coordText: "#d7f8eb", coordCell: "#c7ebdd", connectorFill: "#28483d", connectorStroke: "#96d7ba", connectorText: "#effff7", furnitureFill: "#1a3a1a", furnitureStroke: "#3a7a3a", furnitureLabel: "#effff7", secretDoor: "#c44f44" };
    case "clean-corporate":
      return { base: "#d6dde2", fill: "#e5ecef", line: "#bcc8cf", detail: "#8fb7cf", hull: "#58656d", roomFill: "#f8fbfd", roomStroke: "#65717a", corridorFill: "#ebf1f4", corridorStripe: "#8fb7cf", label: "#35424c", coordText: "#5e6b76", coordCell: "#74828d", connectorFill: "#e7f1f8", connectorStroke: "#5f8cad", connectorText: "#274156", furnitureFill: "#d0d8e0", furnitureStroke: "#8090a0", furnitureLabel: "#274156", secretDoor: "#c45446", bloodStain: "#8f3e3e" };
    case "derelict-house":
      return { base: "#40352f", fill: "#5a4a42", line: "#2b221e", detail: "#8d776c", hull: "#140f0d", roomFill: "#d1c1b1", roomStroke: "#1d1613", corridorFill: "#b4a293", corridorStripe: "#d9c8b6", label: "#fff1e6", coordText: "#e9d6cb", coordCell: "#d5bfb1", connectorFill: "#5d453a", connectorStroke: "#c7a78b", connectorText: "#fff2e6", furnitureFill: "#6a5248", furnitureStroke: "#8f7564", furnitureLabel: "#fff2e6", secretDoor: "#b4654a", bloodStain: "#5e1818" };
    case "asylum":
      return { base: "#566165", fill: "#d6ddd9", line: "#8c9893", detail: "#7a6f67", hull: "#1d2325", roomFill: "#f2f4f1", roomStroke: "#384246", corridorFill: "#dde2de", corridorStripe: "#b5bdb8", label: "#243136", coordText: "#4b585e", coordCell: "#728086", connectorFill: "#77868d", connectorStroke: "#dbe8e2", connectorText: "#122026", furnitureFill: "#b9c1bc", furnitureStroke: "#7f8884", furnitureLabel: "#122026", secretDoor: "#8e3c3c", bloodStain: "#3a1010" };
    case "haunted-manor":
      return { base: "#2d2230", fill: "#4b3640", line: "#24161c", detail: "#9d7a64", hull: "#120c10", roomFill: "#cfbcae", roomStroke: "#1d1317", corridorFill: "#b19a8e", corridorStripe: "#d7c0a1", label: "#fff0e2", coordText: "#ead8cb", coordCell: "#d7c2b4", connectorFill: "#523844", connectorStroke: "#d3b59a", connectorText: "#fff3e6", furnitureFill: "#6a5045", furnitureStroke: "#8c6c5c", furnitureLabel: "#fff3e6", secretDoor: "#a34747", bloodStain: "#4f0f17" };
    case "bloodbath":
      return { base: "#26191b", fill: "#4a3030", line: "#1a0f11", detail: "#8e6666", hull: "#0e0708", roomFill: "#c9b7b4", roomStroke: "#180f11", corridorFill: "#9f8480", corridorStripe: "#d6aaaa", label: "#fff0ef", coordText: "#f0dada", coordCell: "#d9bcbc", connectorFill: "#5d2c2c", connectorStroke: "#e19c9c", connectorText: "#fff2f2", furnitureFill: "#6a3a3a", furnitureStroke: "#9a6666", furnitureLabel: "#fff2f2", secretDoor: "#d05050", bloodStain: "#650d0d" };
    case "forest":
      return { base: "#3f5136", fill: "#67855a", line: "#2b3926", detail: "#91b57e", hull: "#162013", roomFill: "#b5c8a3", roomStroke: "#23301f", corridorFill: "#8f7a54", corridorStripe: "#c8b07a", label: "#f3ffe8", coordText: "#e0f3d7", coordCell: "#cde2c5", connectorFill: "#405935", connectorStroke: "#a8d08d", connectorText: "#f6fff1", furnitureFill: "#6f5a3b", furnitureStroke: "#8d744e", furnitureLabel: "#f6fff1", secretDoor: "#8c4d2c", bloodStain: "#5c221b", water: "#2b5a78", treeColor: "#3d6a35" };
    case "jungle":
      return { base: "#2e4a34", fill: "#4e7a4c", line: "#1c2f21", detail: "#7eb86a", hull: "#122017", roomFill: "#98b78d", roomStroke: "#1d2d1f", corridorFill: "#7a6a48", corridorStripe: "#b59d63", label: "#f1ffe9", coordText: "#d7f0d0", coordCell: "#c3dfbc", connectorFill: "#2f5332", connectorStroke: "#95d07a", connectorText: "#f3fff0", furnitureFill: "#5a4a31", furnitureStroke: "#7a6846", furnitureLabel: "#f3fff0", secretDoor: "#7d4927", bloodStain: "#5b2018", water: "#1f5b52", treeColor: "#2f7f33" };
    case "plains":
      return { base: "#7d8d5a", fill: "#a8bb70", line: "#647045", detail: "#d9d08a", hull: "#3c4327", roomFill: "#d7d8ac", roomStroke: "#55603b", corridorFill: "#8e7b55", corridorStripe: "#d0bb82", label: "#fffde7", coordText: "#f3f0d6", coordCell: "#e2ddb9", connectorFill: "#7f7448", connectorStroke: "#e0cd8f", connectorText: "#fffde7", furnitureFill: "#8b754c", furnitureStroke: "#a68f60", furnitureLabel: "#fffde7", secretDoor: "#945930", bloodStain: "#6a2b20", water: "#5d8ba3", treeColor: "#6f8b42" };
    case "swamp":
      return { base: "#3d4632", fill: "#5e7051", line: "#27301f", detail: "#8ea16d", hull: "#151b11", roomFill: "#aab08a", roomStroke: "#283120", corridorFill: "#6d6243", corridorStripe: "#a19563", label: "#f0f8e2", coordText: "#dbe7cb", coordCell: "#c7d6b8", connectorFill: "#4b5030", connectorStroke: "#b9c58a", connectorText: "#f7ffe8", furnitureFill: "#5f5839", furnitureStroke: "#7c7152", furnitureLabel: "#f7ffe8", secretDoor: "#8d5134", bloodStain: "#58271f", water: "#304e43", treeColor: "#4d6f39" };
    case "tundra":
      return { base: "#7d8896", fill: "#b9c4ce", line: "#66707d", detail: "#eef4fa", hull: "#3f4750", roomFill: "#dde5ea", roomStroke: "#55606b", corridorFill: "#a9b6bf", corridorStripe: "#e8edf2", label: "#ffffff", coordText: "#eef4fa", coordCell: "#dbe4ec", connectorFill: "#6b7e8d", connectorStroke: "#eef4fa", connectorText: "#ffffff", furnitureFill: "#9eaab4", furnitureStroke: "#c6d0d8", furnitureLabel: "#2b3440", secretDoor: "#8a4b4b", bloodStain: "#7a2929", water: "#7fb4d3", treeColor: "#b7cbd5" };
    case "badlands":
      return { base: "#6c5642", fill: "#9a7a57", line: "#4a3828", detail: "#c49a63", hull: "#2a1e15", roomFill: "#d0bc9a", roomStroke: "#463424", corridorFill: "#8a6946", corridorStripe: "#d1a76d", label: "#fff4e6", coordText: "#f0ddc8", coordCell: "#e2cab1", connectorFill: "#7a5a38", connectorStroke: "#deb17a", connectorText: "#fff4e6", furnitureFill: "#7d6246", furnitureStroke: "#a88864", furnitureLabel: "#fff4e6", secretDoor: "#aa6138", bloodStain: "#6b2318", water: "#5a7485", treeColor: "#7c6d35" };
    case "alien-terminal":
      // Phosphor-green CRT aesthetic — Alien / Aliens movie computer terminals
      // Very dark green background, bright #00ff41 (classic VT100 phosphor green) for all lines, labels, walls
      return { base: "#020c06", fill: "#041208", line: "#001a04", detail: "#00ff41", hull: "#010602", roomFill: "#0a2010", roomStroke: "#001800", corridorFill: "#061510", corridorStripe: "#00cc33", label: "#00ff41", coordText: "#00cc33", coordCell: "#008822", connectorFill: "#0a2a0f", connectorStroke: "#00ff41", connectorText: "#00ff41", furnitureFill: "#0d2a12", furnitureStroke: "#00aa28", furnitureLabel: "#00ff41", secretDoor: "#00ff41", bloodStain: "#003a00", maintenanceFill: "#00ff41" };
    case "steel":
    default:
      return { base: "#384048", fill: "#505860", line: "#242a30", detail: "#9ba7b0", hull: "#111418", roomFill: "#d7dbe0", roomStroke: "#15191d", corridorFill: "#c5ccd2", corridorStripe: "#8fd4ff", label: "#eff7ff", coordText: "#e9f4fb", coordCell: "#d9e5ef", connectorFill: "#24405c", connectorStroke: "#8fd4ff", connectorText: "#eff8ff", furnitureFill: "#3a4a5a", furnitureStroke: "#5a7090", furnitureLabel: "#eff8ff", secretDoor: "#cc4444", bloodStain: "#7a1e1e" };
  }
}

const THEME_LIGHT_CONFIG = {
  steel: { ambient: true, color: "#a0c0ff", alpha: 0.4, luminosity: 0.5, roomTypes: ["bridge", "engineering", "reactor"] },
  industrial: { ambient: true, color: "#ffb060", alpha: 0.35, luminosity: 0.45, roomTypes: ["engineering", "reactor"] },
  derelict: {
    ambient: true,
    color: "#303515", // Sickly dim survival green-grey
    alpha: 0.22,
    luminosity: 0.22,
    roomTypes: ["bridge", "engineering", "reactor", "medical", "comms"],
    accentColor: "#cc2222", // Flickering red alarms in key rooms!
    animation: { type: "flicker", speed: 9, intensity: 8 }
  },
  "alien-organic": { ambient: true, color: "#20a040", alpha: 0.3, luminosity: 0.35, roomTypes: ["reactor"] },
  "clean-corporate": { ambient: true, color: "#ffffff", alpha: 0.6, luminosity: 0.7, roomTypes: [] },
  "alien-terminal": { ambient: true, color: "#00ff41", alpha: 0.18, luminosity: 0.22, roomTypes: ["bridge", "reactor", "engineering"] },
  stone: { ambient: false, color: "#ff8020", alpha: 0.5, luminosity: 0.4, roomTypes: ["shrine", "entrance", "guardroom"] },
  cave: { ambient: false, color: "#ff6010", alpha: 0.4, luminosity: 0.35, roomTypes: [] },
  wood: { ambient: false, color: "#ffb040", alpha: 0.55, luminosity: 0.45, roomTypes: ["shrine", "entrance"] },
  "wood-floor": { ambient: true, color: "#ffe8c0", alpha: 0.55, luminosity: 0.6, roomTypes: [] },
  crypt: { ambient: false, color: "#4020a0", alpha: 0.3, luminosity: 0.25, roomTypes: ["ritual-room", "crypt"], animation: { type: "pulse", speed: 3, intensity: 4 } },
  sewer: { ambient: false, color: "#204010", alpha: 0.25, luminosity: 0.3, roomTypes: [] },
  "concrete-office": { ambient: true, color: "#ffffff", alpha: 0.7, luminosity: 0.75, roomTypes: [] },
  brick: { ambient: true, color: "#ffe0c0", alpha: 0.5, luminosity: 0.55, roomTypes: ["common-room", "bar"] },
  carpet: { ambient: true, color: "#fff0e0", alpha: 0.6, luminosity: 0.65, roomTypes: [] },
  tile: { ambient: true, color: "#e0f0ff", alpha: 0.65, luminosity: 0.7, roomTypes: [] },
  "derelict-house": {
    ambient: true,
    color: "#601010", // Dim bloody red
    alpha: 0.2,
    luminosity: 0.2,
    roomTypes: ["basement", "boiler-room"],
    accentColor: "#cc2222",
    animation: { type: "flicker", speed: 8, intensity: 8 }
  },
  asylum: {
    ambient: true,
    color: "#a0a080", // Clinical sickness
    alpha: 0.24,
    luminosity: 0.25,
    roomTypes: ["surgery", "padded-cell", "medical"],
    accentColor: "#ece8aa", // Clinical flickering fluorescent bulbs
    animation: { type: "flicker", speed: 9, intensity: 6 }
  },
  "haunted-manor": {
    ambient: false,
    color: "#301540", // Sinister purple
    alpha: 0.2,
    luminosity: 0.2,
    roomTypes: ["library", "ballroom"],
    accentColor: "#502070",
    animation: { type: "pulse", speed: 2, intensity: 6 }
  },
  bloodbath: {
    ambient: false,
    color: "#700505", // Blood wash
    alpha: 0.35,
    luminosity: 0.2,
    roomTypes: [],
    animation: { type: "pulse", speed: 3, intensity: 5 }
  },
  forest: { ambient: true, color: "#b8d88a", alpha: 0.14, luminosity: 0.12, roomTypes: ["camp", "glade"] },
  jungle: { ambient: true, color: "#8cc26c", alpha: 0.12, luminosity: 0.1, roomTypes: ["nest", "ruins"] },
  plains: { ambient: true, color: "#f2df98", alpha: 0.08, luminosity: 0.08, roomTypes: ["camp", "crossing"] },
  swamp: { ambient: true, color: "#8da86a", alpha: 0.12, luminosity: 0.08, roomTypes: ["water", "ambush"] },
  tundra: { ambient: true, color: "#d8ecff", alpha: 0.1, luminosity: 0.1, roomTypes: ["ridge", "camp"] },
  badlands: { ambient: true, color: "#d9a36a", alpha: 0.1, luminosity: 0.08, roomTypes: ["ruins", "ambush"] }
};

function applySharedDeckConnectors(decks, formState) {
  const connectors = buildSharedDeckConnectorBlueprints(decks[0], formState);
  for (let deckIndex = 0; deckIndex < decks.length; deckIndex += 1) {
    decks[deckIndex].deckConnectors = connectors.map((connector) => ({
      ...connector,
      access: deckAccessLabel(deckIndex, decks.length)
    }));
    decorateDeckRoomsWithConnectors(decks[deckIndex]);
  }
}

function buildSharedDeckConnectorBlueprints(deck, formState) {
  const points = [];
  const hullMask = deck.hullMask ?? buildHullMask(deck.columns, deck.rows, deck.hullRegions ?? []);
  const primary = findNearestHullCell(hullMask, Math.floor(deck.columns / 2), Math.floor(deck.rows / 2));
  const connectorType = ["dungeon", "building"].includes(formState.mode) ? "stairs" : "elevator";
  const connectorLabel = ["dungeon", "building"].includes(formState.mode) ? "STAIR A" : "LIFT A";
  if (primary) {
    points.push({ id: "primary-a", x: primary.x, y: primary.y, label: connectorLabel, type: connectorType });
  }
  if (formState.columns >= 24 && formState.rows >= 14) {
    const secondary = findNearestHullCell(hullMask, Math.floor(deck.columns * 0.7), Math.floor(deck.rows * 0.35));
    if (secondary && (!primary || secondary.x !== primary.x || secondary.y !== primary.y)) {
      const secondaryType = formState.mode === "building" ? "stairs" : "ladder";
      const secondaryLabel = formState.mode === "building" ? "STAIR B" : "LADDER B";
      points.push({ id: "secondary-b", x: secondary.x, y: secondary.y, label: secondaryLabel, type: secondaryType });
    }
  }
  return points;
}

function deckAccessLabel(index, deckCount) {
  const up = index < deckCount - 1 ? `UP ${index + 2}` : null;
  const down = index > 0 ? `DOWN ${index}` : null;
  return [up, down].filter(Boolean).join(" / ") || "LINK";
}

function decorateDeckRoomsWithConnectors(deck) {
  for (const connector of deck.deckConnectors ?? []) {
    const room = deck.rooms.find((candidate) => pointInRoom(connector, candidate));
    if (!room) continue;
    room.markers ??= [];
    room.markers.push({
      type: connector.type === "ladder" ? "Ladder" : connector.type === "stairs" ? "Stairs" : "Elevator",
      label: connector.label,
      x: connector.x,
      y: connector.y,
      access: connector.access
    });
  }
}

function buildHullRegions(columns, rows, hullShape, mode) {
  const interiorWidth = Math.max(8, columns - 2);
  const interiorHeight = Math.max(8, rows - 2);
  const x0 = 1;
  const y0 = 1;
  let shape = mode === "bsp" && hullShape === "ring" ? "cross" : hullShape;
  if (shape === "rect") shape = "rectangle";

  switch (shape) {
    case "tapered": {
      const frontWidth = Math.max(4, Math.round(interiorWidth * 0.2));
      const midWidth = Math.max(8, Math.round(interiorWidth * 0.55));
      const aftWidth = Math.max(4, interiorWidth - frontWidth - midWidth);
      return [
        { x: x0, y: y0 + Math.max(1, Math.floor(interiorHeight * 0.22)), width: frontWidth, height: Math.max(4, interiorHeight - Math.max(2, Math.floor(interiorHeight * 0.44))) },
        { x: x0 + frontWidth, y: y0 + Math.max(1, Math.floor(interiorHeight * 0.1)), width: midWidth, height: Math.max(6, interiorHeight - Math.max(2, Math.floor(interiorHeight * 0.2))) },
        { x: x0 + frontWidth + midWidth, y: y0 + Math.max(1, Math.floor(interiorHeight * 0.2)), width: aftWidth, height: Math.max(4, interiorHeight - Math.max(2, Math.floor(interiorHeight * 0.4))) }
      ];
    }
    case "hammerhead": {
      const headWidth = Math.max(6, Math.round(interiorWidth * 0.28));
      const neckWidth = Math.max(4, Math.round(interiorWidth * 0.16));
      const bodyWidth = Math.max(6, interiorWidth - headWidth - neckWidth);
      const headY = y0 + 1;
      const headH = Math.max(6, interiorHeight - 2);
      const neckH = Math.max(4, Math.round(interiorHeight * 0.42));
      const neckY = y0 + Math.floor((interiorHeight - neckH) / 2);
      const bodyY = y0 + Math.max(1, Math.floor(interiorHeight * 0.12));
      const bodyH = Math.max(6, interiorHeight - Math.max(2, Math.floor(interiorHeight * 0.24)));
      return [
        { x: x0, y: headY, width: headWidth, height: headH },
        { x: x0 + headWidth, y: neckY, width: neckWidth, height: neckH },
        { x: x0 + headWidth + neckWidth, y: bodyY, width: bodyWidth, height: bodyH }
      ];
    }
    case "cross": {
      const stemWidth = Math.max(6, Math.round(interiorWidth * 0.34));
      const barHeight = Math.max(6, Math.round(interiorHeight * 0.34));
      const stemX = x0 + Math.floor((interiorWidth - stemWidth) / 2);
      const barY = y0 + Math.floor((interiorHeight - barHeight) / 2);
      return [
        { x: stemX, y: y0, width: stemWidth, height: barY - y0 },
        { x: x0, y: barY, width: interiorWidth, height: barHeight },
        { x: stemX, y: barY + barHeight, width: stemWidth, height: y0 + interiorHeight - (barY + barHeight) }
      ].filter((region) => region.width >= 3 && region.height >= 3);
    }
    case "l-shape": {
      const leftWidth = Math.max(6, Math.round(interiorWidth * 0.42));
      const bottomHeight = Math.max(6, Math.round(interiorHeight * 0.42));
      return [
        { x: x0, y: y0, width: leftWidth, height: interiorHeight },
        { x: x0 + leftWidth, y: y0 + interiorHeight - bottomHeight, width: interiorWidth - leftWidth, height: bottomHeight }
      ];
    }
    case "t-shape": {
      const stemWidth = Math.max(6, Math.round(interiorWidth * 0.36));
      const barHeight = Math.max(6, Math.round(interiorHeight * 0.34));
      const stemX = x0 + Math.floor((interiorWidth - stemWidth) / 2);
      return [
        { x: x0, y: y0, width: interiorWidth, height: barHeight },
        { x: stemX, y: y0 + barHeight, width: stemWidth, height: interiorHeight - barHeight }
      ];
    }
    case "u-shape": {
      const legWidth = Math.max(5, Math.round(interiorWidth * 0.24));
      const baseHeight = Math.max(6, Math.round(interiorHeight * 0.32));
      return [
        { x: x0, y: y0, width: legWidth, height: interiorHeight },
        { x: x0 + interiorWidth - legWidth, y: y0, width: legWidth, height: interiorHeight },
        { x: x0, y: y0 + interiorHeight - baseHeight, width: interiorWidth, height: baseHeight }
      ];
    }
    case "ring": {
      const thickness = Math.max(3, Math.round(Math.min(interiorWidth, interiorHeight) * 0.18));
      return [
        { x: x0, y: y0, width: interiorWidth, height: thickness },
        { x: x0, y: y0 + thickness, width: thickness, height: interiorHeight - thickness * 2 },
        { x: x0 + interiorWidth - thickness, y: y0 + thickness, width: thickness, height: interiorHeight - thickness * 2 },
        { x: x0, y: y0 + interiorHeight - thickness, width: interiorWidth, height: thickness }
      ].filter((region) => region.width >= 3 && region.height >= 3);
    }
    case "rectangle":
    default:
      return [{ x: x0, y: y0, width: interiorWidth, height: interiorHeight }];
  }
}

function buildHullMask(columns, rows, regions) {
  const mask = makeGrid(columns, rows, false);
  for (const region of regions) {
    fillRectCells(mask, region, true);
  }
  return mask;
}

function boundingRectFromRegions(regions) {
  const minX = Math.min(...regions.map((region) => region.x));
  const minY = Math.min(...regions.map((region) => region.y));
  const maxX = Math.max(...regions.map((region) => region.x + region.width));
  const maxY = Math.max(...regions.map((region) => region.y + region.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function allocateRoomCounts(regions, targetCount) {
  if (regions.length === 1) return [targetCount];
  const areas = regions.map((region) => region.width * region.height);
  const totalArea = areas.reduce((sum, area) => sum + area, 0) || 1;
  const counts = regions.map(() => 1);
  let remaining = Math.max(0, targetCount - counts.length);

  while (remaining > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < regions.length; index += 1) {
      const score = (areas[index] / totalArea) - (counts[index] / Math.max(1, targetCount));
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }
    counts[bestIndex] += 1;
    remaining -= 1;
  }

  return counts;
}

function buildHullWallSegments(hullMask) {
  const segments = [];
  for (let y = 0; y < hullMask.length; y += 1) {
    for (let x = 0; x < (hullMask[y]?.length ?? 0); x += 1) {
      if (!hullMask[y]?.[x]) continue;
      const edges = [
        { side: "n", nx: x, ny: y - 1 },
        { side: "e", nx: x + 1, ny: y },
        { side: "s", nx: x, ny: y + 1 },
        { side: "w", nx: x - 1, ny: y }
      ];
      for (const edge of edges) {
        if (!hullMask[edge.ny]?.[edge.nx]) {
          segments.push(cellEdge(x, y, edge.side));
        }
      }
    }
  }
  return dedupeSegments(segments);
}

function buildHullWallsWithDoorGaps(hullMask, doorSegments) {
  const blocked = new Set(
    doorSegments.map((segment) => segmentKey(segment))
  );
  return buildHullWallSegments(hullMask).filter((segment) => !blocked.has(segmentKey(segment)));
}

function rectFitsMask(rect, mask) {
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      if (!mask[y]?.[x]) return false;
    }
  }
  return true;
}

function segmentKey(segment) {
  return `${segment.x1},${segment.y1},${segment.x2},${segment.y2}`;
}

function findHullPath(from, to, hullMask) {
  const start = `${from.x},${from.y}`;
  const goal = `${to.x},${to.y}`;
  const queue = [from];
  const seen = new Set([start]);
  const parent = new Map();
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
  ];

  while (queue.length) {
    const current = queue.shift();
    const key = `${current.x},${current.y}`;
    if (key === goal) break;
    for (const dir of dirs) {
      const next = { x: current.x + dir.x, y: current.y + dir.y };
      const nextKey = `${next.x},${next.y}`;
      if (seen.has(nextKey) || !hullMask[next.y]?.[next.x]) continue;
      seen.add(nextKey);
      parent.set(nextKey, key);
      queue.push(next);
    }
  }

  if (!seen.has(goal)) return [];
  const path = [];
  let currentKey = goal;
  while (currentKey) {
    const [x, y] = currentKey.split(",").map(Number);
    path.push({ x, y });
    currentKey = parent.get(currentKey);
  }
  return path.reverse();
}

function corridorBrush(point, width, hullMask) {
  const cells = [];
  const radius = width - 1;
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      const cell = { x: point.x + dx, y: point.y + dy };
      if (hullMask[cell.y]?.[cell.x]) cells.push(cell);
    }
  }
  return cells;
}

function compressCellsToRects(cells) {
  const byRow = new Map();
  for (const cell of cells) {
    const row = byRow.get(cell.y) ?? [];
    row.push(cell.x);
    byRow.set(cell.y, row);
  }

  const rects = [];
  for (const [y, xs] of byRow.entries()) {
    xs.sort((a, b) => a - b);
    let start = xs[0];
    let prev = xs[0];
    for (let index = 1; index <= xs.length; index += 1) {
      const x = xs[index];
      if (x === prev + 1) {
        prev = x;
        continue;
      }
      rects.push({ x: start, y, width: prev - start + 1, height: 1 });
      start = x;
      prev = x;
    }
  }
  return rects;
}

function findNearestHullCell(mask, targetX, targetY) {
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let y = 0; y < mask.length; y += 1) {
    for (let x = 0; x < (mask[y]?.length ?? 0); x += 1) {
      if (!mask[y]?.[x]) continue;
      const distance = Math.abs(targetX - x) + Math.abs(targetY - y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { x, y };
      }
    }
  }
  return best;
}

async function ensureSceneFolder(name) {
  let folder = game.folders?.find((entry) => entry.type === "Scene" && entry.name === name && !entry.folder);
  if (!folder) {
    folder = await Folder.create({ name, type: "Scene", color: "#40637a" });
  }
  return folder;
}

function buildSceneFolderOptions() {
  const folders = game.folders?.filter((entry) => entry.type === "Scene") ?? [];
  const sorted = [...folders].sort((a, b) => describeFolderPath(a).localeCompare(describeFolderPath(b)));
  return [
    { value: "", label: "Choose a scene folder..." },
    ...sorted.map((folder) => ({
      value: folder.id,
      label: describeFolderPath(folder)
    }))
  ];
}

function describeFolderPath(folder) {
  const parts = [];
  let current = folder;
  while (current) {
    parts.unshift(current.name);
    current = current.folder ?? null;
  }
  return parts.join(" / ");
}

function buildActorPackOptions() {
  const packs = (game.packs?.contents ?? [])
    .filter((pack) => pack.documentName === "Actor")
    .sort((a, b) => `${a.metadata.packageName}.${a.metadata.label}`.localeCompare(`${b.metadata.packageName}.${b.metadata.label}`));
  return [
    { value: "", label: "Use generated placeholder encounters" },
    ...packs.map((pack) => ({
      value: pack.collection,
      label: `${pack.metadata.label} (${pack.collection})`
    }))
  ];
}

function buildSavedPresetOptions() {
  const presets = (game.settings.get(MODULE_ID, "savedPresets") ?? [])
    .filter((preset) => preset?.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  return [
    { value: "", label: "Choose a saved preset..." },
    ...presets.map((preset) => ({ value: preset.name, label: preset.name }))
  ];
}

function mapOptions(options, selectedValue) {
  return options.map((option) => ({
    ...option,
    selected: String(option.value) === String(selectedValue)
  }));
}

function setInputValue(form, name, value) {
  const element = form.querySelector(`[name="${name}"]`);
  if (!element) return;
  if (element.type === "checkbox") {
    element.checked = Boolean(value);
    return;
  }
  element.value = String(value);
}

function buildMapName(mode = "bsp", seedInput = Date.now(), buildingSubtype = "office") {
  const hash = hashSeed(String(seedInput));
  if (mode === "wilderness") {
    const baseName = WILDERNESS_NAME_POOL[hash % WILDERNESS_NAME_POOL.length];
    const suffix = WILDERNESS_SUFFIX_POOL[Math.floor(hash / WILDERNESS_NAME_POOL.length) % WILDERNESS_SUFFIX_POOL.length];
    return `${baseName} ${suffix}`;
  }
  if (mode === "dungeon") {
    const baseName = DUNGEON_NAME_POOL[hash % DUNGEON_NAME_POOL.length];
    const suffix = DUNGEON_SUFFIX_POOL[Math.floor(hash / DUNGEON_NAME_POOL.length) % DUNGEON_SUFFIX_POOL.length];
    return `${baseName} ${suffix}`;
  }
  if (mode === "building") {
    const baseName = BUILDING_NAME_POOL[hash % BUILDING_NAME_POOL.length];
    const suffixPool = {
      office: ["Corporate HQ", "Office Block", "Business Centre", "Bureau"],
      warehouse: ["Warehouse", "Distribution Centre", "Storage Facility", "Depot"],
      residential: ["Apartment", "Residence", "Estate", "Housing Block"],
      tavern: ["The Rusty Flagon", "The Black Horse", "The Wanderer's Rest", "The Crooked Crown"],
      mansion: ["Manor", "Estate", "Hall", "House"],
      horror: ["Derelict House", "Asylum Wing", "Haunted Hall", "Murder Site"]
    }[buildingSubtype] ?? BUILDING_SUFFIX_POOL;
    const suffix = suffixPool[Math.floor(hash / BUILDING_NAME_POOL.length) % suffixPool.length];
    return `${baseName} ${suffix}`;
  }
  const baseName = SHIP_NAME_POOL[hash % SHIP_NAME_POOL.length];
  const suffix = SHIP_SUFFIX_POOL[Math.floor(hash / SHIP_NAME_POOL.length) % SHIP_SUFFIX_POOL.length];
  return `${baseName} ${suffix}`;
}

function resolveDeckName(index, mode = "bsp") {
  if (mode === "wilderness") return "Surface Map";
  if (mode === "dungeon") return DUNGEON_LEVEL_NAMES[index] ?? `Level ${index + 1}`;
  if (mode === "building") return BUILDING_LEVEL_NAMES[index] ?? `Floor ${index + 1}`;
  return DECK_NAME_POOL[index] ?? `Deck ${index + 1}`;
}

function buildMissionBriefContent(deckPlan, formState) {
  const chosenTemplate = resolveMissionTemplate(formState);
  const introByTemplate = {
    scifi: "The following operational map has been assembled from technical schematics, survey sweeps, and local traffic records. Expect compartment deviations and obstructed routes.",
    dungeon: {
      stone: "The following dungeon complex has been mapped from available intelligence and survivor accounts. Treat all information as provisional.",
      crypt: "The catacombs below are ancient. What was once a place of rest for the honoured dead has become something else entirely.",
      cave: "A naturally formed cave complex, partially occupied. The passages are unstable in places.",
      sewer: "The lower channels are flooded, foul, and likely inhabited. Maintain sealed gear and expect poor visibility."
    },
    horror: {
      "derelict-house": "The structure shows clear signs of decay and breach. Expect unreliable doors, unstable interiors, and poor sightlines.",
      asylum: "Institutional records indicate sealed wards and restricted treatment rooms. Interior movement may be obstructed and threats concealed.",
      "haunted-manor": "The manor layout is intact but poorly maintained. Expect dead ends, servant routes, and compromised access points.",
      bloodbath: "The site is an active or recent kill zone. Visibility may be poor, surfaces contaminated, and rooms psychologically destabilising."
    },
    sla: "The following contract-zone map has been compiled for operative deployment. Media exposure, collateral risk, and sector politics may alter mission value without warning.",
    wilderness: {
      forest: "The following area has been surveyed from aerial observation. Ground-truth data should be established before committing forces.",
      swamp: "The terrain is treacherous and visibility is limited. Standard movement rates should be halved.",
      jungle: "Vegetation density is extreme and lines of sight are unreliable. Maintain visual contact between elements at all times."
    }
  };
  const introSource = introByTemplate[chosenTemplate] ?? introByTemplate.scifi;
  const intro = typeof introSource === "string"
    ? introSource
    : introSource?.[formState.theme] ?? "The following location has been mapped from the best data currently available. Treat all positions as approximate until confirmed on the ground.";
  const deckLines = deckPlan.decks.map((deck) => `<li><strong>${escapeXml(deck.deckName)}</strong>: ${deck.rooms.length} rooms, ${deck.corridors.length} corridors, ${escapeXml(summarizeDeckThreats(deck))}</li>`).join("");
  return `
    <h1>${escapeXml(deckPlan.shipName)} Mission Brief</h1>
    <p>${escapeXml(intro)}</p>
    <p><strong>Seed:</strong> ${escapeXml(deckPlan.seed)}<br><strong>Theme:</strong> ${escapeXml(formState.theme)}<br><strong>Mode:</strong> ${escapeXml(formState.mode)}</p>
    <h2>Operational Notes</h2>
    <ul>
      <li>Generated with ${deckPlan.decks.length} level${deckPlan.decks.length === 1 ? "" : "s"} at ${formState.gridSize}px grid resolution.</li>
      <li>Room labels and openings are intended as tactical guides; final conditions should be confirmed on scene entry.</li>
      <li>${escapeXml(briefSpecialInstruction(formState, chosenTemplate))}</li>
    </ul>
    <h2>Deck Summary</h2>
    <ul>${deckLines}</ul>
  `.replace(/\n\s+/g, "");
}

function resolveMissionTemplate(formState) {
  if (formState.missionTemplate !== "auto") return formState.missionTemplate;
  if (["sla-mothership", "sla-industries-brp"].includes(game.system?.id ?? "")) return "sla";
  if (formState.mode === "wilderness") return "wilderness";
  if (formState.mode === "dungeon") return "dungeon";
  if (["derelict-house", "asylum", "haunted-manor", "bloodbath"].includes(formState.theme)) return "horror";
  return "scifi";
}

function summarizeDeckThreats(deck) {
  const dangerous = deck.rooms.filter((room) => ENCOUNTER_ROOM_TYPES.has(room.type));
  if (!dangerous.length && !(deck.wilderness?.encounterZones?.length)) return "no explicit threat nodes marked";
  if (!dangerous.length && deck.wilderness?.encounterZones?.length) {
    return `${deck.wilderness.encounterZones.length} wilderness encounter zone${deck.wilderness.encounterZones.length === 1 ? "" : "s"} flagged`;
  }
  const labels = dangerous.slice(0, 3).map((room) => room.label || room.type.toUpperCase());
  return `${dangerous.length} high-risk room${dangerous.length === 1 ? "" : "s"} flagged (${labels.join(", ")}${dangerous.length > 3 ? ", ..." : ""})`;
}

function briefSpecialInstruction(formState, chosenTemplate = resolveMissionTemplate(formState)) {
  if (chosenTemplate === "sla") return "Contract conditions remain fluid. Expect media scrutiny, unstable civilians, and rapid shifts in mission value if the situation escalates.";
  if (chosenTemplate === "horror") return "Assume compromised lighting, psychological contamination, and hostile movement from behind unsecured doors or soft barriers.";
  if (chosenTemplate === "dungeon") return "Advance with scouts, secure retreats, and expect locked chambers to signal either treasure, ritual focus, or concentrated resistance.";
  if (chosenTemplate === "wilderness") return "Ridgelines, ravines, and water obstacles are treated as movement-affecting terrain and should shape approach routes.";
  if (formState.seedEncounters) return "Encounter seed markers were placed in hostile or high-risk rooms for GM staging.";
  if (formState.mapAge >= 60) return "The map has been weathered heavily; assume locked, broken, or compromised access points are more common.";
  if (["derelict-house", "asylum", "haunted-manor", "bloodbath"].includes(formState.theme)) return "Horror decay modifiers are active: doors may be barricaded, breached, or partially collapsed.";
  return "Maintain standard caution and update the plan with local observations during play.";
}

function slugify(value) {
  return String(value ?? MODULE_ID)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || MODULE_ID;
}

function hashSeed(value) {
  const text = String(value ?? "");
  let hash = 1779033703;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let current = seed >>> 0;
  return function rng() {
    current |= 0;
    current = (current + 0x6D2B79F5) | 0;
    let t = Math.imul(current ^ (current >>> 15), 1 | current);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(rng, min, max) {
  if (max <= min) return min;
  return Math.floor(rng() * (max - min + 1)) + min;
}

function clampInt(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function normalizeChoice(value, fallback, choices) {
  return choices.includes(value) ? value : fallback;
}

function columnLabel(index) {
  let value = Number(index ?? 0);
  let out = "";
  do {
    out = String.fromCharCode(65 + (value % 26)) + out;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return out;
}

function round(value) {
  return Math.round(Number(value) || 0);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function textStrokeFor(fillColor) {
  const rgb = hexToRgb(fillColor);
  if (!rgb) return "rgba(10, 14, 18, 0.96)";
  const luminance = ((0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b)) / 255;
  return luminance > 0.62 ? "rgba(12, 16, 20, 0.96)" : "rgba(248, 251, 255, 0.96)";
}

function hexToRgb(color) {
  const value = String(color ?? "").trim();
  const short = value.match(/^#([0-9a-f]{3})$/i);
  if (short) {
    const [r, g, b] = short[1].split("").map((char) => parseInt(char + char, 16));
    return { r, g, b };
  }
  const full = value.match(/^#([0-9a-f]{6})$/i);
  if (full) {
    return {
      r: parseInt(full[1].slice(0, 2), 16),
      g: parseInt(full[1].slice(2, 4), 16),
      b: parseInt(full[1].slice(4, 6), 16)
    };
  }
  return null;
}
