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

var roleLabManager = {
    run: function (creep, roomCfg) {
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
        
        if (!roomCfg.enableManagers) {
            // Just idle if managers are disabled
            if (roomCfg.idlePos) {
                creep.moveTo(new RoomPosition(roomCfg.idlePos.x, roomCfg.idlePos.y, creep.room.name),
                    { visualizePathStyle: { stroke: '#888888' } });
            }
            return;
        }
        
        // Prioritize filling energy
        const lowEnergyLab = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_LAB && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })[0];
        
        if (lowEnergyLab) {
            if (_.sum(creep.store) === 0) {
                // Withdraw energy from storage/terminal
                const storage = creep.room.storage;
                if (storage && storage.store[RESOURCE_ENERGY] > 0) {
                    if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
            } else {
                // Transfer energy to the lab
                if (creep.transfer(lowEnergyLab, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(lowEnergyLab, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            return; // Only do energy this tick
        }

        const storage = Game.getObjectById(roomCfg.storageId) || creep.room.storage;
        if (!storage) return;

        // Fill input labs
        for (let labCfg of roomCfg.inputLabs) {
            const lab = Game.getObjectById(labCfg.id);
            if (lab && lab.store[labCfg.resource] < 2000) {
                if (_.sum(creep.store) === 0) {
                    if (creep.withdraw(storage, labCfg.resource) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    if (creep.transfer(lab, labCfg.resource) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(lab, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                return; // do one thing per tick
            }
        }

        // Empty reaction labs
        for (let labId of roomCfg.reactionLabs) {
            const lab = Game.getObjectById(labId);
            if (!lab) continue;

            for (const res in lab.store) {
                if (res !== RESOURCE_ENERGY && lab.store[res] > 0) {
                    if (_.sum(creep.store) === 0) {
                        if (creep.withdraw(lab, res) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(lab, { visualizePathStyle: { stroke: '#ffaa00' } });
                        }
                    } else {
                        if (creep.transfer(storage, res) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                    return;
                }
            }
        }

        // Maintain boost labs
        for (let b of roomCfg.boostLabs) {
            const lab = Game.getObjectById(b.id);
            if (!lab) continue;

            if (lab.store[b.resource] < 1000) {
                if (_.sum(creep.store) === 0) {
                    if (creep.withdraw(storage, b.resource) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    if (creep.transfer(lab, b.resource) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(lab, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                return;
            }
        }

        // Idle at configured position or storage
        if (roomCfg.idlePos) {
            creep.moveTo(
                new RoomPosition(roomCfg.idlePos.x, roomCfg.idlePos.y, creep.room.name),
                { visualizePathStyle: { stroke: '#888888' } }
            );
        } else {
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#888888' } });
        }
    }
};

module.exports = roleLabManager;