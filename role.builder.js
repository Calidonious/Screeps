const HARVEST_SOURCE_ID = '5bbcac169099fc012e634e2f';
const STORAGE_ID = '688d5a468b99246abd95096f';
const IDLE_POS = new RoomPosition(8, 27, 'W14N37');
const REPAIR_HOLD = 3000000

const RENEW_THRESHOLD = 1000; // Minimum desired life span after renewal

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


function doBuild(creep) {
    const allSites = creep.room.find(FIND_CONSTRUCTION_SITES);

    // No build sites? Clean up and bail.
    if (allSites.length === 0) {
        delete creep.memory.buildTarget;
        return false;
    }

    // Try to get assigned target
    let target = Game.getObjectById(creep.memory.buildTarget);

    // If no target or it's finished, assign a new one
    if (!target || target.progress >= target.progressTotal) {
        // Remove old assignment
        delete creep.memory.buildTarget;

        // Find all buildTargets currently used by other builders
        const usedTargets = _.map(
            _.filter(Game.creeps, c => c.memory.role === 'builder' && c.memory.buildTarget),
            c => c.memory.buildTarget
        );

        // Prefer unassigned sites
        const unassigned = allSites.find(site => !usedTargets.includes(site.id));

        // Fallback to any site
        const assignedTarget = unassigned || allSites[0];

        creep.memory.buildTarget = assignedTarget.id;
        target = assignedTarget;
    }

    // Move to and build the assigned site
    if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        creep.say('🚧');
    }

    return true;
}


function doRepair(creep) {
    const targets = creep.room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_RAMPART && s.hits < REPAIR_HOLD
    });

    if (targets.length > 0) {
        targets.sort((a, b) => a.hits - b.hits);
        if (creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('🛠️');
        }
        return true;
    }
    return false;
}

function withdrawFromStorage(creep) {
    const storage = Game.getObjectById(STORAGE_ID);
    
    // try storage
    if (storage && storage.store[RESOURCE_ENERGY] > 0) {
        if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('🫴');
        }
        return;
    } 
    // Step 2: Try containers with energy
    const containers = creep.room.find(FIND_STRUCTURES, {
        filter: s =>
            s.structureType === STRUCTURE_CONTAINER &&
            s.store[RESOURCE_ENERGY] > 0
    });

    if (containers.length > 0) {
        if (creep.withdraw(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(containers[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('🫴Alt');
        }
        return;
    }

    // Step 3: Try spawns
    const spawns = creep.room.find(FIND_MY_SPAWNS, {
        filter: s => s.store && s.store[RESOURCE_ENERGY] > 0
    });

    if (spawns.length > 0) {
        if (creep.withdraw(spawns[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawns[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('🫴AltSpawn');
        }
        return;
    }

    // Optional: indicate no available source
    creep.say('❌ withdraw');
}


function harvestEnergy(creep) {
    const source = Game.getObjectById(HARVEST_SOURCE_ID);
    if (source && source.energy > 0) {
        if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            creep.say('🚜');
        }
    } else {
        creep.say('❌ source');
        creep.moveTo(14,14);
    }
}

function depositEnergy(creep) {
    const storage = Game.getObjectById(STORAGE_ID);
    if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('📦Storage');
        }
        return true;
    }

    const targets = creep.room.find(FIND_STRUCTURES, {
        filter: s =>
            (s.structureType === STRUCTURE_SPAWN ||
             s.structureType === STRUCTURE_EXTENSION ||
             s.structureType === STRUCTURE_TOWER ||
             s.structureType === STRUCTURE_CONTAINER) &&
            s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });

    if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
            creep.say('📦Alt');
        }
        return true;
    }

    return false;
}

function idle(creep) {
    if (!creep.pos.isEqualTo(IDLE_POS)) {
        creep.moveTo(IDLE_POS, { visualizePathStyle: { stroke: '#888888' } });
    }
}

var roleBuilder = {
    run: function (creep) {
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


        // Set initial state
        if (!creep.memory.state) {
            creep.memory.state = 'build';
        }

        // State switching
        if (creep.memory.state === 'build') {
            if (creep.store[RESOURCE_ENERGY] === 0) {
                withdrawFromStorage(creep);
            } else if (!doBuild(creep)) {
                creep.memory.state = 'repair';
            }
        }

        if (creep.memory.state === 'repair') {
            if (creep.store[RESOURCE_ENERGY] === 0) {
                withdrawFromStorage(creep);
            } else if (!doRepair(creep)) {
                creep.memory.state = 'harvest';
            }
        }

        if (creep.memory.state === 'harvest') {
            if (creep.store.getFreeCapacity() > 0) {
                harvestEnergy(creep);
            } else {
                if (!depositEnergy(creep)) {
                    idle(creep);
                }
            }

            // If build/repair tasks return, resume
            if (creep.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
                creep.memory.state = 'build';
            } else if (creep.room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_RAMPART && s.hits < REPAIR_HOLD
            }).length > 0) {
                creep.memory.state = 'repair';
            }
            return;
        }

        if (creep.memory.state === 'fill') {
            const source = Game.getObjectById(HARVEST_SOURCE_ID);
            if (source && source.energy > 0) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }

            if (creep.store.getFreeCapacity() === 0) {
                if (creep.room.find(FIND_CONSTRUCTION_SITES).length > 0) {
                    creep.memory.state = 'build';
                } else if (creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === STRUCTURE_RAMPART && s.hits < REPAIR_HOLD
                }).length > 0) {
                    creep.memory.state = 'repair';
                } else {
                    creep.memory.state = 'harvest';
                }
            }
            
            if (creep.memory.state !== 'build') {
                const hasBuildWork = creep.room.find(FIND_CONSTRUCTION_SITES).length > 0;
                if (hasBuildWork) {
                    creep.memory.state = 'build';
                    delete creep.memory.buildTarget; // clear old assignment when re-entering build state
                    return;
                }
            }

            if (creep.memory.state !== 'repair') {
                const hasRepairWork = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType === STRUCTURE_RAMPART && s.hits < REPAIR_HOLD
                }).length > 0;
                if (hasRepairWork) {
                    creep.memory.state = 'repair';
                    return;
                }
            }
        }
    }
};

module.exports = roleBuilder;
