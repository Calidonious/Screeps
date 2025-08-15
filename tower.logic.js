const towerLogic = {
    whitelist: [],

    // Per-room tower settings
    roomConfig: {
        'W14N37': {
            repairWalls: true,
            wallThreshold: 200000, // walls get repaired up to this hits
            repairRamparts: true,
            rampartThreshold: 3000000
        },
        'W15N37': {
            repairWalls: true,
            wallThreshold: 300000,
            repairRamparts: true,
            rampartThreshold: 3000000
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

            // Attack hostiles
            const hostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (creep) => !this.whitelist.includes(creep.owner.username)
            });
            if (hostile) {
                tower.attack(hostile);
                return;
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