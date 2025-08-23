const ScoutConfig = {
    // Global exploration memory freshness threshold (ticks). Older intel gets refreshed first.
    STALE_AFTER: 15000,

    // How far to avoid Keeper Lairs / Keeper Creeps
    KEEPER_AVOID_RADIUS: 9,

    // Group 1 (Explorer): broad exploration
    group1: {
        useCustomPath: false,         // toggle on to force a specific path
        customPathLoop: false,        // if true, loops through the path
        customPath: [
            // { room: 'W14N37', x: 25, y: 25 },
            // { room: 'W14N38', x: 25, y: 25 },
        ],
        avoidOwnedRooms: true,        // do not enter rooms owned by others
        signMessage: 'Glory to the machine! All my watts for the great coil!',
    },

    // Group 2 (Hall Monitor): highway-only patrol / exploration
    group2: {
        useCustomPath: false,          // if true, follow the path below in a loop
        customPathLoop: false,
        customPath: [
            //{ room: 'W15N40', x: 25, y: 25 },
            //{ room: 'W10N40', x: 25, y: 25 },
            //{ room: 'W10N30', x: 25, y: 25 },
            //{ room: 'W15N30', x: 25, y: 25 },
        ],
        signMessage: 'Glory to the machine! All my watts for the great coil!',
    },
};

const randomSay = (creep) => {
    const cycle = Game.time % 12;
    if (cycle === 0) creep.say('Glory', true);
    if (cycle === 1) creep.say('To the', true);
    if (cycle === 2) creep.say('Machine!', true);
    if (cycle === 3) creep.say('ALL OF MY', true);
    if (cycle === 4) creep.say('WATTS!', true);
    if (cycle === 5) creep.say('FOR THE', true);
    if (cycle === 6) creep.say('GREAT COIL!', true);
    if (cycle === 7) creep.say('WE MEAN', true);
    if (cycle === 8) creep.say('NO HARM!', true);
    if (cycle === 9) creep.say('DETH TO', true);
    if (cycle === 10) creep.say('INVADERS!', true);
    // ticks 11 & (wrap) are the silent pause
};

/* =========================
   Utilities
   ========================= */
const isHighway = (roomName) => {
    const m = roomName.match(/^([WE])(\d+)([NS])(\d+)$/);
    if (!m) return false;
    const x = parseInt(m[2], 10);
    const y = parseInt(m[4], 10);
    return (x % 10 === 0) || (y % 10 === 0);
};

const mineUsername = () => _.get(Game, 'shard.name') ? _.findKey(Game.rooms, r => r.controller && r.controller.my) : _.get(_.find(Game.rooms, r => r.controller && r.controller.my), 'controller.owner.username');

const isOwnedByOthers = (room) =>
    room.controller &&
    room.controller.owner &&
    !room.controller.my;

const isKeeperRoom = (room) =>
    room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_KEEPER_LAIR }).length > 0;

const hasHostiles = (room) =>
    room.find(FIND_HOSTILE_CREEPS).length > 0 ||
    room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_INVADER_CORE }).length > 0;

/** Record intel in Memory.intel[roomName] */
const recordIntel = (room) => {
    if (!Memory.intel) Memory.intel = {};
    const intel = Memory.intel[room.name] = Memory.intel[room.name] || {};

    intel.lastSeen = Game.time;

    // Ownership / reservation
    if (room.controller) {
        intel.controller = {
            level: room.controller.level || 0,
            owner: room.controller.owner ? room.controller.owner.username : null,
            reservation: room.controller.reservation ? room.controller.reservation.username : null,
            safeMode: room.controller.safeMode || 0,
        };
    } else {
        intel.controller = null;
    }

    // Exits
    intel.exits = Game.map.describeExits(room.name);

    // Sources & minerals
    const sources = room.find(FIND_SOURCES) || [];
    intel.sources = sources.map(s => s.id);

    const minerals = room.find(FIND_MINERALS) || [];
    intel.minerals = minerals.map(m => ({ id: m.id, type: m.mineralType }));

    // Deposits
    const deposits = room.find(FIND_DEPOSITS) || [];
    intel.deposits = deposits.map(d => ({ id: d.id, type: d.depositType }));

    // Portals & power banks
    const portals = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_PORTAL }) || [];
    intel.portals = portals.map(p => ({ id: p.id, x: p.pos.x, y: p.pos.y }));

    const pBanks = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_POWER_BANK }) || [];
    intel.powerBanks = pBanks.map(p => ({ id: p.id, hits: p.hits, decay: p.ticksToDecay }));

    // Threats
    intel.hostile = hasHostiles(room) || isKeeperRoom(room);
    intel.keeper = isKeeperRoom(room);
};

