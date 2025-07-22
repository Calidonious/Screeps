var roleUpgrader = {
    run: function(creep) {
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄Withdraw');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }
        
        // Check if the creep is low on health
        if (creep.hits < creep.hitsMax / 2) {
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffffff'}});
                creep.say('🏥 Healing!');
            }
        }
        
        // Check if the creep needs to renew at the spawn
        if (creep.ticksToLive < 200) { // Adjust the threshold as needed
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffffff'}});
                creep.say('🏥 Renew!');
                return; // Return here to prioritize renewal over other actions
            }
        }
        
        //creep.moveTo(27, 16, { visualizePathStyle: { stroke: '#00ff00' } });
        
        if (creep.memory.upgrading) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            // Check if there is energy in storage
            var storage = creep.room.storage;
            if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                // Withdraw energy from storage
                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
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
                        creep.say('🔄 Alt source');
                        
                    }
                } else {
                    creep.say('No energy sources available');
                }
            }
        }
    }
};

module.exports = roleUpgrader;