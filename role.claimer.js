

var roleClaimer = {
    // W14N22 L
    
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;

        // Define custom path with waypoints
        const path = [
            { room: 'W15N37', x: 24, y: 48 },
            { room: 'W15N36', x: 21, y: 8 },
            { room: 'W15N36', x: 12, y: 13 },
            { room: 'W15N36', x: 1, y: 15 },
            { room: 'W16N36', x: 33, y: 34 },
            { room: 'W16N36', x: 29, y: 44 },
            { room: 'W16N36', x: 1, y: 45 },
            { room: 'W17N36', x: 42, y: 37 },
            { room: 'W17N36', x: 24, y: 2 },
            { room: 'W17N36', x: 1, y: 7 },
            { room: 'W18N36', x: 25, y: 17 },
            { room: 'W18N36', x: 2, y: 20 },
            { room: 'W19N36', x: 40, y: 18 },
            { room: 'W19N36', x: 35, y: 33 },
            { room: 'W19N36', x: 22, y: 39 },
            { room: 'W19N36', x: 2, y: 36 },
            { room: 'W20N36', x: 23, y: 47 },
            { room: 'W20N35', x: 2, y: 10 },
            { room: 'W21N35', x: 4, y: 35 },
            { room: 'W22N35', x: 34, y: 47 },
            { room: 'W22N34', x: 2, y: 10 },
            { room: 'W23N34', x: 23, y: 40 },
            { room: targetRoom, x: 23, y: 39 }
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