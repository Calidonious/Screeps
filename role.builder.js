var roleBuilder = {
    run: function(creep) {
        // Check if the creep is low on health
        if (creep.hits < creep.hitsMax / 2) {
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffffff'}});
                creep.say('🏥 Returning to spawn');
                return;
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

        if (creep.store.getFreeCapacity() > 0) {
            var storage = creep.room.storage;
            if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
                    
                }
                
            } else {
                // Look for alternate energy sources: spawns, extensions, containers
                var energySources = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store[RESOURCE_ENERGY] > 0;
                        
                    }
                    
                });
                
                if (energySources.length > 20) {
                    if (creep.withdraw(energySources[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(energySources[0], {visualizePathStyle: {stroke: '#ffffff'}});
                        creep.say('🔄 Alt source');
                        
                    }
                    
                } else {
                    // Fall back to harvesting from source1 or source2
                    var source1 = Game.getObjectById('6845d068b4a6e60029b25757');
                    var source2 = Game.getObjectById('6845d068b4a6e60029b25755');
                    
                    if (source1 && source1.energy > 0) {
                        creep.say('🔄 Harvesting from source1');
                        if (creep.harvest(source1) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source1, {visualizePathStyle: {stroke: '#ffaa00'}});
                            
                        }
                        
                    } else if (source2 && source2.energy > 0) {
                        creep.say('🔄 Harvesting from source2');
                        if (creep.harvest(source2) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(source2, {visualizePathStyle: {stroke: '#ffaa00'}});
                            
                        }
                        
                    } else {
                        creep.say('No energy sources available');
                        
                    }
                    
                }
                
            }
            
        } else {
            // Creep is full, time to build or repair
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else {
                var towers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
                if (towers.length > 0) {
                    if (creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(towers[0], { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.say('📦 Delivering to tower');
                    }
                } else {
                    var spawn = creep.room.find(FIND_MY_SPAWNS)[0];
                    if (spawn.energy < spawn.energyCapacity) {
                        if (creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
                            creep.say('📦 Delivering to spawn');
                        }
                    } else {
                        var extensions = creep.room.find(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return structure.structureType == STRUCTURE_EXTENSION &&
                                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                            }
                        });
                        if (extensions.length > 0) {
                            if (creep.transfer(extensions[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(extensions[0], { visualizePathStyle: { stroke: '#ffffff' } });
                                creep.say('📦 Delivering to extension');
                            }
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleBuilder;