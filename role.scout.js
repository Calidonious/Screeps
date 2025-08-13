const avoidZones = () => {
    if (!Memory.scouting) Memory.scouting = {};
    if (!Memory.scouting.avoidRooms) Memory.scouting.avoidRooms = {};
    return Memory.scouting.avoidRooms;
};

const isInAvoidZone = (creep) => {
    const avoid = avoidZones();
    return avoid[creep.room.name] ? true : false;
};

const markRoomAsHostile = (creep) => {
    const avoid = avoidZones();
    if (!avoid[creep.room.name]) {
        avoid[creep.room.name] = [[creep.pos.x, creep.pos.y]];
        console.log(`[Scout] ${creep.name} marked ${creep.room.name} as hostile at (${creep.pos.x}, ${creep.pos.y})`);
        creep.say("⚠️ Hostiles!");
    }
};

const initScoutingMemory = () => {
    if (!Memory.scouting) Memory.scouting = {};
    if (!Memory.scouting.visitedRooms) Memory.scouting.visitedRooms = [];
    if (!Memory.scouting.avoidRooms) Memory.scouting.avoidRooms = {};
};

const updateGlobalVisitedRooms = (roomName) => {
    initScoutingMemory();
    if (!Memory.scouting.visitedRooms.includes(roomName)) {
        Memory.scouting.visitedRooms.push(roomName);
    }
};

const getNextRoomToScout = (creep) => {
    initScoutingMemory();
    const exits = Game.map.describeExits(creep.room.name);
    if (!creep.memory.exitsUsed) creep.memory.exitsUsed = {};
    const used = creep.memory.exitsUsed[creep.room.name] || [];
    const lastRoom = creep.memory.lastRoom;

    // Prefer unexplored exits not previously used
    for (const dir in exits) {
        const room = exits[dir];
        if (
            !used.includes(room) &&
            !Memory.scouting.visitedRooms.includes(room) &&
            !Memory.scouting.avoidRooms[room]
        ) {
            return room;
        }
    }

    // Then allow going to visited rooms not yet used from this room
    for (const dir in exits) {
        const room = exits[dir];
        if (
            !used.includes(room) &&
            !Memory.scouting.avoidRooms[room]
        ) {
            return room;
        }
    }

    // As a last resort, allow returning to the last room (loop breaker)
    for (const dir in exits) {
        const room = exits[dir];
        if (!Memory.scouting.avoidRooms[room]) {
            return room;
        }
    }

    return null;
};


const signController = (creep) => {
    const ctrl = creep.room.controller;
    if (ctrl && (!ctrl.sign || ctrl.sign.username !== creep.owner.username)) {
        if (creep.pos.inRangeTo(ctrl, 40)) {
            creep.signController(ctrl, "Glory to the machine! All my watts for the great coil!");
        } else {
            creep.moveTo(ctrl, { visualizePathStyle: { stroke: '#00ffff' } });
        }
    }
};

const logRoomInfo = (creep) => {
    if (!Memory.rooms) Memory.rooms = {}; // ← This line is required!
    const sources = creep.room.find(FIND_SOURCES).length;
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS).length;
    const controller = creep.room.controller;
    const controllerLevel = controller ? controller.level : "No controller";
    const roomOwner = (controller && controller.owner && controller.owner.username) || "Unclaimed";
    const minerals = creep.room.find(FIND_MINERALS);
    const mineralType = (minerals.length > 0 && minerals[0].mineralType) || "No minerals";

    Memory.rooms[creep.room.name] = {
        owner: roomOwner,
        sources,
        hostiles,
        controllerLevel,
        mineralType,
        lastScouted: Game.time
    };

    console.log(`[Scout] ${creep.name} scouted ${creep.room.name}`);
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
    
};

const explore = (creep) => {
    initScoutingMemory();

    // Detect hostile action (e.g., creep is injured)
    if (creep.hits < creep.hitsMax) {
        markRoomAsHostile(creep);
    }

    // Avoiding bad rooms
    if (isInAvoidZone(creep)) {
        const exits = Game.map.describeExits(creep.room.name);
        const fallbackRoom = Object.values(exits)[0];
        creep.moveTo(new RoomPosition(25, 25, fallbackRoom), { visualizePathStyle: { stroke: '#ff4444' } });
        return;
    }

    updateGlobalVisitedRooms(creep.room.name);
    logRoomInfo(creep);
    signController(creep);
    randomSay(creep);

    const targetRoom = getNextRoomToScout(creep);

    if (targetRoom) {
    const currentRoom = creep.room.name;
    if (!creep.memory.exitsUsed) creep.memory.exitsUsed = {};
    if (!creep.memory.exitsUsed[currentRoom]) {
        creep.memory.exitsUsed[currentRoom] = [];
    }

    // Record this exit
    if (!creep.memory.exitsUsed[currentRoom].includes(targetRoom)) {
        creep.memory.exitsUsed[currentRoom].push(targetRoom);
    }

    creep.memory.lastRoom = currentRoom;
    creep.moveTo(new RoomPosition(25, 25, targetRoom), {
        visualizePathStyle: { stroke: '#ffaa00' }
    });
    } else {
        const exits = Game.map.describeExits(creep.room.name);
        const rooms = Object.values(exits);
        const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
        creep.memory.lastRoom = creep.room.name;
        creep.moveTo(new RoomPosition(25, 25, randomRoom), {
            visualizePathStyle: { stroke: '#8888ff' }
        });
    }
};

const roleScout = {
    run: (creep) => {
        explore(creep);
    }
};

module.exports = roleScout;