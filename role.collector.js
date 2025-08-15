const RENEW_THRESHOLD = 500;

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

var roleCollector = {
    config: {
        'W14N37': {
            idlePos: { x: 9, y: 23 },
            dropoffId: '688d5a468b99246abd95096f',
            collectEnergy: false
        },
        'W15N37': {
            idlePos: { x: 39, y: 46 },
            dropoffId: '689593f14c3ddc337079485d',
            collectEnergy: false
        }
    },

    run: function (creep) {
        // Healing
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        // Renewal logic
        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) {
            stopRenewing(creep);
        }

        const homeRoom = creep.memory.homeRoom || creep.room.name;
        const roomCfg = this.config[homeRoom] || {};

        // If hostiles are present, stay idle
        const hostiles = (Game.rooms[homeRoom] && Game.rooms[homeRoom].find(FIND_HOSTILE_CREEPS)) || [];
        if (hostiles.length > 0) {
            this.moveToIdle(creep, homeRoom, roomCfg);
            return;
        }

        // === Deliver immediately if full ===
        if (_.sum(creep.store) === creep.store.getCapacity()) {
            this.deliverResources(creep, roomCfg);
            return;
        }

        // Dropped resources
        const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: function (r) {
                if (!roomCfg.collectEnergy && r.resourceType === RESOURCE_ENERGY) return false;
                return r.amount > 0;
            }
        });
        
        if (dropped.length > 0) {
            const closest = creep.pos.findClosestByPath(dropped);
            if (closest) { // check path is not null
                if (creep.pickup(closest) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffaa00' } });
                    creep.say('⚰️𖤐');
                }
            }
            return;
        }
        
        // Tombstones
        const tombstones = creep.room.find(FIND_TOMBSTONES, {
            filter: function (t) {
                if (!roomCfg.collectEnergy) {
                    return _.some(Object.keys(t.store), function (res) {
                        return res !== RESOURCE_ENERGY && t.store[res] > 0;
                    });
                }
                return _.sum(t.store) > 0;
            }
        });
        
        if (tombstones.length > 0) {
            const closestTomb = creep.pos.findClosestByPath(tombstones);
            if (closestTomb) { // Check path is not null
                for (const resourceType in closestTomb.store) {
                    if (!roomCfg.collectEnergy && resourceType === RESOURCE_ENERGY) continue;
                    if (closestTomb.store[resourceType] > 0) {
                        if (creep.withdraw(closestTomb, resourceType) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(closestTomb, { visualizePathStyle: { stroke: '#ffaa00' } });
                            creep.say('🪦𖤐');
                        }
                    }
                }
            }
            return;
        }


        // === If we have something but nothing else to collect, drop it off before idling ===
        if (_.sum(creep.store) > 0) {
            this.deliverResources(creep, roomCfg);
            return;
        }

        // Idle
        this.moveToIdle(creep, homeRoom, roomCfg);
    },

    deliverResources: function (creep, roomCfg) {
        let target = null;
        if (roomCfg.dropoffId) {
            target = Game.getObjectById(roomCfg.dropoffId);
        }
        if (!target) {
            target = creep.room.storage ||
                creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: function (s) {
                        return (s.structureType === STRUCTURE_CONTAINER ||
                            s.structureType === STRUCTURE_STORAGE) &&
                            _.sum(s.store) < s.storeCapacity;
                    }
                });
        }
        if (target) {
            for (const resourceType in creep.store) {
                if (creep.store[resourceType] > 0) {
                    if (creep.transfer(target, resourceType) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        creep.say('📦');
                    }
                }
            }
        }
    },

    moveToIdle: function (creep, roomName, roomCfg) {
        if (roomCfg.idlePos) {
            creep.moveTo(new RoomPosition(roomCfg.idlePos.x, roomCfg.idlePos.y, roomName),
                { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('📭');
        } else {
            creep.moveTo(new RoomPosition(25, 25, roomName),
                { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('📭Alt');
        }
    }
};

module.exports = roleCollector;