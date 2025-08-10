var roleClaimer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;

        // Define custom path with waypoints
        const path = [
            { room: 'W14N36', x: 20, y: 10 },
            { room: 'W14N36', x: 1, y: 36 },
            { room: 'W15N36', x: 40, y: 23 },
            { room: 'W15N36', x: 27, y: 2 },
            { room: 'W15N37', x: 21, y: 45 } // Center of target room
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