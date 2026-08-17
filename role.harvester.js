const HARVESTER_CONFIG = {
    'W14N37': {
        1: {
            sourceId: '5bbcac169099fc012e634e30',
            containerId: '',
            idlePos: new RoomPosition(29, 29, 'W14N37')
        },
        2: {
            sourceId: '5bbcac169099fc012e634e2f',
            containerId: '68c5013c3b8b634dce256d71',
            idlePos: new RoomPosition(8, 13, 'W14N37')
        },
        storageId: '690588679eec9049d769fa8a'
    },
    'W15N37': {
        1: {
            sourceId: '5bbcac099099fc012e634c11',
            containerId: 'CONTAINER_ID_FOR_GROUP_1',
            idlePos: new RoomPosition(34, 43, 'W15N37')
        },
        2: {
            sourceId: '5bbcac099099fc012e634c0f',
            containerId: '68982bc28899736031f0d7e1',
            idlePos: new RoomPosition(41, 22, 'W15N37')
        },
        storageId: '68c3b86cd6203efa74f701eb'
    },
    'W13N39': {
        1: {
            sourceId: '5bbcac249099fc012e63505a',
            containerId: '',
            idlePos: new RoomPosition(24, 15, 'W13N39')
        },
        2: {
            sourceId: '5bbcac249099fc012e63505b',
            containerId: '68c4ba17c4d2233b8f57d414',
            idlePos: new RoomPosition(44, 18, 'W13N39')
        },
        storageId: '68a688e6d89b6f1cd82a4e03'
    },
    'W13N33': {
        1: {
            sourceId: '5bbcac249099fc012e63506f',
            containerId: '',
            idlePos: new RoomPosition(9, 14, 'W13N33')
        },
        2: {
            sourceId: '5bbcac249099fc012e635070',
            containerId: '68c119c3b7caff57e8b17fb5',
            idlePos: new RoomPosition(4, 38, 'W13N33')
        },
        storageId: '68cf7e69214ab9925ea67037'
    },
    'W23N34': {
        1: {
            sourceId: '5bbcaba09099fc012e634009',
            containerId: '68e41b941f0e522431493b3b',
            idlePos: new RoomPosition(20, 25, 'W23N34')
        },
        2: {
            sourceId: '5bbcaba09099fc012e63400a',
            containerId: '',
            idlePos: new RoomPosition(12, 39, 'W23N34')
        },
        storageId: '68df0b30a4f59bce4d154ff6'
    },
    'W19N35': {
        1: {
            sourceId: '5bbcabd29099fc012e63451e',
            containerId: '',
            idlePos: new RoomPosition(41, 8, 'W19N35')
        },
        2: {
            sourceId: '5bbcabd29099fc012e63451f',
            containerId: '690cf566d9971d602c9e140b',
            idlePos: new RoomPosition(13, 11, 'W19N35')
        },
        storageId: '690a9e2492f8696749731e0a'
    },
    'W7N37': {
        1: {
            sourceId: '5bbcac7b9099fc012e635886',
            containerId: '',
            idlePos: new RoomPosition(40, 39, 'W7N37')
        },
        2: {
            sourceId: '5bbcac7b9099fc012e635884',
            containerId: '69309b1592103f118c15d5b7',
            idlePos: new RoomPosition(27, 24, 'W7N37')
        },
        storageId: '692d364fd6272870014194d9'
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
        //creep.say('⏳');
    }
}

function harvestEnergy(creep, source, idlePos) {
    if (source && source.energy > 0) {
        //creep.say('🚜');
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    } else {
        //creep.say('👍🏻'); //no energy
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
        //creep.say('📦 C');
        return;
    }

    if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        //creep.say('📦 S');
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
        //creep.say('📦 Fallback');
    } else {
        //creep.say('📦 Nowhere');
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