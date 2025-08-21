const towerLogic = {
    whitelist: [],

    // Number of ticks before switching fire mode (global)
    cycleLength: 3,

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
        const towersByRoom = _.groupBy(towers, t => t.room.name);

        for (const roomName in towersByRoom) {
            const roomTowers = towersByRoom[roomName];
            const room = Game.rooms[roomName];
            if (!room) continue;

            const cfg = this.roomConfig[roomName] || {
                repairWalls: false,
                wallThreshold: 0,
                repairRamparts: false,
                rampartThreshold: 0
            };

            // Hostiles in room
            const hostiles = room.find(FIND_HOSTILE_CREEPS, {
                filter: (creep) => !this.whitelist.includes(creep.owner.username)
            });

            if (hostiles.length > 0) {
                // Prioritize healers (creeps with HEAL parts)
                const healers = _.filter(hostiles, c =>
                    c.body.some(part => part.type === HEAL && part.hits > 0)
                );

                if (healers.length > 0 && roomTowers.length >= 2) {
                    const healer = _.min(healers, 'hits');
                    const others = _.filter(hostiles, h => h.id !== healer.id);

                    // Decide phase of cycle
                    const cyclePos = Math.floor(Game.time / this.cycleLength) % 2;

                    if (cyclePos === 0 || others.length === 0) {
                        // Focus-fire phase: all towers hit healer
                        roomTowers.forEach(t => t.attack(healer));
                    } else {
                        // Split-fire phase: one tower hits healer, others hit attackers
                        roomTowers[0].attack(healer);
                        if (roomTowers[1] && others[0]) {
                            roomTowers[1].attack(others[0]);
                        }
                        for (let i = 2; i < roomTowers.length; i++) {
                            if (others[i - 1]) {
                                roomTowers[i].attack(others[i - 1]);
                            } else {
                                roomTowers[i].attack(healer);
                            }
                        }
                    }
                } else {
                    // No healer, just attack weakest
                    const target = _.min(hostiles, 'hits');
                    roomTowers.forEach(t => t.attack(target));
                }
                continue;
            }

            // Repair logic
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
                roomTowers.forEach(t => t.repair(damagedStructures[0]));
                continue;
            }

            // Heal creeps
            const injured = room.find(FIND_MY_CREEPS, {
                filter: (creep) => creep.hits < creep.hitsMax
            });
            if (injured.length > 0) {
                injured.sort((a, b) => a.hits - b.hits);
                roomTowers.forEach(t => t.heal(injured[0]));
            }
        }
    }
};

module.exports = towerLogic;