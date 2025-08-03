const STORAGE_ID = '688d5a468b99246abd95096f';

function isWounded(creep) {
    return creep.hits < creep.hitsMax / 2;
}

function needsRenewal(creep) {
    return creep.ticksToLive < 200;
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
            creep.say(`🔄 Harvesting`);
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
    }
    creep.say('❌ No energy');
}

function deliverEnergy(creep) {
    const priorityStorage = Game.getObjectById(STORAGE_ID);
    if (priorityStorage && priorityStorage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(priorityStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(priorityStorage, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('📦 To Storage');
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
        creep.say('📦 Nowhere to put energy');
    }
}

const roleHarvester = {
    run(creep) {
        if (isWounded(creep)) {
            creep.say('🏥 Heal');
            if (moveToSpawn(creep)) return;
        }

        if (needsRenewal(creep)) {
            creep.say('⏳ Renewing');
            if (moveToSpawn(creep)) return;
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