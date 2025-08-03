var roleHarasser = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const isRanged = creep.getActiveBodyparts(RANGED_ATTACK) > 0;
        const isMelee = creep.getActiveBodyparts(ATTACK) > 0;
        const canHeal = creep.getActiveBodyparts(HEAL) > 0;
        const safeHealthRatio = 0.6; // below this % health, creep retreats

        const inTargetRoom = creep.room.name === creep.memory.targetRoom;

        // Auto-heal self
        if (canHeal && creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        // Retreat if health is low
        if (creep.hits < creep.hitsMax * safeHealthRatio) {
            creep.say('🏃Fallback');
            const home = Game.rooms[creep.memory.homeRoom];
            if (home) {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.homeRoom));
            }
            return;
        }

        // Go to target room
        if (!inTargetRoom) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {
                visualizePathStyle: { stroke: '#ffaa00' }
            });
            return;
        }

        //Prioritize enemy creeps > structures
        const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ||
                       creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                           filter: structure => structure.structureType !== STRUCTURE_CONTROLLER
                       });

        if (target) {
            // RANGED
            if (isRanged) {
                if (creep.pos.inRangeTo(target, 3)) {
                    creep.rangedAttack(target);
                    // Optional kiting: stay at distance
                    if (creep.pos.inRangeTo(target, 1)) {
                        creep.moveTo(creep.pos.findClosestByPath(FIND_EXIT)); // fallback kite
                    }
                } else {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff00ff' } });
                }
            }

            // MELEE
            if (isMelee) {
                if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
                }
            }
        } else {
            // No targets – move to controller area as patrol
            const idlePos = creep.room.controller ? creep.room.controller.pos : new RoomPosition(25, 25, creep.room.name);
            creep.moveTo(idlePos);
        }
    }
};

module.exports = roleHarasser;