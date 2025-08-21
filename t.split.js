const towerLogic = {
    whitelist: [],

    // Per-room tower settings
    roomConfig: {
        'W14N37': {
            repairWalls: true,
            wallThreshold: 200000,
            repairRamparts: true,
            rampartThreshold: 3000000
        },
        'W15N37': {
            repairWalls: true,
            wallThreshold: 320000,
            repairRamparts: true,
            rampartThreshold: 3000000
        },
        'W13N39': {
            repairWalls: true,
            wallThreshold: 12000,
            repairRamparts: true,
            rampartThreshold: 12000
        }
    },

    run: function () {
        const towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);

        // Group towers by room
        const towersByRoom = _.groupBy(towers, t => t.room.name);

        for (const roomName in towersByRoom) {
            const roomTowers = towersByRoom[roomName];
            const cfg = this.roomConfig[roomName] || {
                repairWalls: false,
                wallThreshold: 0,
                repairRamparts: false,
                rampartThreshold: 0
            };

            const room = Game.rooms[roomName];
            if (!room) continue;

            // Find hostiles in room
            let hostiles = room.find(FIND_HOSTILE_CREEPS, {
                filter: (creep) => !this.whitelist.includes(creep.owner.username)
            });

            if (hostiles.length > 0) {
                // Sort by hits ascending (weakest first)
                hostiles = _.sortBy(hostiles, 'hits');

                // Each tower attacks a different hostile by index
                roomTowers.forEach((tower, i) => {
                    const target = hostiles[i % hostiles.length];
                    if (target) {
                        tower.attack(target);
                    }
                });
                continue; // skip repairs/heals if hostiles present
            }

            // --- Repair logic ---
            let damagedStructures = room.find(FIND_STRUCTURES, {
                filter: (s) => {
                    if (s.structureType === STRUCTURE_WALL) {
                        return cfg.repairWalls && s.hits < cfg.wallThreshold;
                    }
                    if (s.structureType === STRUCTURE_RAMPART) {
                        return cfg.repairRamparts && s.hits < cfg.rampartThreshold;
                    }
                    return s.hits < s.hitsMax &&
                           s.structureType !== STRUCTURE_WALL &&
                           s.structureType !== STRUCTURE_RAMPART;
                }
            });

            if (damagedStructures.length > 0) {
                damagedStructures.sort((a, b) => a.hits - b.hits);
                roomTowers.forEach(tower => tower.repair(damagedStructures[0]));
                continue;
            }

            // --- Heal creeps ---
            const injured = room.find(FIND_MY_CREEPS, {
                filter: (creep) => creep.hits < creep.hitsMax
            });
            if (injured.length > 0) {
                const weakest = _.min(injured, 'hits');
                roomTowers.forEach(tower => tower.heal(weakest));
            }
        }
    }
};

module.exports = towerLogic;