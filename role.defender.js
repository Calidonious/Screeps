var roleDefender = {

    /** @param {Creep} creep **/
    run: function (creep) {
        const homeRoom = creep.memory.homeRoom;
        const inHomeRoom = creep.room.name === homeRoom;
        const isMelee = creep.getActiveBodyparts(ATTACK) > 0;
        const isRanged = creep.getActiveBodyparts(RANGED_ATTACK) > 0;
        const canHeal = creep.getActiveBodyparts(HEAL) > 0;
        const lowHealth = creep.hits < creep.hitsMax * 0.5;

        // 🚪 If defender is outside its homeRoom, go back immediately
        if (!inHomeRoom) {
            creep.say('🏠');
            const exitDir = creep.room.findExitTo(homeRoom);
            const exit = creep.pos.findClosestByRange(exitDir);
            if (exit) {
                creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // ❤️ Auto-heal self
        if (canHeal && creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        // 🛡️ Retreat if badly injured
        if (lowHealth) {
            const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.say('Heal');
                creep.moveTo(spawn, { visualizePathStyle: { stroke: '#00ff00' } });
                return;
            }
        }

        // 🔍 Find enemies in homeRoom
        const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ||
            creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: s => s.structureType !== STRUCTURE_CONTROLLER
            });

        if (target) {
            // Engage enemy
            if (isRanged && creep.pos.inRangeTo(target, 3)) {
                creep.rangedAttack(target);
            }
            if (isMelee && creep.pos.isNearTo(target)) {
                creep.attack(target);
            }
            if (!creep.pos.inRangeTo(target, 1)) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff5555' } });
            }
        } else {
            // 🚶 Idle near controller (or fallback pos)
            const idlePos = creep.room.controller ? creep.room.controller.pos : new RoomPosition(16, 15, creep.room.name);
            creep.moveTo(idlePos, { visualizePathStyle: { stroke: '#999999' } });
        }
    }
};

module.exports = roleDefender;