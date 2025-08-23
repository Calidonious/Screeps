const ScoutConfig = {
    STALE_AFTER: 15000,
    KEEPER_AVOID_RADIUS: 9,

    // Group 1 (Explorer): broad exploration
    group1: {
        useCustomPath: false,
        customPathLoop: false,
        customPath: [],
        avoidOwnedRooms: true,
        signMessage: 'Glory to the machine! Destroy Invaders!',
    },

    // Group 2 (Hall Monitor): highway-only patrol / exploration
    group2: {
        useCustomPath: false,
        customPathLoop: false,
        customPath: [],
        signMessage: 'Glory to the machine! Destroy Invaders!',
    },
};

const randomSay = (creep) => {
    const cycle = Game.time % 12;
    if (cycle === 0) creep.say('Glory', true);
    if (cycle === 1) creep.say('to the', true);
    if (cycle === 2) creep.say('Machine!', true);
    if (cycle === 3) creep.say('ALL MY', true);
    if (cycle === 4) creep.say('WATTS!', true);
    if (cycle === 5) creep.say('FOR THE', true);
    if (cycle === 6) creep.say('GREAT COIL!', true);
    if (cycle === 7) creep.say('WE MEAN', true);
    if (cycle === 8) creep.say('NO HARM!', true);
    if (cycle === 9) creep.say('DETH TO', true);
    if (cycle === 10) creep.say('INVADERS!', true);
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

const mineUsername = () =>
    _.get(Game, 'shard.name')
        ? _.findKey(Game.rooms, r => r.controller && r.controller.my)
        : _.get(_.find(Game.rooms, r => r.controller && r.controller.my), 'controller.owner.username');

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
    const prevIntel = Memory.intel[room.name];
    const intel = Memory.intel[room.name] = Memory.intel[room.name] || {};

    const firstSeen = !prevIntel || (Game.time - (prevIntel.lastSeen || 0)) > ScoutConfig.STALE_AFTER;

    intel.lastSeen = Game.time;

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

    intel.exits = Game.map.describeExits(room.name);

    const sources = room.find(FIND_SOURCES) || [];
    intel.sources = sources.map(s => s.id);

    const minerals = room.find(FIND_MINERALS) || [];
    intel.minerals = minerals.map(m => ({ id: m.id, type: m.mineralType }));

    const deposits = room.find(FIND_DEPOSITS) || [];
    intel.deposits = deposits.map(d => ({ id: d.id, type: d.depositType }));

    const portals = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_PORTAL }) || [];
    intel.portals = portals.map(p => ({ id: p.id, x: p.pos.x, y: p.pos.y }));

    const pBanks = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_POWER_BANK }) || [];
    intel.powerBanks = pBanks.map(p => ({ id: p.id, hits: p.hits, decay: p.ticksToDecay }));

    intel.hostile = hasHostiles(room) || isKeeperRoom(room);
    intel.keeper = isKeeperRoom(room);

};

/** Early hostile detection (before entering further) */
const detectAndExitHostile = (creep) => {
    const room = creep.room;
    if (!room.controller) return false;

    const towers = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER && s.owner && !s.my });
    if ((room.controller.owner && !room.controller.my) || towers.length > 0) {
        // Log hostile intel
        recordIntel(room);
        if (!Memory.intel[room.name]) Memory.intel[room.name] = {};
        Memory.intel[room.name].hostile = true;
        Memory.intel[room.name].controller = Memory.intel[room.name].controller || {};
        Memory.intel[room.name].controller.owner = room.controller.owner ? room.controller.owner.username : "unknown";

        creep.say("🚫 Hostile", true);

        // Back out to last room
        const last = creep.memory.lastRoom;
        if (last) {
            const exitDir = Game.map.findExit(room.name, last);
            const pos = creep.pos.findClosestByRange(exitDir);
            if (pos) creep.moveTo(pos, { visualizePathStyle: { stroke: "#ff0000" } });
        }
        return true;
    }
    return false;
};

