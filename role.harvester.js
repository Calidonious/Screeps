const STORAGE_ID = '688d5a468b99246abd95096f';

const CONTAINER_BY_GROUP = {
    1: 'CONTAINER_ID_FOR_GROUP_1',
    2: 'CONTAINER_ID_FOR_GROUP_2',
};

const RENEW_THRESHOLD = 1000; // Minimum desired life span after renewal

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

function getSourcesByGroup(group) {
    const sourceA = Game.getObjectById('5bbcac169099fc012e634e30');
    const sourceB = Game.getObjectById('5bbcac169099fc012e634e2f');
    return group === 1 ? [sourceA, sourceB] : [sourceB, sourceA];
}

function harvestEnergy(creep, sources) {
    for (const source of sources) {
        if (source && source.energy > 0) {
            creep.say('🚜');
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
    }
    creep.say('❌ No energy');
}

function getDesignatedContainer(creep) {
    const id = CONTAINER_BY_GROUP[creep.memory.group];
    return id ? Game.getObjectById(id) : null;
}

function deliverEnergy(creep) {
    const designated = getDesignatedContainer(creep);
    if (designated && designated.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(designated, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(designated, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('📦 C');
        return;
    }

    const priorityStorage = Game.getObjectById(STORAGE_ID);
    if (priorityStorage && priorityStorage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(priorityStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(priorityStorage, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('📦 S');
        return;
    }

    const fallbackTargets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => (
            (structure.structureType === STRUCTURE_EXTENSION ||
             structure.structureType === STRUCTURE_SPAWN ||
             structure.structureType === STRUCTURE_TOWER ||
             structure.structureType === STRUCTURE_CONTAINER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        )
    });

    if (fallbackTargets.length > 0) {
        if (creep.transfer(fallbackTargets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(fallbackTargets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('📦 Fallback');
    } else {
        creep.say('📦 Nowhere');
    }
}

const roleHarvester = {
    run(creep) {
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

        const [source1, source2] = getSourcesByGroup(creep.memory.group);

        if (creep.store.getFreeCapacity() > 0) {
            harvestEnergy(creep, [source1, source2]);
        } else {
            deliverEnergy(creep);
        }
    }
};

module.exports = roleHarvester;