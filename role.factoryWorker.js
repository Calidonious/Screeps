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

const roleFactoryWorker = {
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
        
        const roomName = creep.memory.homeRoom;
        const fMem = Memory.factory && Memory.factory[roomName];
        if (!fMem || !fMem.factoryId) {
            creep.say('❌NoFac');
            return;
        }

        const factory = Game.getObjectById(fMem.factoryId);
        if (!factory) return;

        const storage = creep.room.storage;
        const terminal = creep.room.terminal;

        // Mode switching
        if (creep.memory.delivering && _.sum(creep.store) === 0) {
            creep.memory.delivering = false;
            creep.say('📥'); // collect
        }
        if (!creep.memory.delivering && _.sum(creep.store) === creep.store.getCapacity()) {
            creep.memory.delivering = true;
            creep.say('📦'); // deliver
        }

        // === Delivering ===
        if (creep.memory.delivering) {
            // Deliver inputs to factory
            if (creep.memory.targetInput) {
                const res = creep.memory.targetInput;
                if (creep.transfer(factory, res) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(factory, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else {
                    creep.memory.targetInput = null; // done
                }
                return;
            }
            
            // Drop outputs first
            if (Object.keys(creep.store).length > 0) {
                const res = Object.keys(creep.store)[0];
                const target = (fMem.outputTarget === 'terminal' && terminal) ? terminal : storage;
                if (target) {
                    if (creep.transfer(target, res) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
                return;
            }

            

            // Idle at custom position if defined
            if (fMem.idlePos) {
                creep.moveTo(new RoomPosition(fMem.idlePos.x, fMem.idlePos.y, roomName), 
                    { visualizePathStyle: { stroke: '#8888ff' } });
            } else {
                creep.moveTo(factory, { visualizePathStyle: { stroke: '#8888ff' } });
            }
            return;
        }

        // === Collecting ===
        // Priority 1: take outputs
        if (fMem.outputs && fMem.outputs.length > 0) {
            const res = fMem.outputs[0].resource;
            if (factory.store[res] > 0) {
                if (creep.withdraw(factory, res) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(factory, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
        }

        // Priority 2: fetch missing inputs
        if (fMem.needs && fMem.needs.length > 0) {
            const need = fMem.needs[0];
            const source = (fMem.inputSource === 'terminal' && terminal) ? terminal : storage;
            if (source && (source.store[need.resource] || 0) > 0) {
                if (creep.withdraw(source, need.resource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else {
                    creep.memory.targetInput = need.resource;
                }
                return;
            }
        }

        // Idle at custom position if defined
        if (fMem.idlePos) {
            creep.moveTo(new RoomPosition(fMem.idlePos.x, fMem.idlePos.y, roomName), 
                { visualizePathStyle: { stroke: '#8888ff' } });
        } else {
            creep.moveTo(factory, { visualizePathStyle: { stroke: '#8888ff' } });
        }
    }
};

module.exports = roleFactoryWorker;