/** Prefer next room: unseen first, then stalest, with optional filters */
const pickNextRoom = (fromRoomName, opts = {}) => {
    const exits = Game.map.describeExits(fromRoomName);
    if (!exits) return null;

    const candidates = Object.values(exits); // list of neighbor room names
    const filtered = candidates.filter(rn => {
        if (opts.onlyHighways && !isHighway(rn)) return false;
        // Avoid known owned rooms (if desired). We only know if currently visible or in intel.
        if (opts.avoidOwnedRooms) {
            const intel = Memory.intel && Memory.intel[rn];
            if (intel && intel.controller && intel.controller.owner && intel.controller.owner !== mineUsername()) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) return null;

    // Sort by: (unseen first), then least recently seen
    filtered.sort((a, b) => {
        const ia = Memory.intel && Memory.intel[a] ? Memory.intel[a].lastSeen : -Infinity;
        const ib = Memory.intel && Memory.intel[b] ? Memory.intel[b].lastSeen : -Infinity;
        // Unseen has -Infinity, which is smaller => goes first
        return ia - ib;
    });

    return filtered[0];
};

/** Move with keeper avoidance using costCallback */
const moveSafelyTo = (creep, posOrTarget, range = 1) => {
    creep.moveTo(posOrTarget, {
        reusePath: 5,
        range,
        visualizePathStyle: { stroke: '#88f' },
        costCallback: (roomName, costMatrix) => {
            // Only adjust in visible rooms
            const room = Game.rooms[roomName];
            if (!room) return costMatrix;

            // Avoid Keeper lairs & creeps
            const lairs = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_KEEPER_LAIR });
            const keepers = room.find(FIND_HOSTILE_CREEPS, { filter: c => c.owner && c.owner.username === 'Source Keeper' });

            const avoidRadius = ScoutConfig.KEEPER_AVOID_RADIUS;
            const mark = (x, y, r) => {
                for (let dx = -r; dx <= r; dx++) {
                    for (let dy = -r; dy <= r; dy++) {
                        const xx = x + dx, yy = y + dy;
                        if (xx < 0 || yy < 0 || xx > 49 || yy > 49) continue;
                        const dist = Math.max(Math.abs(dx), Math.abs(dy));
                        if (dist <= r) {
                            costMatrix.set(xx, yy, 0xff); // essentially impassable
                        }
                    }
                }
            };

            lairs.forEach(l => mark(l.pos.x, l.pos.y, avoidRadius));
            keepers.forEach(k => mark(k.pos.x, k.pos.y, avoidRadius));

            // Also weight hostile ramparts/towers a bit (if visible)
            const hostileTowers = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_TOWER && s.owner && !s.my
            });
            hostileTowers.forEach(t => {
                // Soften (not fully blocked) to allow passing if necessary
                const r = 5;
                for (let dx = -r; dx <= r; dx++) {
                    for (let dy = -r; dy <= r; dy++) {
                        const xx = t.pos.x + dx, yy = t.pos.y + dy;
                        if (xx < 0 || yy < 0 || xx > 49 || yy > 49) continue;
                        const prev = costMatrix.get(xx, yy);
                        // bump cost high but not impassable
                        costMatrix.set(xx, yy, Math.min(0xfe, prev + 10));
                    }
                }
            });

            return costMatrix;
        }
    });
};

/** Follow a custom path (array of {room,x,y}); supports loop if desired */
const followCustomPath = (creep, path, loop = false) => {
    if (!path || path.length === 0) return false;

    if (creep.memory.scoutPathIndex === undefined) creep.memory.scoutPathIndex = 0;
    let idx = creep.memory.scoutPathIndex;
    const step = path[idx];

    if (!step) {
        if (loop) {
            creep.memory.scoutPathIndex = 0;
            return followCustomPath(creep, path, loop);
        } else {
            creep.memory.scoutPathIndex = undefined;
            return false;
        }
    }

    if (creep.pos.roomName === step.room && creep.pos.x === step.x && creep.pos.y === step.y) {
        creep.memory.scoutPathIndex = (idx + 1) % (loop ? path.length : path.length + 1);
        return true;
    }

    moveSafelyTo(creep, new RoomPosition(step.x, step.y, step.room), 0);
    return true;
};

