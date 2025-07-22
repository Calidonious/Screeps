var towerLogic = {
    // Define the whitelist of usernames
    whitelist: ['Jaycee', 'OtherAllyUsername'],

    run: function () {
        var towers = Game.spawns['Spawn1'].room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_TOWER
        });
        
        towers.forEach(tower => {
            // Check for hostile creeps
            var hostileCreep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (creep) => !towerLogic.whitelist.includes(creep.owner.username) // Check if the creep owner is not in the whitelist
            });
            if (hostileCreep) {
                tower.attack(hostileCreep);
            } else {
                // Find damaged structures
                var damagedStructures = tower.room.find(FIND_STRUCTURES, {
                    filter: (structure) => structure.hits < structure.hitsMax && 
                    structure.structureType != STRUCTURE_WALL && 
                    structure.structureType != STRUCTURE_RAMPART
                });
                if (damagedStructures.length > 0) {
                    damagedStructures.sort((a, b) => a.hits - b.hits);
                    tower.repair(damagedStructures[0]);
                } else {
                    // Find injured creeps and heal them
                    var injuredCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: (creep) => creep.hits < creep.hitsMax
                    });
                    if (injuredCreep) {
                        tower.heal(injuredCreep);
                    }
                }
            }
        });
    }
};

module.exports = towerLogic;