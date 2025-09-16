var roleClaimer = {
    // W23N34 X 
    // W7N24 X
    
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;

        // Define custom path with waypoints
        const path = [
            { room: 'W13N37', x: 37, y: 46 },
            { room: 'W13N36', x: 44, y: 40 },
            { room: 'W12N36', x: 31, y: 46 },
            { room: 'W12N35', x: 27, y: 27 },
            { room: 'W12N35', x: 18, y: 36 },
            { room: 'W12N34', x: 19, y: 47 },
            { room: 'W12N33', x: 2, y: 10 },
            { room: targetRoom, x: 7, y: 17 }
        ];

        // Step index stored in memory
        if (creep.memory.pathIndex === undefined) creep.memory.pathIndex = 0;

        // If not in target room, follow custom path
        if (creep.room.name !== targetRoom) {
            const step = path[creep.memory.pathIndex];
            if (creep.pos.roomName === step.room && creep.pos.x === step.x && creep.pos.y === step.y) {
                // Reached current waypoint, move to next
                creep.memory.pathIndex++;
            } else {
                // Move to current waypoint
                creep.moveTo(new RoomPosition(step.x, step.y, step.room), {
                    visualizePathStyle: { stroke: '#ffffff' }
                });
            }
            return;
        }

        // Reset index once in target room
        creep.memory.pathIndex = undefined;

        // === Claiming Logic ===
        const controller = creep.room.controller;
        if (!controller) return;

        if (!controller.my) {
            const claimResult = creep.claimController(controller);
            if (claimResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(controller, { visualizePathStyle: { stroke: '#00ff00' } });
            } else if (claimResult === OK) {
                creep.say('🎯 Claimed!');
            } else {
                creep.say('❌ ' + claimResult);
            }
            return;
        }

        if (creep.memory.suicideAfterClaim) {
            creep.say('☠️ Done');
            creep.suicide();
        } else {
            const idlePos = new RoomPosition(48, 48, creep.room.name);
            creep.moveTo(idlePos, { visualizePathStyle: { stroke: '#777777' } });
        }
    }
};

module.exports = roleClaimer;