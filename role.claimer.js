var roleClaimer = {
    run: function(creep) {
        // Check the controller of the current room
        var controller = creep.room.controller;
        
        if (controller) {
            if (!controller.my) {
                // If the controller is not claimed by you, move towards it and claim it
                if (creep.claimController(controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(controller);
                }
            } else {
                // If the controller is already claimed, move to the nearest exit
                var exit = creep.pos.findClosestByRange(FIND_EXIT);
                creep.moveTo(exit);
            }
        }
    }
};

module.exports = roleClaimer;