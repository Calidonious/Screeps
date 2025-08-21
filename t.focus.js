const towerLogic = {
    whitelist: [],

    // Per-room tower settings
    roomConfig: {
        'W14N37': {
            repairWalls: true, // 46 walls
            wallThreshold: 200000, // walls get repaired up to this hits
            repairRamparts: true, // 4 ramparts
            rampartThreshold: 3000000
        },
        'W15N37': {
            repairWalls: true, // 22 walls
            wallThreshold: 320000,
            repairRamparts: true, // 2 ramparts
            rampartThreshold: 3000000
        },
        'W13N39': {
            repairWalls: true, // 25 walls
            wallThreshold: 12000,
            repairRamparts: true, // 4 ramparts
            rampartThreshold: 12000
        }
    },

    run: function () {
        const towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);

        towers.forEach(tower => {
            const roomName = tower.room.name;
            const cfg = this.roomConfig[roomName] || {
                repairWalls: false,
                wallThreshold: 0,
                repairRamparts: false,
                rampartThreshold: 0
            };

            // Hostiles in room
            const hostiles = tower.room.find(FIND_HOSTILE_CREEPS, {
                filter: (creep) => !this.whitelist.includes(creep.owner.username)
            });

            if (hostiles.length > 0) {
                // Prioritize healers (creeps with HEAL parts)
                const healers = _.filter(hostiles, c =>
                    c.body.some(part => part.type === HEAL && part.hits > 0)
                );

                let target = null;
                if (healers.length > 0) {
                    // Attack the weakest healer
                    target = _.min(healers, 'hits');
                } else {
                    // Otherwise attack the weakest overall hostile
                    target = _.min(hostiles, 'hits');
                }

                if (target && target !== Infinity) {
                    tower.attack(target);
                    return;
                }
            }

            // Repair logic
            let damagedStructures = tower.room.find(FIND_STRUCTURES, {
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
                tower.repair(damagedStructures[0]);
                return;
            }

            // Heal creeps
            const injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (creep) => creep.hits < creep.hitsMax
            });
            if (injured) {
                tower.heal(injured);
            }
        });
    }
};

module.exports = towerLogic;