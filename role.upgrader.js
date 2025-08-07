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


var roleUpgrader = {
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
        
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🫴');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡');
        }
        
        //creep.moveTo(30, 16, { visualizePathStyle: { stroke: '#00ff00' } });
        
        if (creep.memory.upgrading) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                creep.say('⚡');
            }
        } else {
            // Check if there is energy in storage
            var storage = creep.room.storage;
            if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                // Withdraw energy from storage
                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
                    creep.say('🫴');
                }
            } else {
                var energySources = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store[RESOURCE_ENERGY] > 0;
                        
                    }
                    
                });
                
                if (energySources.length > 0) {
                    if (creep.withdraw(energySources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(energySources[0], {visualizePathStyle: {stroke: '#ffffff'}});
                        creep.say('🫴 Alt source');
                        
                    }
                } else {
                    creep.say('No energy sources available');
                }
            }
        }
    }
};

module.exports = roleUpgrader;