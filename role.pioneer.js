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
    // Config per group
    config: {
        1: { // Builders
            sourceId: "5bbcac249099fc012e63505b", // leave blank for closest
            storageId: "", // optional: withdraw from storage if defined
            idle: { x: 9, y: 24 }
        },
        2: { // Upgraders
            sourceId: "5bbcac249099fc012e63505b",
            storageId: "", // optional: withdraw from storage if defined
            idle: { x: 8, y: 24 }
        },
        3: { // Fillers
            sourceId: "5bbcac249099fc012e63505a",
            storageId: "68a688e6d89b6f1cd82a4e03", // optional: withdraw from storage if defined
            idle: { x: 8, y: 24 }
        },
        4: { // Harvesters → Storage
            sourceId: "5bbcac249099fc012e63505b", // must be defined
            storageId: "68a688e6d89b6f1cd82a4e03", // must be defined
            idle: { x: 6, y: 24 }
        }
    },

    run: function (creep) {
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
        const groupCfg = this.config[group] || {};

        // Pathing
        const path = [
            { room: 'W14N38', x: 22, y: 22 },
            { room: 'W14N39', x: 29, y: 28 },
            { room: 'W13N39', x: 31, y: 34 },
            { room: targetRoom, x: 31, y: 34 }
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

        // Working toggle
        if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) creep.memory.working = false;
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) creep.memory.working = true;

        // === Group 4: Harvester → Storage ===
        if (group === 4) {
            if (!creep.memory.working) {
                this.harvest(creep, groupCfg);
            } else {
                const storage = Game.getObjectById(groupCfg.storageId);
                if (storage && creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else if (!storage && groupCfg.idle) {
                    creep.moveTo(new RoomPosition(groupCfg.idle.x, groupCfg.idle.y, creep.room.name));
                }
            }
            return;
        }

        // === Group 2: Upgrader ===
        if (group === 2) {
            if (!creep.memory.working) {
                this.collectEnergy(creep, groupCfg);
            } else {
                const ctrl = creep.room.controller;
                if (ctrl && creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(ctrl, { visualizePathStyle: { stroke: '#00ffcc' } });
                }
            }
            return;
        }

        // === Group 3: Filler ===
        if (group === 3) {
            if (!creep.memory.working) {
                this.collectEnergy(creep, groupCfg);
            } else {
                const fillTarget = this.findFillTarget(creep, groupCfg);
                if (fillTarget && creep.transfer(fillTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(fillTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else if (!fillTarget && groupCfg.idle) {
                    creep.moveTo(new RoomPosition(groupCfg.idle.x, groupCfg.idle.y, creep.room.name));
                }
            }
            return;
        }

        // === Group 1: Builder ===
        if (!creep.memory.working) {
            this.collectEnergy(creep, groupCfg);
            return;
        }

        const site = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if (site) {
            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                creep.moveTo(site, { visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }

        const fillTarget = this.findFillTarget(creep, groupCfg);
        if (fillTarget && creep.transfer(fillTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(fillTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        const repairTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
        });
        if (repairTarget && creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
            creep.moveTo(repairTarget, { visualizePathStyle: { stroke: '#9999ff' } });
            return;
        }

        if (groupCfg.idle) {
            creep.moveTo(new RoomPosition(groupCfg.idle.x, groupCfg.idle.y, creep.room.name));
        }
    },

    // --- Helpers ---
    harvest: function (creep, groupCfg) {
        let src = null;
        if (groupCfg.sourceId) {
            src = Game.getObjectById(groupCfg.sourceId);
        }
        if (!src) {
            src = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        }
        if (src && creep.harvest(src) === ERR_NOT_IN_RANGE) {
            creep.moveTo(src, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    },

    collectEnergy: function (creep, groupCfg) {
        if (groupCfg.storageId) {
            const storage = Game.getObjectById(groupCfg.storageId);
            if (storage && creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            this.harvest(creep, groupCfg);
        }
    },

    findFillTarget: function (creep, groupCfg) {
        let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_SPAWN ||
                 s.structureType === STRUCTURE_EXTENSION) &&
                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });

        if (!target) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s =>
                    s.structureType === STRUCTURE_TOWER &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
        }

        if (!target && !groupCfg.storageId) {
            target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: s =>
                    s.structureType === STRUCTURE_STORAGE &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
        }

        return target;
    }
};

module.exports = rolePioneer;