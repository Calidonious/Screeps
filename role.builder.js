function fillEnergy(creep, asBuilder) {
    if (asBuilder) {
        // Builder-style fill: use containers, storage, etc.
        let source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (s) =>
                (s.structureType == STRUCTURE_STORAGE) &&
                s.store[RESOURCE_ENERGY] > 0
        });

        if (source) {
            if (creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            creep.say('❌ No supply');
        }

    } else {
        // Harvester-style fill: ONLY harvest natural energy
        let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if (source) {
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            creep.say('❌ No source');
        }
    }
}

function doBuild(creep) {
    let targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (targets.length > 0) {
        if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return true;
    }
    return false;
}

function doRepair(creep) {
    let targets = creep.room.find(FIND_STRUCTURES, {
        filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
    });
    if (targets.length > 0) {
        targets.sort((a, b) => a.hits - b.hits);
        if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('🛠️ Repair');
        }
        return true;
    }
    return false;
}

function depositEnergy(creep) {
    let targets = creep.room.find(FIND_STRUCTURES, {
        filter: s =>
            (s.structureType == STRUCTURE_SPAWN ||
             s.structureType == STRUCTURE_EXTENSION ||
             s.structureType == STRUCTURE_TOWER ||
             s.structureType == STRUCTURE_STORAGE ||
             s.structureType == STRUCTURE_CONTAINER) &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('📦 Store');
        }
    }
}

var roleBuilder = {
    run: function (creep) {
        // Retreat if injured or about to expire
        if (creep.hits < creep.hitsMax / 2 || creep.ticksToLive < 200) {
            let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('🏥');
                return;
            }
        }

        // State switch: full => working, empty => collecting
        if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
            creep.memory.working = true;
            creep.say('🚧');
        } else if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.working = false;
            creep.say('🔄');
        }

        // Behavior
        if (creep.memory.working) {
            if (!doBuild(creep)) {
                if (!doRepair(creep)) {
                    // Act like harvester
                    depositEnergy(creep);
                }
            }
        } else {
            // Fill logic depends on whether it's working
            // If it's going to build/repair: use containers/storage
            // If it's only going to harvest and deposit: use natural sources only
            let isBuilderMode = creep.room.find(FIND_CONSTRUCTION_SITES).length > 0 ||
                                creep.room.find(FIND_STRUCTURES, {
                                    filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
                                }).length > 0;
            fillEnergy(creep, isBuilderMode);
        }
    }
};

module.exports = roleBuilder;