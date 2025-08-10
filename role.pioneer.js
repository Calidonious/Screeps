const RENEW_THRESHOLD = 500;

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
    run: function(creep) {
        // Healing
        if (isWounded(creep)) {
            if (moveToSpawn(creep)) return;
        }

        // Renewal
        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) {
            stopRenewing(creep);
        }

        const targetRoom = creep.memory.targetRoom;
        const group = creep.memory.group || 1;

        // Path to target
        const path = [
            { room: 'W14N36', x: 20, y: 10 },
            { room: 'W14N36', x: 1, y: 36 },
            { room: 'W15N36', x: 44, y: 15 },
            { room: 'W15N36', x: 27, y: 2 },
            { room: targetRoom, x: 25, y: 45 }
        ];
        if (creep.memory.pathIndex === undefined) creep.memory.pathIndex = 0;
        if (creep.room.name !== targetRoom) {
            const step = path[creep.memory.pathIndex];
            if (creep.pos.roomName === step.room && creep.pos.x === step.x && creep.pos.y === step.y) {
                creep.memory.pathIndex++;
            } else {
                creep.moveTo(new RoomPosition(step.x, step.y, step.room), { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }
        creep.memory.pathIndex = undefined;

        // Working state toggle
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
        }
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
        }

        // === Group 2: Upgrader ===
        if (group === 2) {
            if (!creep.memory.working) {
                const src = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (src && creep.harvest(src) === ERR_NOT_IN_RANGE) creep.moveTo(src, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else {
                const ctrl = creep.room.controller;
                if (ctrl && creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) creep.moveTo(ctrl, { visualizePathStyle: { stroke: '#00ffcc' } });
            }
            return;
        }

        // === Group 3: Filler Only ===
        if (group === 3) {
            if (!creep.memory.working) {
                const src = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
                if (src && creep.harvest(src) === ERR_NOT_IN_RANGE) creep.moveTo(src, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else {
                const fillTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: s =>
                        (s.structureType === STRUCTURE_SPAWN ||
                         s.structureType === STRUCTURE_EXTENSION ||
                         s.structureType === STRUCTURE_TOWER ||
                         s.structureType === STRUCTURE_STORAGE) &&
                        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                });
                if (fillTarget && creep.transfer(fillTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(fillTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
            return;
        }

        // === Group 1: Builders (different site per creep if possible) ===
        if (!creep.memory.working) {
            const src = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (src && creep.harvest(src) === ERR_NOT_IN_RANGE) creep.moveTo(src, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // ️Build — Assign unique site if available
        const allSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (allSites.length) {
            if (!creep.memory.buildTargetId || !Game.getObjectById(creep.memory.buildTargetId)) {
                // Pick site with fewest assigned creeps
                const siteAssignments = {};
                for (let cName in Game.creeps) {
                    const c = Game.creeps[cName];
                    if (c.memory.buildTargetId) siteAssignments[c.memory.buildTargetId] = (siteAssignments[c.memory.buildTargetId] || 0) + 1;
                }
                allSites.sort((a, b) => (siteAssignments[a.id] || 0) - (siteAssignments[b.id] || 0));
                creep.memory.buildTargetId = allSites[0].id;
            }
            const site = Game.getObjectById(creep.memory.buildTargetId);
            if (site && creep.build(site) === ERR_NOT_IN_RANGE) creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' } });
            return;
        }

        // Fill
        const fillTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_EXTENSION ||
                 s.structureType === STRUCTURE_TOWER) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (fillTarget && creep.transfer(fillTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(fillTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        // Repair
        const repairTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
        });
        if (repairTarget && creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
            creep.moveTo(repairTarget, { visualizePathStyle: { stroke: '#9999ff' } });
            return;
        }
    }
};

module.exports = rolePioneer;