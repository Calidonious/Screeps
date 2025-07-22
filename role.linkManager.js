var roleLinkManager = {
    run: function(link) {
        // Find target structures
        var spawn = link.room.find(FIND_MY_SPAWNS)[0];
        var extensions = link.room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_EXTENSION }
        });
        var storage = link.room.storage;
        var tower = link.room.find(FIND_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        })[0];

        // Transfer energy based on priority
        if (spawn && spawn.energy < spawn.energyCapacity) {
            link.transferEnergy(spawn);
        } else if (extensions.length > 0) {
            for (let extension of extensions) {
                if (extension.energy < extension.energyCapacity) {
                    link.transferEnergy(extension);
                    break; // Transfer to one extension at a time
                }
            }
        } else if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            link.transferEnergy(storage);
        } else if (tower && tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            link.transferEnergy(tower);
        }
    }
};

module.exports = roleLinkManager;