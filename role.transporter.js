const RENEW_THRESHOLD = 800; // Minimum desired life span after renewal

// === Per-Room Configuration ===
const ROOM_CONFIGS = {
    'W14N37': {
        STORAGE_ID: '688d5a468b99246abd95096f',
        IDLE_POSITIONS: {
            1: [ { x: 8, y: 29 }, { x: 9, y: 29 }, { x: 10, y: 29 } ],
            2: [ { x: 14, y: 36 }, { x: 15, y: 36 } ],
            3: [ { x: 12, y: 30 }, { x: 11, y: 29 } ]
        }
    },
    'W15N37': {
        STORAGE_ID: '689593f14c3ddc337079485d',
        IDLE_POSITIONS: {
            1: [ { x: 37, y: 44 }, { x: 38, y: 44 } ],
            2: [ { x: 39, y: 43 }, { x: 39, y: 44 } ],
            3: [ { x: 33, y: 46 }, { x: 32, y: 47 } ]
        }
    },
    'W13N39': {
        STORAGE_ID: '68a688e6d89b6f1cd82a4e03',
        IDLE_POSITIONS: {
            1: [ { x: 8, y: 24 }, { x: 9, y: 24 } ],
            2: [ { x: 9, y: 24 }, { x: 10, y: 24 } ],
            3: [ { x: 19, y: 17 }, { x: 20, y: 17 } ]
        }
    },
};

function isWounded(creep) {
    return creep.hits < creep.hitsMax / 2;
}

function shouldStartRenewing(creep) {
    return creep.ticksToLive < 200 && !creep.memory.renewing;
}

function shouldContinueRenewing(creep) {
    return creep.memory.renewing && creep.ticksToLive < RENEW_THRESHOLD;
}

function stopRenewing(creep) {
    creep.memory.renewing = false;
}

function startRenewing(creep) {
    creep.memory.renewing = true;
}

function renewCreep(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('⏳');
    }
}

function moveToSpawn(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        return true;
    }
    return false;
}

// Pick an idle position from a list based on creep name (to spread out)
function pickIdlePosition(idlePositions, creep) {
    if (!idlePositions || idlePositions.length === 0) return null;
    const idx = creep.name.charCodeAt(creep.name.length - 1) % idlePositions.length;
    return idlePositions[idx];
}

var roleTransporter = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const roomName = creep.room.name;
        const roomConfig = ROOM_CONFIGS[roomName];

        if (!roomConfig || !roomConfig.STORAGE_ID || !roomConfig.IDLE_POSITIONS) {
            creep.say('❌Config');
            return;
        }

        const storage = Game.getObjectById(roomConfig.STORAGE_ID);
        const idlePositions = roomConfig.IDLE_POSITIONS[creep.memory.group];

        // Healing
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        // Renewal logic
        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) {
            stopRenewing(creep);
        }

        // === Mode Switching ===
        if (creep.memory.delivering && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.delivering = false;
            creep.say('🫴');
        }
        if (!creep.memory.delivering && creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            creep.say('⚡');
        }

        // === Delivering ===
        if (creep.memory.delivering) {
            let structureTypes = [];

            switch (creep.memory.group) {
                case 1:
                    structureTypes = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER];
                    break;
                case 2:
                    structureTypes = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION];
                    break;
                case 3:
                    structureTypes = [STRUCTURE_TOWER];
                    break;
                default:
                    creep.say('❓Group');
                    return;
            }

            if (creep.memory.group === 3) {
                // === Special Group 3: Tower Logic with Sticky Assignment ===
                let targetTower = Game.getObjectById(creep.memory.assignedTower);

                if (!targetTower || targetTower.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                    delete creep.memory.assignedTower;
                    const towers = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType === STRUCTURE_TOWER &&
                                     s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    });

                    if (towers.length > 0) {
                        towers.sort((a, b) => a.store[RESOURCE_ENERGY] - b.store[RESOURCE_ENERGY]);
                        const idx = creep.name.charCodeAt(creep.name.length - 1) % towers.length;
                        targetTower = towers[idx];
                        creep.memory.assignedTower = targetTower.id;
                    }
                }

                if (targetTower) {
                    if (creep.transfer(targetTower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(targetTower, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    // Idle if no towers need energy
                    if (idlePositions) {
                        const chosen = pickIdlePosition(idlePositions, creep);
                        if (chosen) {
                            creep.moveTo(new RoomPosition(chosen.x, chosen.y, roomName));
                            creep.say('📭');
                        }
                    }
                }
                return;
            }

            // === Default Logic for Groups 1 & 2 ===
            const spawnsNeeding = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => structureTypes.includes(s.structureType) &&
                             s.structureType === STRUCTURE_SPAWN &&
                             s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (spawnsNeeding.length > 0) {
                const closestSpawn = creep.pos.findClosestByPath(spawnsNeeding);
                if (creep.transfer(closestSpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestSpawn, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }

            const extensionsNeeding = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => structureTypes.includes(s.structureType) &&
                             s.structureType === STRUCTURE_EXTENSION &&
                             s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (extensionsNeeding.length > 0) {
                const closestExt = creep.pos.findClosestByPath(extensionsNeeding);
                if (creep.transfer(closestExt, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestExt, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }

            const otherTargets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => structureTypes.includes(s.structureType) &&
                             ![STRUCTURE_SPAWN, STRUCTURE_EXTENSION].includes(s.structureType) &&
                             s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (otherTargets.length > 0) {
                const closestOther = creep.pos.findClosestByPath(otherTargets);
                if (creep.transfer(closestOther, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(closestOther, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }

            // Idle
            if (idlePositions) {
                const chosen = pickIdlePosition(idlePositions, creep);
                if (chosen) {
                    creep.moveTo(new RoomPosition(chosen.x, chosen.y, roomName));
                    creep.say('📭');
                }
            }

        } else {
            // === Collecting Mode ===
            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                    creep.say('🫴');
                }
            } else {
                creep.say('❌NoStorage');
            }
        }
    }
};

module.exports = roleTransporter;