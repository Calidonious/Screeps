const TRANSFER_CONFIG = {
    1: {
        fromId: 'CONTAINER_ID_GROUP_1', // container ID
        toId: 'LINK_ID_GROUP_1',        // link ID
        position: { x: 10, y: 16 },
        type: 'containerToLink'
    },
    2: {
        fromId: 'CONTAINER_ID_GROUP_2', // container ID
        toId: 'LINK_ID_GROUP_2',        // link ID
        position: { x: 29, y: 28 },
        type: 'containerToLink'
    },
    3: {
        fromId: 'LINK_ID_GROUP_3',      //  link ID
        toId: 'STORAGE_ID_GROUP_3',     //  storage ID
        position: { x: 10, y: 30 },
        type: 'linkToStorage'
    }
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
const roleTransfer = {
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
        
        const group = creep.memory.group;
        const config = TRANSFER_CONFIG[group];
        if (!config) {
            console.log(`❌ roleTransfer: Invalid group ${group} for ${creep.name}`);
            return;
        }

        const from = Game.getObjectById(config.fromId);
        const to = Game.getObjectById(config.toId);
        const targetPos = new RoomPosition(config.position.x, config.position.y, creep.room.name);


        // Move to assigned position if not already there
        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#8888ff' } });
            return;
        }

        // Perform transfer actions
        if (config.type === 'containerToLink') {
            if (creep.store[RESOURCE_ENERGY] === 0 && from && from.store[RESOURCE_ENERGY] > 0) {
                creep.withdraw(from, RESOURCE_ENERGY);
            } else if (creep.store[RESOURCE_ENERGY] > 0 && to && to.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.transfer(to, RESOURCE_ENERGY);
            }
        } else if (config.type === 'linkToStorage') {
            if (creep.store[RESOURCE_ENERGY] === 0 && from && from.store[RESOURCE_ENERGY] > 0) {
                creep.withdraw(from, RESOURCE_ENERGY);
            } else if (creep.store[RESOURCE_ENERGY] > 0 && to && to.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.transfer(to, RESOURCE_ENERGY);
            }
        }
    }
};

module.exports = roleTransfer;