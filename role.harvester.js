var roleHarvester = {
    run: function(creep) {
        // Check if the creep is low on health
        if (creep.hits < creep.hitsMax / 2) {
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffffff'}});
                creep.say('🏥 Returning to spawn for renewal');
                return; // Return here to prioritize healing at the spawn
            }
        }
        
        // Check if the creep needs to renew at the spawn
        if (creep.ticksToLive < 200) { // Adjust the threshold as needed
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffffff'}});
                return; // Return here to prioritize renewal over other actions
            }
        }
        
        // Group 1: Default to source1 and secondary to source2
        if (creep.memory.group === 1) {
            var source1 = Game.getObjectById('6845d068b4a6e60029b25757');
            var source2 = Game.getObjectById('6845d068b4a6e60029b25755');
        }
        // Group 2: Default to source2 and secondary to source1
        else if (creep.memory.group === 2) {
            var source1 = Game.getObjectById('6845d068b4a6e60029b25755');
            var source2 = Game.getObjectById('6845d068b4a6e60029b25757');
        }
        
        if (creep.store.getFreeCapacity() > 0) {
            // Prioritize source1 if it has energy
            if (source1 && source1.energy > 0) {
                creep.say('🔄 Harvesting from source1');
                if (creep.harvest(source1) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source1, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } 
            // If source1 has no energy or is unavailable, use source2
            else if (source2 && source2.energy > 0) {
                creep.say('🔄 Harvesting from source2');
                if (creep.harvest(source2) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source2, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } 
            // If neither source has energy, wait
            else {
                creep.say('No energy sources available');
            }
        } else {
            // Creep is full, time to deliver or store energy
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION ||
                            structure.structureType == STRUCTURE_SPAWN) && 
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
                    creep.say('📦 Delivering');
                }
            } else {
                // If no available targets, store energy in storage or containers
                var storage = creep.room.storage;
                if (storage) {
                    if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
        }
    }
};

module.exports = roleHarvester;