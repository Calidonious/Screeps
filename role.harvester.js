const HARVESTER_CONFIG = {
    'W14N37': {
        1: {
            sourceId: '5bbcac169099fc012e634e30',
            containerId: '6898df3629f295767f335f7c',
            idlePos: new RoomPosition(28, 29, 'W14N37')
        },
        2: {
            sourceId: '5bbcac169099fc012e634e2f',
            containerId: '68927f15563654719b60fc5f',
            idlePos: new RoomPosition(8, 13, 'W14N37')
        },
        storageId: '688d5a468b99246abd95096f'
    },
    'W15N37': {
        1: {
            sourceId: '5bbcac099099fc012e634c11',
            containerId: 'CONTAINER_ID_FOR_GROUP_1',
            idlePos: new RoomPosition(34, 43, 'W15N37')
        },
        2: {
            sourceId: '5bbcac099099fc012e634c0f',
            containerId: '68982f5e7bc95867b188c3c0',
            idlePos: new RoomPosition(41, 22, 'W15N37')
        },
        storageId: '689593f14c3ddc337079485d'
    },
    'W13N39': {
        1: {
            sourceId: '5bbcac249099fc012e63505a',
            containerId: '',
            idlePos: new RoomPosition(24, 15, 'W13N39')
        },
        2: {
            sourceId: '5bbcac249099fc012e63505b',
            containerId: '68a98b2eab78dd2632667cb1',
            idlePos: new RoomPosition(44, 18, 'W13N39')
        },
        storageId: '68a688e6d89b6f1cd82a4e03'
    },
};


const RENEW_THRESHOLD = 1400;

function getRoomConfig(creep) {
    const roomName = creep.room.name;
    const group = creep.memory.group;
    const roomConfig = HARVESTER_CONFIG[roomName];
    if (!roomConfig || !roomConfig[group]) return null;
    return {
        source: Game.getObjectById(roomConfig[group].sourceId),
        container: Game.getObjectById(roomConfig[group].containerId),
        storage: Game.getObjectById(roomConfig.storageId),
        idlePos: roomConfig[group].idlePos
    };
}

function isWounded(creep) {
    return creep.hits < creep.hitsMax / 2;
}

function shouldStartRenewing(creep) {
    return creep.ticksToLive < 300 && !creep.memory.renewing;
}

function shouldContinueRenewing(creep) {
    return creep.memory.renewing && creep.ticksToLive < RENEW_THRESHOLD;
}

function startRenewing(creep) {
    creep.memory.renewing = true;
}

function stopRenewing(creep) {
    creep.memory.renewing = false;
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

function harvestEnergy(creep, source, idlePos) {
    if (source && source.energy > 0) {
        creep.say('🚜');
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    } else {
        creep.say('👍🏻'); //no energy
        if (idlePos) {
            creep.moveTo(idlePos);
        }
    }
}

function deliverEnergy(creep, container, storage) {
    if (container && container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('📦 C');
        return;
    }

    if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('📦 S');
        return;
    }

    const fallbackTargets = creep.room.find(FIND_STRUCTURES, {
        filter: function (structure) {
            return (
                (structure.structureType === STRUCTURE_EXTENSION ||
                 structure.structureType === STRUCTURE_SPAWN ||
                 structure.structureType === STRUCTURE_TOWER ||
                 structure.structureType === STRUCTURE_CONTAINER) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            );
        }
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
    run: function (creep) {
        if (!creep.memory.group) {
            creep.say('❓ No group');
            return;
        }

        const config = getRoomConfig(creep);
        if (!config) {
            creep.say('⚠️ Bad config');
            return;
        }

        if (isWounded(creep)) {
            creep.say('🏥');
            renewCreep(creep);
            return;
        }

        if (shouldStartRenewing(creep)) {
            startRenewing(creep);
        }

        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) {
            stopRenewing(creep);
        }

        if (creep.store.getFreeCapacity() > 0) {
            harvestEnergy(creep, config.source, config.idlePos);
        } else {
            deliverEnergy(creep, config.container, config.storage);
        }
    }
};

module.exports = roleHarvester;