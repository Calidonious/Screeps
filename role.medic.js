var roleMedic = {
    run: function(creep) {
        // Define the waypoints for patrolling
        var waypoints = [
            new RoomPosition(21, 17, creep.room.name), // Top left
            new RoomPosition(34, 17, creep.room.name), // Top right
            new RoomPosition(34, 32, creep.room.name), // Bottom right
            new RoomPosition(21, 32, creep.room.name)  // Bottom left
        ];

        // Check if the medic is close to dying
        if (creep.hits < creep.hitsMax / 2) {
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('🏥 Moving to spawn for renewal');
                return;
            }
        }

        // Find the closest injured creep
        var injured = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => {
                return creep.hits < creep.hitsMax;
            }
        });

        // If there's an injured creep, heal it
        if (injured) {
            if (creep.heal(injured) == ERR_NOT_IN_RANGE) {
                creep.moveTo(injured, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        } else {
            // Patrol between waypoints
            creep.say('🚑 Patrolling');
            var nearestWaypoint = creep.pos.findClosestByRange(waypoints);
            creep.moveTo(nearestWaypoint, { visualizePathStyle: { stroke: '#00ff00' } });
        }
    }
};

module.exports = roleMedic;