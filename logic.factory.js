const FACTORY_CONFIG = {
    'W14N37': {
        enabled: false,                 // toggle factory logic
        mode: 'produce',               // "produce" or "unpack"
        product: RESOURCE_BATTERY,     // what to produce/unpack
        amount: 5000,                  // target stockpile (skip if >= this)
        inputSource: 'storage',        // "storage" or "terminal"
        outputTarget: 'storage',
        idlePos: { x: 9, y: 27 }
    },
    'W15N37': {
        enabled: false,                // disabled until toggled on
        mode: 'unpack',
        product: RESOURCE_BATTERY,
        inputSource: 'storage',
        outputTarget: 'storage',
        idlePos: { x: 36, y: 46 }
    }
};

const factoryLogic = {
    run: function () {
        if (!Memory.factory) Memory.factory = {};

        for (const roomName in FACTORY_CONFIG) {
            const cfg = FACTORY_CONFIG[roomName];
            if (!cfg.enabled) continue;  // 🚫 skip if disabled

            const room = Game.rooms[roomName];
            if (!room) continue;

            const factory = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_FACTORY
            })[0];
            if (!factory) continue;

            // Prepare memory entry
            if (!Memory.factory[roomName]) Memory.factory[roomName] = {};
            const fMem = Memory.factory[roomName];
            fMem.room = roomName;
            fMem.product = cfg.product;
            fMem.mode = cfg.mode;
            fMem.factoryId = factory.id;
            fMem.inputSource = cfg.inputSource;
            fMem.outputTarget = cfg.outputTarget;
            fMem.idlePos = cfg.idlePos;   // ✅ store idle pos for workers

            // Reset orders each tick
            fMem.needs = [];
            fMem.outputs = [];

            if (factory.cooldown > 0) continue;

            // === PRODUCE ===
            if (cfg.mode === 'produce') {
                const totalStock = (room.storage ? room.storage.store[cfg.product] || 0 : 0) +
                                   (room.terminal ? room.terminal.store[cfg.product] || 0 : 0) +
                                   (factory.store[cfg.product] || 0);
                if (cfg.amount && totalStock >= cfg.amount) continue;

                const recipe = COMMODITIES[cfg.product];
                if (!recipe) continue;

                for (const res in recipe.components) {
                    const need = recipe.components[res];
                    if ((factory.store[res] || 0) < need) {
                        fMem.needs.push({ resource: res, amount: need });
                    }
                }

                if (factory.store[cfg.product] > 0) {
                    fMem.outputs.push({ resource: cfg.product, amount: factory.store[cfg.product] });
                }

                let canMake = true;
                for (const res in recipe.components) {
                    if ((factory.store[res] || 0) < recipe.components[res]) {
                        canMake = false;
                        break;
                    }
                }
                if (canMake) {
                    const result = factory.produce(cfg.product);
                    if (result === OK) {
                        console.log(`🏭 [${roomName}] Factory producing ${cfg.product}`);
                    }
                }
            }

            // === UNPACK ===
            if (cfg.mode === 'unpack') {
                if (factory.store[cfg.product] > 0) {
                    const result = factory.produce(cfg.product);
                    if (result === OK) {
                        console.log(`🏭 [${roomName}] Factory unpacking ${cfg.product}`);
                    }
                }
                if (factory.store[cfg.product] > 0) {
                    fMem.outputs.push({ resource: cfg.product, amount: factory.store[cfg.product] });
                }
            }
        }
    }
};

module.exports = factoryLogic;