const RENEW_THRESHOLD = 800; // Minimum desired life span after renewal

function isWounded(creep) {
    return creep.hits < creep.hitsMax / 2;
}

function shouldStartRenewing(creep) {
    return creep.ticksToLive < 300 && !creep.memory.renewing;
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

// === Config for multi-room positions and signing ===
const upgraderConfig = {
    "W14N37": {
        group1Pos: { x: 11, y: 40 },
        group2Pos: { x: 11, y: 41 }, //group 2 signs before upgrading
        signText: "Glory to the machine! All my watts for the great coil!"
    },
    "W15N37": {
        group1Pos: { x: 33, y: 44 },
        group2Pos: { x: 34, y: 45 },
        signText: "Glory to the machine! All my watts for the great coil!"
    },
    "W13N33": {
        group1Pos: { x: 7, y: 46 },
        group2Pos: { x: 7, y: 46 },
        signText: "Glory to the machine! All my watts for the great coil!"
    },
    "W23N34": {
        group1Pos: { x: 11, y: 29 },
        group2Pos: { x: 11, y: 29 },
        signText: "Glory to the machine! All my watts for the great coil!"
    }
};

var roleUpgrader = {
    run: function(creep) {
        const roomName = creep.memory.homeRoom || creep.room.name;
        const group = creep.memory.group || 1;

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

        // Switching states between upgrading and getting energy
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.upgrading = false;
            creep.say('🫴');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() === 0) {
            creep.memory.upgrading = true;
            creep.say('⚡');
        }

        if (creep.memory.upgrading) {
            const ctrl = creep.room.controller;

            // Group 2 → Sign controller if not signed
            if (group === 2 && ctrl && (!ctrl.sign || ctrl.sign.username !== creep.owner.username)) {
                var signText = "Controlled";
                if (upgraderConfig[roomName] && upgraderConfig[roomName].signText) {
                    signText = upgraderConfig[roomName].signText;
                }
                if (creep.signController(ctrl, signText) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(ctrl, { visualizePathStyle: { stroke: '#ffaa00' } });
                    return;
                }
            }

            // Move to assigned upgrade position if set
            const posConfig = upgraderConfig[roomName];
            if (posConfig) {
                const targetPos = group === 2 ? posConfig.group2Pos : posConfig.group1Pos;
                if (targetPos && (creep.pos.x !== targetPos.x || creep.pos.y !== targetPos.y)) {
                    creep.moveTo(new RoomPosition(targetPos.x, targetPos.y, roomName), { visualizePathStyle: { stroke: '#00ff00' } });
                    return;
                }
            }

            // Upgrade controller
            if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
                creep.moveTo(ctrl, { visualizePathStyle: { stroke: '#ffffff' } });
            }

        } else {
            // Energy fetching
            const storage = creep.room.storage;
            if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            } else {
                const energySources = creep.room.find(FIND_STRUCTURES, {
                    filter: s =>
                        (s.structureType === STRUCTURE_SPAWN ||
                         s.structureType === STRUCTURE_EXTENSION ||
                         s.structureType === STRUCTURE_CONTAINER) &&
                        s.store[RESOURCE_ENERGY] > 0
                });
                if (energySources.length) {
                    if (creep.withdraw(energySources[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(energySources[0], { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
        }
    }
};

module.exports = roleUpgrader;