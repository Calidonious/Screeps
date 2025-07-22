var roleScout = {
    run: function(creep) {
        // If all adjacent rooms are scouted, report back information about the current room
        var energySources = creep.room.find(FIND_SOURCES).length;
        var hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS).length;
        var controllerLevel = creep.room.controller ? creep.room.controller.level : "No controller";
        var roomOwner = creep.room.controller ? creep.room.controller.owner.username : "Unclaimed";

        // Find minerals in the room
        var minerals = creep.room.find(FIND_MINERALS);
        var mineralType = minerals.length > 0 ? minerals[0].mineralType : "No minerals";

        // Report back information
        console.log('Room:', creep.room.name);
        console.log('Owner:', roomOwner);
        console.log('Energy Sources:', energySources);
        console.log('Hostile Creeps:', hostileCreeps);
        console.log('Controller Level:', controllerLevel);
        console.log('Mineral Type:', mineralType);

        // Say 'Glory' every 50 ticks
        if (Game.time % 25 === 0) {
            creep.say('Glory', true);
        }

        // Say 'To the' every 100 ticks
        if (Game.time % 26 === 0) {
            creep.say('To the', true);
        }

        // Say 'Machine' every 150 ticks
        if (Game.time % 27 === 0) {
            creep.say('Machine', true);
        }

        // Move to position (25, 40) in the current room
        creep.moveTo(25, 40, { visualizePathStyle: { stroke: '#ffffff' } });

        // Get the next room to scout
        var roomsToScout = ["W9S1", "W8S1", "W7S1", "W6S1", "W5S1", "W4S1", "W3S1", "W2S1", "W1S1", "W0S1", "W0S2", "W1S2", "W2S2", "W3S2", "W4S2", "W5S2", "W6S2", "W7S2", "W8S2", "W9S2", "W10S2", "W10S1"];
        var nextRoomIndex = roomsToScout.indexOf(creep.room.name) + 1;

        // If there's a next room, move to it
        if (nextRoomIndex < roomsToScout.length) {
            var nextRoom = roomsToScout[nextRoomIndex];
            creep.moveTo(new RoomPosition(25, 25, nextRoom), { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};

module.exports = roleScout;