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
                terminalEnergyTarget: 2000
            },
            // group 2: Market tender & Lab tech
            group2: {
                idlePos: { x: 9, y: 23 },
                sourceId: '688d5a468b99246abd95096f',
                targets: [
                    {
                        targetId: '68a0005110ab6307347c0d2e',
                        transfers: {
                            [RESOURCE_HYDROGEN]: { enabled: false, amount: 0 }
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
                sourceId: '689593f14c3ddc337079485d',
                targets: [
                    {
                        targetId: '689ec5ee57237e81b20999b7',
                        transfers: {
                            [RESOURCE_UTRIUM]: { enabled: false, amount: 0 }
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