const roleLinkManager = {
    run: function () {
        // === Define structure IDs here ===
        const sourceLinks = [
            {
                linkId: 'LINK_ID_1',       // First source link ID
                containerId: 'CONTAINER_ID_1' // Container near first link
            },
            {
                linkId: 'LINK_ID_2',       // Second source link ID
                containerId: 'CONTAINER_ID_2' // Container near second link
            }
        ];

        const centralLinkId = 'CENTRAL_LINK_ID';   // Central link ID
        const storageId = 'STORAGE_ID';            // Storage ID
        // ======================================

        const centralLink = Game.getObjectById(centralLinkId);
        const storage = Game.getObjectById(storageId);

        const isFull = structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) === 0;
        const isEmpty = structure => structure.store[RESOURCE_ENERGY] === 0;

        const transferFromContainers = () => {
            sourceLinks.forEach(({ linkId, containerId }) => {
                const link = Game.getObjectById(linkId);
                const container = Game.getObjectById(containerId);

                if (!link || !container) return;

                const linkNeedsEnergy = link.energy < link.energyCapacity;
                const enoughInContainer = container.store[RESOURCE_ENERGY] >= 100;

                if (enoughInContainer && linkNeedsEnergy && link.cooldown === 0) {
                    container.transfer(link, RESOURCE_ENERGY);
                }

                if (link.energy >= 100 && link.cooldown === 0 && centralLink) {
                    link.transferEnergy(centralLink);
                }
            });
        };

        const transferToStorage = () => {
            if (!centralLink || !storage) return;

            if (
                centralLink.cooldown === 0 &&
                centralLink.energy >= 100 &&
                storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            ) {
                centralLink.transferEnergy(storage);
            }
            
            // Fallback: find needy spawns or extensions
            const room = centralLink.room;

            const needyStructures = room.find(FIND_MY_STRUCTURES, {
                filter: s =>
                    (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) &&
                    s.energy < s.energyCapacity
            });

            if (needyStructures.length > 0) {
                // Just send to the first one that needs it
                centralLink.transferEnergy(needyStructures[0]);
            }
        };

        transferFromContainers();
        transferToStorage();
    }
};

module.exports = roleLinkManager;