/** Sign the controller if unowned and safe */
const signIfSafe = (creep, message) => {
    const room = creep.room;
    if (!room.controller) return;

    // Safe if no hostiles and not a keeper room
    if (hasHostiles(room) || isKeeperRoom(room)) return;

    if (!room.controller.owner || room.controller.my) {
        if (creep.pos.isNearTo(room.controller)) {
            if (!room.controller.sign || room.controller.sign.text !== message) {
                creep.signController(room.controller, message);
            }
        } else {
            moveSafelyTo(creep, room.controller, 1);
        }
    }
};

/** If we mistakenly enter a player-owned room (others), exit promptly */
const exitOwnedRoomIfNeeded = (creep) => {
    const room = creep.room;
    if (!isOwnedByOthers(room)) return false;

    // Find any exit that leads out (prefer highway if possible)
    const exits = Game.map.describeExits(room.name);
    if (!exits) return false;

    const dests = Object.values(exits);
    const highwayFirst = dests.sort((a, b) => (isHighway(b) ? 1 : 0) - (isHighway(a) ? 1 : 0));
    const targetRoom = highwayFirst[0];

    if (targetRoom) {
        const exitDir = Game.map.findExit(room.name, targetRoom);
        const pos = creep.pos.findClosestByRange(exitDir);
        if (pos) moveSafelyTo(creep, pos, 0);
        return true;
    }
    return false;
};

/** Move toward the next room (picked via pickNextRoom) */
const goToNextRoom = (creep, opts = {}) => {
    const from = creep.room.name;
    const next = pickNextRoom(from, opts);
    if (!next) return false;

    const exitDir = Game.map.findExit(from, next);
    if (exitDir < 0) return false;
    const pos = creep.pos.findClosestByRange(exitDir);
    if (!pos) return false;

    moveSafelyTo(creep, pos, 0);
    return true;
};

/* =========================
   MAIN ROLE
   ========================= */
const roleScout = {
    run(creep) {
        // Always say your chant
        randomSay(creep);

        const group = creep.memory.group || 1;

        // Record intel for the current room
        if (creep.room) {
            recordIntel(creep.room);
        }

        // If in someone else's room, leave politely
        if (exitOwnedRoomIfNeeded(creep)) return;

        if (group === 2) {
            return this.runHallMonitor(creep);
        } else {
            return this.runExplorer(creep);
        }
    },

    /* Group 1: Explorer */
    runExplorer(creep) {
        const cfg = ScoutConfig.group1;

        // If custom path is enabled, follow it
        if (cfg.useCustomPath && cfg.customPath && cfg.customPath.length > 0) {
            if (followCustomPath(creep, cfg.customPath, !!cfg.customPathLoop)) return;
        }

        // Sign if safe & unowned
        signIfSafe(creep, cfg.signMessage);

        // Pick the next room based on freshness (avoid owned rooms)
        if (!goToNextRoom(creep, {
            avoidOwnedRooms: cfg.avoidOwnedRooms,
        })) {
            // If no exits available (very rare), just meander to center
            moveSafelyTo(creep, new RoomPosition(25, 25, creep.room.name), 0);
        }
    },

    /* Group 2: Hall Monitor (highways only) */
    runHallMonitor(creep) {
        const cfg = ScoutConfig.group2;

        // Follow configured loop if toggled on
        if (cfg.useCustomPath && cfg.customPath && cfg.customPath.length > 0) {
            if (followCustomPath(creep, cfg.customPath, !!cfg.customPathLoop)) return;
        }

        // Ensure we stay in highway rooms; if not, steer to a highway
        if (!isHighway(creep.room.name)) {
            // Move toward any highway neighbor
            const exits = Game.map.describeExits(creep.room.name);
            if (exits) {
                const hwNeighbors = Object.values(exits).filter(isHighway);
                if (hwNeighbors.length > 0) {
                    const target = hwNeighbors[0];
                    const exitDir = Game.map.findExit(creep.room.name, target);
                    const pos = creep.pos.findClosestByRange(exitDir);
                    if (pos) {
                        moveSafelyTo(creep, pos, 0);
                        return;
                    }
                }
            }
        }

        // Sign if safe & unowned (even on highways)
        signIfSafe(creep, cfg.signMessage);

        // Continue along highway network; prefer unseen/stale highway neighbor
        if (!goToNextRoom(creep, {
            onlyHighways: true,
            avoidOwnedRooms: true,
        })) {
            moveSafelyTo(creep, new RoomPosition(25, 25, creep.room.name), 0);
        }
    },
};

module.exports = roleScout;