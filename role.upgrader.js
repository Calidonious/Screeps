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

// === Config for multi-room positions and energy source ===
const upgraderConfig = {
    "W14N37": {
        group1Pos: { x: 11, y: 40 },
        group2Pos: { x: 11, y: 41 },
        signText: "Glory to the machine! All my watts for the great coil!",
        energySourceId: "" // optional link or container ID
    },
    "W15N37": {
        group1Pos: { x: 33, y: 44 },
        group2Pos: { x: 34, y: 45 },
        signText: "Glory to the machine! All my watts for the great coil!",
        energySourceId: ""
    },
    "W13N33": {
        group1Pos: { x: 8, y: 45 },
        group2Pos: { x: 7, y: 46 },
        signText: "Glory to the machine! All my watts for the great coil!",
        energySourceId: "69007b73caaf571776d75449"
    },
    "W13N39": {
        group1Pos: { x: 29, y: 33 },
        group2Pos: { x: 29, y: 33 },
        signText: "Glory to the machine! All my watts for the great coil!",
        energySourceId: ""
    },
    "W23N34": {
        group1Pos: { x: 24, y: 41 },
        group2Pos: { x: 11, y: 29 },
        signText: "Glory to the machine! All my watts for the great coil!",
        energySourceId: "693a74329f9eced9f73865d0"
    },
    "W19N35": {
        group1Pos: { x: 29, y: 20 },
        group2Pos: { x: 29, y: 20 },
        signText: "Glory to the machine! All my watts for the great coil!",
        energySourceId: ""
    },
    "W7N37": {
        group1Pos: { x: 30, y: 38 },
        group2Pos: { x: 30, y: 38 },
        signText: "Glory to the machine! All my watts for the great coil!",
        energySourceId: ""
    }
};

var roleUpgrader = {
    run: function (creep) {
        const roomName = creep.memory.homeRoom || creep.room.name;
        const group = creep.memory.group || 1;
        const cfg = upgraderConfig[roomName] || {};

        // Healing
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        // Renewal
        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) { renewCreep(creep); return; }
        else if (creep.memory.renewing) stopRenewing(creep);

        // State switching
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
            if (!ctrl) return;

            // Sign controller if group 2 and unsigned
            if (group === 2 && (!ctrl.sign || ctrl.sign.username !== creep.owner.username)) {
                const signText = cfg.signText || "Glory to the machine!";
                if (creep.signController(ctrl, signText) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(ctrl, { visualizePathStyle: { stroke: '#ffaa00' } });
                    return;
                }
            }

            // Move to upgrade position
            const posConfig = group === 2 ? cfg.group2Pos : cfg.group1Pos;
            if (posConfig &&
                (creep.pos.x !== posConfig.x || creep.pos.y !== posConfig.y || creep.room.name !== roomName)) {
                creep.moveTo(new RoomPosition(posConfig.x, posConfig.y, roomName),
                    { visualizePathStyle: { stroke: '#00ff00' } });
                return;
            }

            // Upgrade
            if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
                creep.moveTo(ctrl, { visualizePathStyle: { stroke: '#ffffff' } });
            }

        } else {
            // === Fetch energy ===
            const energySource = cfg.energySourceId ? Game.getObjectById(cfg.energySourceId) : null;

            if (energySource) {
                if (energySource.store[RESOURCE_ENERGY] > 0) {
                    if (creep.withdraw(energySource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(energySource, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    // Wait at idle pos if source empty
                    const posConfig = group === 2 ? cfg.group2Pos : cfg.group1Pos;
                    if (posConfig) {
                        creep.moveTo(new RoomPosition(posConfig.x, posConfig.y, roomName),
                            { visualizePathStyle: { stroke: '#ffaa00' } });
                        creep.say('🕓 Wait');
                    }
                }
            } else {
                // Default energy fetching (no source defined)
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
                        const target = creep.pos.findClosestByPath(energySources);
                        if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                }
            }
        }
    }
};

module.exports = roleUpgrader;