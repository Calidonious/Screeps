const RENEW_THRESHOLD = 800;

function isWounded(creep) {
    return creep.hits < creep.hitsMax / 2;
}

function shouldStartRenewing(creep) {
    return creep.ticksToLive < 200 && !creep.memory.renewing;
}

function shouldContinueRenewing(creep) {
    return creep.memory.renewing && creep.ticksToLive < RENEW_THRESHOLD;
}

function stopRenewing(creep) {
    creep.memory.renewing = false;
}

function startRenewing(creep) {
    creep.memory.renewing = true;
}

function renewCreep(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('⏳');
    }
}

function moveToSpawn(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        return true;
    }
    return false;
}

var roleExtractor = {
    config: {
        'W14N37': {
            idlePos: { x: 22, y: 26 }, // Where to wait when idle
            mineralId: '5bbcb25640062e4259e93905', // hydrogen
            dropoffId: '68a0005110ab6307347c0d2e' // Terminal
        },
        'W15N37': {
            idlePos: { x: 8, y: 29 },
            mineralId: '5bbcb24f40062e4259e938bd', // zynthium
            dropoffId: '689593f14c3ddc337079485d', // terminal
        }
    },

    run: function(creep) {
        // Healing (optional)
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        // Renewal logic
        if (shouldStartRenewing(creep)) {
            startRenewing(creep);
        }

        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) {
            stopRenewing(creep);
        }
        
        var homeRoom = creep.memory.homeRoom || creep.room.name;
        var roomCfg = this.config[homeRoom] || {};

        // If carrying something, deliver to drop-off
        if (_.sum(creep.store) === creep.store.getCapacity()) {
            var target = Game.getObjectById(roomCfg.dropoffId);

            if (!target) {
                // Fallback: storage or closest container
                target = creep.room.storage ||
                    creep.pos.findClosestByPath(FIND_STRUCTURES, {
                        filter: function(s) {
                            return (s.structureType === STRUCTURE_CONTAINER ||
                                    s.structureType === STRUCTURE_STORAGE ||
                                    s.structureType === STRUCTURE_TERMINAL) &&
                                    _.sum(s.store) < s.storeCapacity;
                        }
                    });
            }

            if (target) {
                for (var resourceType in creep.store) {
                    if (creep.transfer(target, resourceType) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.say('📦');
                    }
                }
            }
            return;
        }

        // If empty, try to harvest mineral
        var mineral = Game.getObjectById(roomCfg.mineralId);

        if (mineral && mineral.mineralAmount > 0) {
            // Check cooldown before harvesting
            if (mineral.ticksToRegeneration > 0) {
                // Mineral regenerating, go idle
                this.goIdle(creep, homeRoom, roomCfg);
                return;
            }

            var harvestResult = creep.harvest(mineral);
            creep.say('⛏️');
            if (harvestResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(mineral, { visualizePathStyle: { stroke: '#ffaa00' } });
                creep.say('⛏️');
            }
            return;
        }

        // If mineral is depleted or config missing, go idle
        this.goIdle(creep, homeRoom, roomCfg);
    },

    goIdle: function(creep, roomName, roomCfg) {
        if (roomCfg.idlePos) {
            creep.moveTo(new RoomPosition(roomCfg.idlePos.x, roomCfg.idlePos.y, roomName),
                { visualizePathStyle: { stroke: '#ffaa00' } });
        } else {
            creep.moveTo(new RoomPosition(25, 25, roomName), { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('📭');
        }
    }
};

module.exports = roleExtractor;