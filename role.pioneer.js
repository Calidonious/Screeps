const RENEW_THRESHOLD = 500; // Minimum desired life span after renewal

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

var rolePioneer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // Healing (optional)
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        // Renewal logic
        if (shouldStartRenewing(creep)) {
            startRenewing(creep);
        }

        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) {
            stopRenewing(creep);
        }
        const targetRoom = creep.memory.targetRoom;
        const group = creep.memory.group || 1;

        // === Custom Path ===
        const path = [
            { room: 'W14N36', x: 20, y: 10 },
            { room: 'W14N36', x: 1, y: 36 },
            { room: 'W15N36', x: 40, y: 11 },
            { room: 'W15N36', x: 26, y: 1 },
            { room: targetRoom, x: 22, y: 45 }
        ];

        if (creep.memory.pathIndex === undefined) creep.memory.pathIndex = 0;

        if (creep.room.name !== targetRoom) {
            const step = path[creep.memory.pathIndex];
            if (creep.pos.roomName === step.room && creep.pos.x === step.x && creep.pos.y === step.y) {
                creep.memory.pathIndex++;
            } else {
                creep.moveTo(new RoomPosition(step.x, step.y, step.room), {
                    visualizePathStyle: { stroke: '#ffffff' }
                });
            }
            return;
        }

        // === In Target Room ===
        creep.memory.pathIndex = undefined;

        // === Working state machine ===
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('⚡ work');
        }

        // === Group 2: Upgrader ===
        if (group === 2) {
            if (!creep.memory.working) {
                const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (source) {
                    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
                return;
            } else {
                const controller = creep.room.controller;
                if (controller) {
                    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(controller, { visualizePathStyle: { stroke: '#00ffcc' } });
                    }
                }
                return;
            }
        }

        // === Group 1: Builder/Support ===
        if (!creep.memory.working) {
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source) {
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
            return;
        }

        // 1️⃣ Build anything
        const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }

        // 2️⃣ Fill spawn/extensions/towers
        const targets = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_EXTENSION ||
                 s.structureType === STRUCTURE_TOWER) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (targets) {
            if (creep.transfer(targets, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targets, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // 3️⃣ Fill storage if nothing else
        const storage = creep.room.storage;
        if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#cccc00' } });
            }
            return;
        }

        // 4️⃣ Repair any damaged structure (excluding walls/ramparts)
        const repairTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                s.hits < s.hitsMax &&
                s.structureType !== STRUCTURE_WALL 
                && s.structureType !== STRUCTURE_RAMPART
        });

        if (repairTarget) {
            if (creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
                creep.moveTo(repairTarget, { visualizePathStyle: { stroke: '#9999ff' } });
            }
            return;
        }

        // 5️⃣ Idle at controller
        const controller = creep.room.controller;
        if (controller) {
            creep.say('📭'); // ❌ source
            creep.moveTo(32,47);
        }
    }
};

module.exports = rolePioneer;