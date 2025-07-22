var roleDefender = {
    run: function(creep) {
        // Define the corners of the area
        var topLeft = new RoomPosition(21, 17, creep.room.name);
        var topRight = new RoomPosition(34, 17, creep.room.name);
        var bottomLeft = new RoomPosition(21, 32, creep.room.name);
        var bottomRight = new RoomPosition(34, 32, creep.room.name);

        // Check if the defender is close to dying
        if (creep.hits < creep.hitsMax / 2) {
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
                creep.say('🏥 Moving to spawn for renewal');
                return;
            }
        }

        // Check for hostile creeps in the area
        var hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (creep) => {
                return (
                    creep.pos.isEqualTo(topLeft) ||
                    creep.pos.isEqualTo(topRight) ||
                    creep.pos.isEqualTo(bottomLeft) ||
                    creep.pos.isEqualTo(bottomRight)
                );
            }
        });

        if (hostile) {
            if (creep.attack(hostile) == ERR_NOT_IN_RANGE) {
                creep.moveTo(hostile, { visualizePathStyle: { stroke: '#ff0000' } });
            }
        } else {
            // If no hostile creeps in the area, patrol around
            var patrolPoints = [topLeft, topRight, bottomLeft, bottomRight];
            var target = creep.pos.findClosestByRange(patrolPoints);
            creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00' } });
        }
    }
};

module.exports = roleDefender;