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

var roleCollector = {
    config: {
        'W14N37': {
            // group 1: Grim Reaper
            group1: {
                idlePos: { x: 9, y: 23 },
                dropoffId: '688d5a468b99246abd95096f',
                storageId: '688d5a468b99246abd95096f',
                collectEnergy: false,
                maintainTerminal: true,
                terminalId: '68a0005110ab6307347c0d2e',
                terminalEnergyTarget: 5000
            },
            // group 2: Market tender & Lab tech
            group2: {
                idlePos: { x: 9, y: 23 },
                sourceId: '68a0005110ab6307347c0d2e', //terminal
                targets: [
                    {
                        targetId: '688d5a468b99246abd95096f', // storage
                        transfers: {
                            [RESOURCE_ENERGY]: { enabled: false, amount: 200000 },
                            [RESOURCE_GHODIUM_OXIDE]: { enabled: true, amount: 20000 },
                            [RESOURCE_KEANIUM_OXIDE]: { enabled: true, amount: 20000 },
                            [RESOURCE_ZYNTHIUM_HYDRIDE]: { enabled: true, amount: 20000 },
                            [RESOURCE_UTRIUM_HYDRIDE]: { enabled: true, amount: 20000 },
                            [RESOURCE_SILICON]: { enabled: true, amount: 20000 },
                        }
                    },
                    {
                        targetId: '', // lab
                        transfers: {
                            [RESOURCE_HYDROGEN]: { enabled: false, amount: 0 }
                        }
                    },
                ]
            },
            // group 3: Mineral hauler
            group3: {
                idlePos: { x: 9, y: 23 },
                storageId: '688d5a468b99246abd95096f', // where to deliver minerals
                sources: [
                    { id: '68a0005110ab6307347c0d2e' }, // terminal
                    { id: '' }, // example: lab
                ]
            },
            group4: {
                idlePos: { x: 9, y: 23 },
                storageId: '688d5a468b99246abd95096f', // deliver target in home
                targetRoom: 'W13N38',
                depositId: '', // optional deposit id, leave blank = pick any
                useCustomPath: true,
                customPath: [
                    { room: 'W14N37', x: 25, y: 25 },
                    { room: 'W14N38', x: 20, y: 20 },
                    { room: 'W13N38', x: 25, y: 25 }
                ]
            }
        },
        'W15N37': {
            group1: {
                idlePos: { x: 39, y: 46 },
                dropoffId: '689ec5ee57237e81b20999b7',
                storageId: '689593f14c3ddc337079485d',
                collectEnergy: false,
                maintainTerminal: true,
                terminalId: '689ec5ee57237e81b20999b7',
                terminalEnergyTarget: 5000
            },
            group2: {
                idlePos: { x: 39, y: 45 },
                sourceId: '689ec5ee57237e81b20999b7',
                targets: [
                    {
                        targetId: '689593f14c3ddc337079485d',
                        transfers: {
                            [RESOURCE_ENERGY]: { enabled: false, amount: 300000 }
                        }
                    }
                ]
            },
            group3: {
                idlePos: { x: 39, y: 45 },
                storageId: '689593f14c3ddc337079485d',
                sources: [
                    { id: '689ec5ee57237e81b20999b7' }, // terminal
                ]
            },
            group4: {
                idlePos: { x: 39, y: 45 },
                storageId: '689593f14c3ddc337079485d', // deliver target in home
                targetRoom: 'W13N38',
                depositId: '', // optional deposit id, leave blank = pick any
                useCustomPath: true,
                customPath: [
                    { room: 'W14N37', x: 25, y: 25 },
                    { room: 'W14N38', x: 20, y: 20 },
                    { room: 'W13N38', x: 25, y: 25 }
                ]
            }
        },
        'W13N39': {
            group1: {
                idlePos: { x: 7, y: 24 },
                dropoffId: '68b4bd6f9c4840f48e1ae829',
                storageId: '68a688e6d89b6f1cd82a4e03',
                collectEnergy: false,
                maintainTerminal: true,
                terminalId: '68b4bd6f9c4840f48e1ae829',
                terminalEnergyTarget: 5000
            },
            group2: {
                idlePos: { x: 7, y: 25 },
                sourceId: '68b4bd6f9c4840f48e1ae829',
                targets: [
                    {
                        targetId: '68a688e6d89b6f1cd82a4e03',
                        transfers: {
                            [RESOURCE_OXYGEN]: { enabled: true, amount: 50000 }
                        }
                    }
                ]
            },
            group3: {
                idlePos: { x: 7, y: 24 },
                storageId: '68a688e6d89b6f1cd82a4e03',
                sources: [
                    { id: '68b4bd6f9c4840f48e1ae829' }, // terminal
                ]
            },
            group4: {
                idlePos: { x: 7, y: 24 },
                storageId: '68b4bd6f9c4840f48e1ae829', // deliver target in home
                targetRoom: 'W13N40',
                depositId: '68af26d782aa226d643c2f49', // optional deposit id, leave blank = pick any
                useCustomPath: true,
                customPath: [
                    { room: 'W13N39', x: 20, y: 18 },
                    { room: 'W13N40', x: 32, y: 38 },
                ]
            }
        }
    },

    run: function (creep) {
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) stopRenewing(creep);

        const homeRoom = creep.memory.homeRoom || creep.room.name;
        const group = creep.memory.group || 1;
        const roomCfg = this.config[homeRoom];
        if (!roomCfg) return;

        if (group === 1) {
            this.runGroup1(creep, homeRoom, roomCfg.group1 || {});
        } else if (group === 2) {
            this.runGroup2(creep, homeRoom, roomCfg.group2 || {});
        } else if (group === 3) {
            this.runGroup3(creep, homeRoom, roomCfg.group3 || {});
        } else if (group === 4) {
            this.runGroup4(creep, homeRoom, roomCfg.group4 || {});
        }
    },
    
    // Group 1: grim reaper + terminal maintainer
    runGroup1: function (creep, homeRoom, cfg) {
        if (!cfg) return;

        const hostiles = (Game.rooms[homeRoom] && Game.rooms[homeRoom].find(FIND_HOSTILE_CREEPS)) || [];
        if (hostiles.length > 0) {
            this.moveToIdle(creep, homeRoom, cfg);
            return;
        }

        // Terminal maintenance
        if (cfg.maintainTerminal && cfg.terminalId && cfg.storageId) {
            const terminal = Game.getObjectById(cfg.terminalId);
            const storage = Game.getObjectById(cfg.storageId);

            if (terminal && storage) {
                if (_.sum(creep.store) === 0 && terminal.store[RESOURCE_ENERGY] < cfg.terminalEnergyTarget) {
                    if (storage.store[RESOURCE_ENERGY] > 0) {
                        if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
                        }
                        return;
                    }
                }

                if (creep.store[RESOURCE_ENERGY] > 0 && terminal.store[RESOURCE_ENERGY] < cfg.terminalEnergyTarget) {
                    if (creep.transfer(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                    return;
                }
            }
        }

        if (_.sum(creep.store) === creep.store.getCapacity()) {
            this.deliverResources(creep, cfg);
            return;
        }

        // Scavenge dropped resources
        const dropped = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: r => (cfg.collectEnergy || r.resourceType !== RESOURCE_ENERGY) && r.amount > 0
        });
        if (dropped.length > 0) {
            const closest = creep.pos.findClosestByPath(dropped);
            if (closest && creep.pickup(closest) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }

        // Tombstones
        const tombstones = creep.room.find(FIND_TOMBSTONES, {
            filter: t => {
                if (!cfg.collectEnergy) {
                    return _.some(Object.keys(t.store), res => res !== RESOURCE_ENERGY && t.store[res] > 0);
                }
                return _.sum(t.store) > 0;
            }
        });
        if (tombstones.length > 0) {
            const closest = creep.pos.findClosestByPath(tombstones);
            if (closest) {
                for (const res in closest.store) {
                    if (!cfg.collectEnergy && res === RESOURCE_ENERGY) continue;
                    if (closest.store[res] > 0 && creep.withdraw(closest, res) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                }
            }
            return;
        }

        if (_.sum(creep.store) > 0) {
            this.deliverResources(creep, cfg);
            return;
        }

        this.moveToIdle(creep, homeRoom, cfg);
    },

    // Group 2: Market tender & lab tech
    runGroup2: function (creep, homeRoom, cfg) {
        if (!cfg) return;

        const source = Game.getObjectById(cfg.sourceId);
        if (!source || !cfg.targets || cfg.targets.length === 0) {
            this.moveToIdle(creep, homeRoom, cfg);
            return;
        }

        if (_.sum(creep.store) > 0) {
            for (const res in creep.store) {
                const target = this.findTargetForResource(cfg.targets, res);
                if (target) {
                    if (creep.transfer(target, res) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
            return;
        }

        for (let t of cfg.targets) {
            const target = Game.getObjectById(t.targetId);
            if (!target) continue;

            for (const res in t.transfers) {
                const plan = t.transfers[res];
                if (!plan.enabled) continue;

                const have = target.store[res] || 0;
                if (have < plan.amount && source.store[res] > 0) {
                    if (creep.withdraw(source, res) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                    return;
                }
            }
        }

        this.moveToIdle(creep, homeRoom, cfg);
    },

    // Group 3: Mineral hauler
    runGroup3: function (creep, homeRoom, cfg) {
        if (!cfg || !cfg.sources || !cfg.storageId) return;
    
        const storage = Game.getObjectById(cfg.storageId);
        if (!storage) return;
    
        // 1. If full → deliver immediately
        if (_.sum(creep.store) === creep.store.getCapacity()) {
            this.deliverToStorage(creep, storage);
            return;
        }
    
        // 2. Look for minerals in any configured sources
        for (let s of cfg.sources) {
            const source = Game.getObjectById(s.id);
            if (!source) continue;
    
            const minerals = Object.keys(source.store).filter(res => res !== RESOURCE_ENERGY && source.store[res] > 0);
            if (minerals.length > 0) {
                const res = minerals[0];
                if (creep.withdraw(source, res) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return; // stop after targeting one mineral source
            }
        }
    
        // 3. No minerals found in sources
        if (_.sum(creep.store) > 0) {
            // Deliver any partial load
            this.deliverToStorage(creep, storage);
        } else {
            // 4. Nothing to do → idle
            this.moveToIdle(creep, homeRoom, cfg);
        }
    },
    
    // === Group 4: Deposit / Power bank collector ===
    runGroup4: function(creep, homeRoom, cfg) {
        if (!cfg || !cfg.storageId || !cfg.targetRoom) return;
    
        // Initialize state
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
                    // go to target room
                    if (cfg.useCustomPath && cfg.customPath.length > 0) {
                        this.followPath(creep, cfg.customPath);
                    } else {
                        creep.moveTo(new RoomPosition(25, 25, cfg.targetRoom));
                    }
                } else {
                    // at target room → look for deposit
                    let target = cfg.depositId ? Game.getObjectById(cfg.depositId) : creep.pos.findClosestByPath(FIND_DEPOSITS);
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
                creep.memory.state = "renewing"; // restart cycle
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


    deliverToStorage: function (creep, storage) {
        for (const res in creep.store) {
            if (res === RESOURCE_ENERGY) continue; // skip energy
            if (creep.transfer(storage, res) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    },

    findTargetForResource: function (targets, resource) {
        for (let t of targets) {
            const target = Game.getObjectById(t.targetId);
            if (!target) continue;
            const plan = t.transfers[resource];
            if (plan && plan.enabled) {
                return target;
            }
        }
        return null;
    },

    deliverResources: function (creep, cfg) {
        let target = null;
        if (cfg.dropoffId) target = Game.getObjectById(cfg.dropoffId);
        if (!target) {
            target = creep.room.storage ||
                creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: s => (s.structureType === STRUCTURE_CONTAINER ||
                        s.structureType === STRUCTURE_STORAGE) &&
                        _.sum(s.store) < s.storeCapacity
                });
        }
        if (target) {
            for (const res in creep.store) {
                if (creep.store[res] > 0) {
                    if (creep.transfer(target, res) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
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

module.exports = roleCollector;