/** Move with keeper avoidance using costCallback */
const moveSafelyTo = (creep, posOrTarget, range = 1) => {
    creep.moveTo(posOrTarget, {
        reusePath: 5,
        range,
        visualizePathStyle: { stroke: '#88f' },
        costCallback: (roomName, costMatrix) => {
            const room = Game.rooms[roomName];
            if (!room) return costMatrix;

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
                            costMatrix.set(xx, yy, 0xff);
                        }
                    }
                }
            };

            lairs.forEach(l => mark(l.pos.x, l.pos.y, avoidRadius));
            keepers.forEach(k => mark(k.pos.x, k.pos.y, avoidRadius));

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
    if (!room.controller) return false;
    if (hasHostiles(room) || isKeeperRoom(room)) return false;

    if (!room.controller.owner || room.controller.my) {
        const alreadySigned = room.controller.sign &&
            room.controller.sign.username === creep.owner.username &&
            room.controller.sign.text === message;

        if (alreadySigned) return false;

        if (creep.pos.isNearTo(room.controller)) {
            creep.signController(room.controller, message);
            return false;
        } else {
            moveSafelyTo(creep, room.controller, 1);
            return true;
        }
    }
    return false;
};

/** If we mistakenly enter a player-owned room, exit promptly */
const exitOwnedRoomIfNeeded = (creep) => {
    const room = creep.room;
    if (!isOwnedByOthers(room)) return false;

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
const pickNextRoom = (fromRoomName, opts = {}) => {
    const exits = Game.map.describeExits(fromRoomName);
    if (!exits) return null;

    const candidates = Object.values(exits);
    const filtered = candidates.filter(rn => {
        if (opts.onlyHighways && !isHighway(rn)) return false;
        if (opts.avoidOwnedRooms) {
            const intel = Memory.intel && Memory.intel[rn];
            if (intel && intel.controller && intel.controller.owner && intel.controller.owner !== mineUsername()) {
                return false;
            }
        }
        return true;
    });

    if (filtered.length === 0) return null;

    filtered.sort((a, b) => {
        const ia = Memory.intel && Memory.intel[a] ? Memory.intel[a].lastSeen : -Infinity;
        const ib = Memory.intel && Memory.intel[b] ? Memory.intel[b].lastSeen : -Infinity;
        return ia - ib;
    });

    return filtered[0];
};

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
        randomSay(creep);

        if (creep.memory.lastRoom !== creep.room.name) {
            creep.memory.lastRoom = creep.room.name;
            let msg = `📝 Report ${creep.name} is in ${creep.room.name}`;
            const deposits = creep.room.find(FIND_DEPOSITS);
            if (deposits.length > 0) {
                const types = deposits.map(d => d.depositType).join(", ");
                msg += ` | Deposits: ${types}`;
            }
            console.log(msg);
        }

        if (creep.room) {
            recordIntel(creep.room);
        }

        if (detectAndExitHostile(creep)) return;
        if (exitOwnedRoomIfNeeded(creep)) return;

        if (creep.memory.group === 2) {
            return this.runHallMonitor(creep);
        } else {
            return this.runExplorer(creep);
        }
    },

    runExplorer(creep) {
        const cfg = ScoutConfig.group1;
        if (signIfSafe(creep, cfg.signMessage)) return;
        if (cfg.useCustomPath && cfg.customPath.length > 0) {
            if (followCustomPath(creep, cfg.customPath, !!cfg.customPathLoop)) return;
        }
        if (!goToNextRoom(creep, { avoidOwnedRooms: cfg.avoidOwnedRooms })) {
            moveSafelyTo(creep, new RoomPosition(25, 25, creep.room.name), 0);
        }
    },

    runHallMonitor(creep) {
        const cfg = ScoutConfig.group2;
        if (signIfSafe(creep, cfg.signMessage)) return;
        if (cfg.useCustomPath && cfg.customPath.length > 0) {
            if (followCustomPath(creep, cfg.customPath, !!cfg.customPathLoop)) return;
        }
        if (!isHighway(creep.room.name)) {
            const exits = Game.map.describeExits(creep.room.name);
            if (exits) {
                const hwNeighbors = Object.values(exits).filter(isHighway);
                if (hwNeighbors.length > 0) {
                    const exitDir = Game.map.findExit(creep.room.name, hwNeighbors[0]);
                    const pos = creep.pos.findClosestByRange(exitDir);
                    if (pos) {
                        moveSafelyTo(creep, pos, 0);
                        return;
                    }
                }
            }
        }
        if (!goToNextRoom(creep, { onlyHighways: true, avoidOwnedRooms: true })) {
            moveSafelyTo(creep, new RoomPosition(25, 25, creep.room.name), 0);
        }
    },
};

module.exports = roleScout;