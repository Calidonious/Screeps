var roleTransporter = {

    /** @param {Creep} creep **/
    run: function(creep) {
        // Define ID constants at the top so they are easy to change
        const STORAGE_ID = '688d5a468b99246abd95096f';
        const storage = Game.getObjectById(STORAGE_ID);

        // Switch modes based on creep's current energy state
        if (creep.memory.delivering && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.delivering = false;
            creep.say('🔄 Collecting');
        }
        if (!creep.memory.delivering && creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            creep.say('⚡ Delivering');
        }

        if (creep.memory.delivering) {
            // Deliver energy to spawn, extensions, and towers
            const targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) =>
                    (structure.structureType === STRUCTURE_SPAWN ||
                     structure.structureType === STRUCTURE_EXTENSION ||
                     structure.structureType === STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (targets.length > 0) {
                const target = creep.pos.findClosestByPath(targets);
                if (target) {
                    if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
        } else {
            // Withdraw energy from storage
            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                creep.say('❌ No Storage');
            }
        }
    }
};

module.exports = roleTransporter;