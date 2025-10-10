// === Per-Room Configuration ===
const ROOM_CONFIGS = {
    'W14N37': {
        STORAGE_ID: '68c7922490f95e795dc1f70e',
        IDLE_POSITIONS: {
            1: [ { x: 8, y: 29 }, { x: 9, y: 29 }, { x: 10, y: 29 } ],
            2: [ { x: 14, y: 36 }, { x: 15, y: 36 } ],
            3: [ { x: 12, y: 30 }, { x: 11, y: 29 } ]
        }
    },
    'W15N37': {
        STORAGE_ID: '68c3b86cd6203efa74f701eb',
        IDLE_POSITIONS: {
            1: [ { x: 37, y: 44 }, { x: 38, y: 44 } ],
            2: [ { x: 39, y: 45 }, { x: 39, y: 44 } ],
            3: [ { x: 33, y: 46 }, { x: 32, y: 47 } ]
        }
    },
    'W13N39': {
        STORAGE_ID: '68a688e6d89b6f1cd82a4e03',
        IDLE_POSITIONS: {
            1: [ { x: 8, y: 24 }, { x: 9, y: 24 } ],
            2: [ { x: 8, y: 24 }, { x: 9, y: 24 } ],
            3: [ { x: 19, y: 17 }, { x: 20, y: 17 } ]
        }
    },
    'W13N33': {
        STORAGE_ID: '68cf7e69214ab9925ea67037',
        IDLE_POSITIONS: {
            1: [ { x: 5, y: 13 }, { x: 6, y: 13 } ],
            2: [ { x: 6, y: 13 }, { x: 5, y: 13 } ],
            3: [ { x: 11, y: 41 } ]
        }
    },
    'W23N34': {
        STORAGE_ID: '68df0b30a4f59bce4d154ff6',
        IDLE_POSITIONS: {
            1: [ { x: 10, y: 27 }, { x: 10, y: 28 } ],
            2: [ { x: 10, y: 27 }, { x: 10, y: 28 } ],
            3: [ { x: 11, y: 41 } ]
        }
    },
};

const RENEW_THRESHOLD = 800;

// === Renewal Helpers ===
function isWounded(creep) { return creep.hits < creep.hitsMax / 2; }
function shouldStartRenewing(creep) { return creep.ticksToLive < 200 && !creep.memory.renewing; }
function shouldContinueRenewing(creep) { return creep.memory.renewing && creep.ticksToLive < RENEW_THRESHOLD; }
function startRenewing(creep) { creep.memory.renewing = true; }
function stopRenewing(creep) { creep.memory.renewing = false; }
function renewCreep(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) creep.moveTo(spawn);
        creep.say('⏳');
    }
}
function moveToSpawn(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) { creep.moveTo(spawn); return true; }
    return false;
}

// === Idle Position Helpers ===
function assignIdlePos(creep, roomConfig) {
    if (!creep.memory.idlePos) {
        const idlePositions = roomConfig.IDLE_POSITIONS[creep.memory.group];
        if (idlePositions && idlePositions.length) {
            const idx = creep.name.charCodeAt(creep.name.length - 1) % idlePositions.length;
            creep.memory.idlePos = idlePositions[idx];
        }
    }
    return creep.memory.idlePos;
}
function moveToIdle(creep, roomName, roomConfig) {
    const idlePos = assignIdlePos(creep, roomConfig);
    if (idlePos) creep.moveTo(new RoomPosition(idlePos.x, idlePos.y, roomName));
}

// === Job Assignment Helpers ===
function claimJob(creep, structures, sticky = true, preferClosest = false) {
    if (!Memory.transporterJobs) Memory.transporterJobs = {};

    // Cleanup stale jobs
    for (let id in Memory.transporterJobs) {
        if (!Game.creeps[Memory.transporterJobs[id]]) delete Memory.transporterJobs[id];
    }

    // Keep current job if still valid
    if (sticky && creep.memory.jobId) {
        const target = Game.getObjectById(creep.memory.jobId);
        if (target && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            return target;
        }
        // Release if invalid
        delete Memory.transporterJobs[creep.memory.jobId];
        creep.memory.jobId = null;
    }

    // Optionally pick closest job
    let chosen;
    if (preferClosest && structures.length > 0) {
        chosen = creep.pos.findClosestByPath(structures, {
            filter: s => !Memory.transporterJobs[s.id]
        });
    } else {
        chosen = structures.find(s => !Memory.transporterJobs[s.id]);
    }

    if (chosen) {
        Memory.transporterJobs[chosen.id] = creep.name;
        creep.memory.jobId = chosen.id;
        return chosen;
    }

    return null;
}

const TOWER_THRESHOLD = 900; // Towers below this are prioritized

const roleTransporter = {
    run(creep) {
        const roomName = creep.room.name;
        const roomConfig = ROOM_CONFIGS[roomName];
        if (!roomConfig) return;

        const storage = Game.getObjectById(roomConfig.STORAGE_ID);

        // --- Renewal ---
        if (isWounded(creep)) { if (moveToSpawn(creep)) return; }
        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) { renewCreep(creep); return; }
        else if (creep.memory.renewing) stopRenewing(creep);

        // --- Mode switching ---
        if (creep.memory.delivering && creep.store[RESOURCE_ENERGY] === 0) creep.memory.delivering = false;
        if (!creep.memory.delivering && creep.store.getFreeCapacity() === 0) creep.memory.delivering = true;

        if (creep.memory.delivering) {
            let structureTypes;
            switch (creep.memory.group) {
                case 1: structureTypes = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER]; break;
                case 2: structureTypes = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION]; break;
                case 3: structureTypes = [STRUCTURE_TOWER]; break;
                default: return;
            }

            let needing = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s =>
                    structureTypes.includes(s.structureType) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            // --- Group 3: special tower logic ---
            if (creep.memory.group === 3) {
                needing = needing.filter(t => t.store[RESOURCE_ENERGY] < TOWER_THRESHOLD);
                if (needing.length > 0) {
                    needing = _.sortBy(needing, s => s.store[RESOURCE_ENERGY]); // fill emptiest tower first
                    const target = claimJob(creep, needing, true, false);
                    if (target) {
                        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target,{ visualizePathStyle: { stroke: '#ffffff' } });
                        return;
                    }
                }
            } else {
                // --- Groups 1 & 2: prioritize spawn, then closest extension ---
                const spawns = needing.filter(s => s.structureType === STRUCTURE_SPAWN);
                if (spawns.length > 0) {
                    const target = claimJob(creep, spawns, true, true);
                    if (target) {
                        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target,{ visualizePathStyle: { stroke: '#ffffff' } });
                        return;
                    }
                }

                const extensions = needing.filter(s => s.structureType === STRUCTURE_EXTENSION);
                if (extensions.length > 0) {
                    const target = claimJob(creep, extensions, true, true);
                    if (target) {
                        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        return;
                    }
                }

                // Fallback: other allowed types
                const others = needing.filter(s => ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(s.structureType));
                if (others.length > 0) {
                    const target = claimJob(creep, others, true, true);
                    if (target) {
                        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        return;
                    }
                }
            }

            // --- Idle ---
            creep.say('📭');
            moveToIdle(creep, roomName, roomConfig);
            

        } else {
            // --- Collecting ---
            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
};

module.exports = roleTransporter;