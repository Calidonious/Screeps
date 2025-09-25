const RENEW_THRESHOLD = 800;

function isWounded(creep) {
    return creep.hits < creep.hitsMax / 2;
}
function shouldStartRenewing(creep) {
    return creep.ticksToLive < 150 && !creep.memory.renewing;
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
            sourceId: "5bbcac249099fc012e635070", // leave blank for closest
            storageId: "68cf7e69214ab9925ea67037", // optional: withdraw from storage if defined
            idle: { x: 2, y: 17 }
        },
        2: { // Upgraders
            sourceId: "5bbcac249099fc012e635070",
            storageId: "", // optional: withdraw from storage if defined
            idle: { x: 6, y: 46 }
        },
        3: { // Fillers
            sourceId: "5bbcac249099fc012e63506f",
            storageId: "68cf7e69214ab9925ea67037", // optional: withdraw from storage if defined
            idle: { x: 5, y: 13 }
        },
        4: { // Harvesters → Storage
            sourceId: "5bbcac249099fc012e635070", // must be defined
            storageId: "68cf7e69214ab9925ea67037", // must be defined
            idle: { x: 4, y: 37 }
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
            { room: 'W13N37', x: 37, y: 46 },
            { room: 'W13N36', x: 44, y: 40 },
            { room: 'W12N36', x: 31, y: 46 },
            { room: 'W12N35', x: 27, y: 27 },
            { room: 'W12N35', x: 18, y: 36 },
            { room: 'W12N34', x: 20, y: 26 },
            { room: 'W12N34', x: 22, y: 48 },
            { room: 'W12N33', x: 2, y: 10 },
            { room: targetRoom, x: 7, y: 17 }
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
            return
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

        //if (!target) {
        //    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        //        filter: s =>
        //            s.structureType === STRUCTURE_TOWER &&
        //            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        //    });
        //}

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