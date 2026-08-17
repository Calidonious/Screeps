const RENEW_THRESHOLD = 1400;

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
    } else {
        creep.moveTo(new RoomPosition(25, 25,creep.memory.homeRoom, { visualizePathStyle: { stroke: '#ffffff' } }));
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

var rolehallCollector = {

    // room-specific config
    config: {
        'W14N37': {
            idlePos: { x: 22, y: 3 },
            storageId: '688d5a468b99246abd95096f',
            targetRoom: 'W14N36',
            depositId: '',
            useCustomPath: true,
            customPath: [
                { room: 'W14N37', x: 16, y: 44 },
                { room: 'W14N36', x: 20, y: 5 },
            ]
        },
        'W15N37': {
            idlePos: { x: 39, y: 45 },
            storageId: '689593f14c3ddc337079485d',
            targetRoom: 'W13N38',
            depositId: '',
            useCustomPath: true,
            customPath: [
                { room: 'W14N37', x: 25, y: 25 },
                { room: 'W14N38', x: 20, y: 20 },
                { room: 'W13N38', x: 25, y: 25 }
            ]
        },
        'W13N39': {
            idlePos: { x: 7, y: 24 },
            storageId: '68b4bd6f9c4840f48e1ae829',
            targetRoom: 'W13N40',
            depositId: '68c16397285a7f81c0b3e625',
            useCustomPath: true,
            customPath: [
                { room: 'W13N39', x: 20, y: 18 },
                { room: 'W13N40', x: 38, y: 43 },
            ]
        },
        'W13N33': {
            idlePos: { x: 5, y: 11 },
            storageId: '68bcf12d24113a2b16da16d5',
            targetRoom: 'W13N40',
            depositId: '68ce48fe41ac19b556a39163',
            useCustomPath: true,
            customPath: [
                { room: 'W13N39', x: 20, y: 18 },
                { room: 'W13N40', x: 38, y: 43 },
            ]
        },
        'W23N34': {
            idlePos: { x: 14, y: 42 },
            storageId: '68f682150fb1f8a4d6e87cb1',
            targetRoom: 'W13N40',
            depositId: '68ce48fe41ac19b556a39163',
            useCustomPath: true,
            customPath: [
                { room: 'W13N39', x: 20, y: 18 },
                { room: 'W13N40', x: 38, y: 43 },
            ]
        },
    },

    run: function(creep) {
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) stopRenewing(creep);
        
        const homeRoom = creep.memory.homeRoom;
        const cfg = this.config[homeRoom];
        if (!cfg) return;

        this.runPowerCollector(creep, homeRoom, cfg);
    },

    runPowerCollector: function(creep, homeRoom, cfg) {
        if (!cfg || !cfg.storageId || !cfg.targetRoom) return;

        if (!creep.memory.state) {
            creep.memory.state = "renewing";
        }

        const storage = Game.getObjectById(cfg.storageId);

        // --- RENEWING ---
        if (creep.memory.state === "renewing") {
            const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                if (creep.ticksToLive < RENEW_THRESHOLD) {
                    if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                    creep.say("🔋");
                    return;
                } else {
                    creep.memory.state = "collecting";
                    creep.say("🫴");
                }
            }
        }

        // --- COLLECTING ---
        if (creep.memory.state === "collecting") {
            if (_.sum(creep.store) === creep.store.getCapacity() || creep.ticksToLive < 300) {
                creep.memory.state = "delivering";
                creep.say("📦");
            } else {
                if (creep.room.name !== cfg.targetRoom) {
                    if (cfg.useCustomPath && cfg.customPath.length > 0) {
                        this.followPath(creep, cfg.customPath);
                    } else {
                        creep.moveTo(new RoomPosition(25, 25, cfg.targetRoom));
                    }
                } else {
                    let target = cfg.depositId ? Game.getObjectById(cfg.depositId)
                        : creep.pos.findClosestByPath(FIND_DEPOSITS);

                    if (target && creep.harvest(target) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                    } else if (!target) {
                        this.moveToIdle(creep, creep.room.name, cfg);
                    }
                }
            }
            return;
        }

        // --- DELIVERING ---
        if (creep.memory.state === "delivering") {
            if (_.sum(creep.store) === 0) {
                creep.memory.state = "renewing";
                creep.say("🔋");
            } else {
                if (creep.room.name !== homeRoom) {
                    if (cfg.useCustomPath && cfg.customPath.length > 0) {
                        this.followPath(creep, cfg.customPath.slice().reverse());
                    } else {
                        creep.moveTo(new RoomPosition(25, 25, homeRoom));
                    }
                } else if (storage) {
                    for (const res in creep.store) {
                        if (creep.transfer(storage, res) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                }
            }
            return;
        }
    },

    // helper for path following
    followPath: function (creep, path) {
        if (creep.memory.pathIndex === undefined) creep.memory.pathIndex = 0;
        const step = path[creep.memory.pathIndex];
        if (!step) { creep.memory.pathIndex = undefined; return; }
    
        if (creep.pos.roomName === step.room && creep.pos.x === step.x && creep.pos.y === step.y) {
            creep.memory.pathIndex++;
        } else {
            creep.moveTo(new RoomPosition(step.x, step.y, step.room),
                { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    },

    moveToIdle: function (creep, roomName, cfg) {
        if (cfg.idlePos) {
            creep.moveTo(new RoomPosition(cfg.idlePos.x, cfg.idlePos.y, roomName),
                { visualizePathStyle: { stroke: '#ffaa00' } });
        } else {
            creep.moveTo(new RoomPosition(25, 25, roomName), { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
};

module.exports = rolehallCollector;