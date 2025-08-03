var roleMedic = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const followName = creep.memory.follow;
        const targetRoom = creep.memory.targetRoom;
        const targetCreep = followName ? Game.creeps[followName] : null;
        const canHeal = creep.getActiveBodyparts(HEAL) > 0;
        const inTargetRoom = !targetRoom || creep.room.name === targetRoom;

        const MIN_SAFE_DISTANCE = 8;

        // ✅ Heal self if hurt
        if (canHeal && creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        // ✅ Hostile avoidance
        const nearbyHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (nearbyHostile && creep.pos.getRangeTo(nearbyHostile) < MIN_SAFE_DISTANCE) {
            const fleePath = PathFinder.search(creep.pos, [{ pos: nearbyHostile.pos, range: MIN_SAFE_DISTANCE }], {
                flee: true,
                maxRooms: 1,
                plainCost: 2,
                swampCost: 10,
                roomCallback: () => false
            });
            if (fleePath.path.length > 0) {
                creep.move(fleePath.path[0].direction);
                return;
            }
        }

        // ✅ Move to target room if defined
        if (targetRoom && !inTargetRoom) {
            creep.moveTo(new RoomPosition(6, 8, targetRoom), {
                visualizePathStyle: { stroke: '#aaaaaa' }
            });
            return;
        }

        // ✅ Stay close to follow target & heal
        if (targetCreep && targetCreep.room.name === creep.room.name) {
            const range = creep.pos.getRangeTo(targetCreep);

            if (range <= 1) {
                creep.heal(targetCreep);
            } else if (range <= 3 && creep.rangedHeal) {
                creep.rangedHeal(targetCreep);
            }

            if (range > 2) {
                creep.moveTo(targetCreep, {
                    visualizePathStyle: { stroke: '#00ff00' },
                    range: 2
                });
            }

            return;
        }

        // 🔁 Fallback: heal any injured ally
        const backup = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: c => c.hits < c.hitsMax && c.name !== creep.name
        });

        if (backup) {
            const range = creep.pos.getRangeTo(backup);
            if (range <= 1) {
                creep.heal(backup);
            } else {
                creep.moveTo(backup, {
                    visualizePathStyle: { stroke: '#00ffff' }
                });
                if (range <= 3 && creep.rangedHeal) {
                    creep.rangedHeal(backup);
                }
            }
        } else {
            const idlePos = creep.room.controller ? creep.room.controller.pos : new RoomPosition(6, 8, creep.room.name);
            creep.moveTo(idlePos, { visualizePathStyle: { stroke: '#999999' } });
        }
    }
};

module.exports = roleMedic;