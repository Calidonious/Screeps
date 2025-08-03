var roleClaimer = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;

        // If we haven't reached the target room yet, move there
        if (creep.room.name !== targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, targetRoom), {
                visualizePathStyle: { stroke: '#ffffff' }
            });
            return;
        }

        const controller = creep.room.controller;

        if (!controller) return;

        // If the controller is not yours, attempt to claim it
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

        // If already claimed, idle or suicide (optional)
        if (creep.memory.suicideAfterClaim) {
            creep.say('☠️ Done');
            creep.suicide();
        } else {
            // Idle in corner or near controller
            const idlePos = new RoomPosition(48, 48, creep.room.name);
            creep.moveTo(idlePos, { visualizePathStyle: { stroke: '#777777' } });
        }
    }
};

module.exports = roleClaimer;