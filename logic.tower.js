const towerLogic = {
    whitelist: [],

    // Base mode if alternation is disabled
    mode: "focus", // "focus" | "split"

    // Auto-alternation config
    alternation: {
        enabled: true,  // toggle auto alternation
        interval: 2,    // ticks between switching modes
        lastSwitch: 0,   // internal state
        currentMode: "focus"
    },

    // Per-room tower settings
    roomConfig: {
        'W14N37': { // 46 walls, 4 ramparts - 50 total
            repairWalls: true,
            wallThreshold: 675000,
            repairRamparts: true,
            rampartThreshold: 3000000
        },
        'W15N37': { // 22 walls, 3 ramparts - 25 total
            repairWalls: true,
            wallThreshold: 675000,
            repairRamparts: true,
            rampartThreshold: 3000000
        },
        'W13N39': { // 25 walls, 6 ramparts - 31 total
            repairWalls: true,
            wallThreshold: 675000,
            repairRamparts: true,
            rampartThreshold: 3000000
        },
        'W13N33': { // 39 walls, 9 ramparts - 48 total
            repairWalls: true,
            wallThreshold: 275000,
            repairRamparts: true,
            rampartThreshold: 275000
        }
    },

    getMode: function (healers) {
        if (!this.alternation.enabled || healers.length === 0) {
            return this.mode; // manual or fallback mode
        }

        // Auto alternation (only when healers are present)
        if (Game.time - this.alternation.lastSwitch >= this.alternation.interval) {
            this.alternation.currentMode =
                this.alternation.currentMode === "focus" ? "split" : "focus";
            this.alternation.lastSwitch = Game.time;

            console.log(`[TowerLogic] Switched to ${this.alternation.currentMode} mode (healers detected)`);
        }
        return this.alternation.currentMode;
    },

    run: function () {
        const towers = _.filter(Game.structures, s => s.structureType === STRUCTURE_TOWER);

        towers.forEach((tower, idx) => {
            const roomName = tower.room.name;
            const cfg = this.roomConfig[roomName] || {
                repairWalls: false,
                wallThreshold: 0,
                repairRamparts: false,
                rampartThreshold: 0
            };

            // Hostiles
            const hostiles = tower.room.find(FIND_HOSTILE_CREEPS, {
                filter: (creep) => !this.whitelist.includes(creep.owner.username)
            });

            if (hostiles.length > 0) {
                const healers = _.filter(hostiles, c =>
                    c.body.some(part => part.type === HEAL && part.hits > 0)
                );

                const currentMode = this.getMode(healers);

                let target = null;

                if (currentMode === "focus") {
                    // === FOCUS MODE ===
                    if (healers.length > 0) {
                        target = _.min(healers, 'hits');
                    } else {
                        target = _.min(hostiles, 'hits');
                    }
                } else if (currentMode === "split") {
                    // === SPLIT MODE ===
                    if (healers.length > 2) {
                        target = healers[idx % healers.length];
                    } else {
                        target = hostiles[idx % hostiles.length];
                    }
                }

                if (target && target !== Infinity) {
                    tower.attack(target);
                    return;
                }
            }
            
            // Heal creeps
            const injured = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (creep) => creep.hits < creep.hitsMax
            });
            if (injured) {
                tower.heal(injured);
            }

            // === No hostiles, do repairs/heals ===
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
        });
    }
};

module.exports = towerLogic;