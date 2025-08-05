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

var roleTransporter = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const STORAGE_ID = '688d5a468b99246abd95096f';
        const storage = Game.getObjectById(STORAGE_ID);

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

        // === Mode Switching ===
        if (creep.memory.delivering && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.delivering = false;
            creep.say('🫴');
        }
        if (!creep.memory.delivering && creep.store.getFreeCapacity() === 0) {
            creep.memory.delivering = true;
            creep.say('⚡');
        }

        if (creep.memory.delivering) {
            // === Delivery Mode ===
            let structureTypes;

            // Determine target types based on group
            switch (creep.memory.group) {
                case 1:
                    structureTypes = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION, STRUCTURE_TOWER];
                    break;
                case 2:
                    structureTypes = [STRUCTURE_SPAWN, STRUCTURE_EXTENSION];
                    break;
                case 3:
                    structureTypes = [STRUCTURE_TOWER];
                    break;
                default:
                    creep.say('❓Group');
                    return;
            }

            // Find all valid targets for this group
            const targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (structure) =>
                    structureTypes.includes(structure.structureType) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (targets.length > 0) {
                // Distribute work by choosing a target based on creep's name hash
                const sortedTargets = _.sortBy(targets, t => t.id); // stable order
                const targetIndex = creep.name.charCodeAt(creep.name.length - 1) % sortedTargets.length;
                const target = sortedTargets[targetIndex];

                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    creep.say('⚡');
                }
            } else {
                if (creep.memory.group == 1){
                    creep.moveTo(8,29);
                } else if (creep.memory.group == 2){
                    creep.moveTo(14,36);
                } else if (creep.memory.group == 3){
                    creep.moveTo(14,30)
                };
                
                creep.say('📭');
            }

        } else {
            // === Collecting Mode ===
            if (storage) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                    creep.say('🫴');
                }
            } else {
                creep.say('❌NoStorage');
            }
        }
    }
};

module.exports = roleTransporter;