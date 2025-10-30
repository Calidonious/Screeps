var terminalLogic = {
    config: {
        W14N37: {
            id: '68a0005110ab6307347c0d2e',
            mode: 'recieve', // or 'receive'
            partners: [
                {
                    room: 'W23N34',
                    sendResources: {
                        [RESOURCE_ENERGY]: { enabled: false, amount: 420000 },
                        [RESOURCE_HYDROGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_OXYGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_KEANIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_LEMERGIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_UTRIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_CATALYST]: { enabled: false, amount: 10000 },
                        [RESOURCE_ZYNTHIUM]: { enabled: false, amount: 10000 },
                        // Regional resources
                        [RESOURCE_METAL]: { enabled: false, amount: 10000 },
                        [RESOURCE_BIOMASS]: { enabled: false, amount: 1000 },
                        [RESOURCE_SILICON]: { enabled: false, amount: 10000 },
                        [RESOURCE_MIST]: { enabled: false, amount: 10000 },
                        // Power creep resources
                        [RESOURCE_POWER]: { enabled: false, amount: 1000 },
                        [RESOURCE_OPS]: { enabled: false, amount: 1000 },
                        // Factory intermediates
                        [RESOURCE_REDUCTANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_OXIDANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_KEANIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_LEMERGIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_PURIFIER]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM_MELT]: { enabled: false, amount: 1000 },
                        // Factory Products
                        [RESOURCE_BATTERY]: { enabled: false, amount: 1000 },
                        [RESOURCE_COMPOSITE]: { enabled: false, amount: 100 },
                        [RESOURCE_CRYSTAL]: { enabled: false, amount: 100 },
                        [RESOURCE_LIQUID]: { enabled: false, amount: 100 },
                        // Ghodium chain
                        [RESOURCE_HYDROXIDE]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_KEANITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_LEMERGITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM]: { enabled: false, amount: 1000 },
                    },
                    chunkSize: 10000,
                    allowEnergy: false,
                    energyTarget: 50000
                },
            ]
        },
        W15N37: {
            id: '689ec5ee57237e81b20999b7',
            mode: 'recieve', // or 'receive'
            partners: [
                {
                    room: 'W15N37',
                    sendResources: {
                        [RESOURCE_ENERGY]: { enabled: false, amount: 420000 },
                        [RESOURCE_HYDROGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_OXYGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_KEANIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_LEMERGIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_UTRIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_CATALYST]: { enabled: false, amount: 10000 },
                        [RESOURCE_ZYNTHIUM]: { enabled: false, amount: 10000 },
                        // Regional resources
                        [RESOURCE_METAL]: { enabled: false, amount: 10000 },
                        [RESOURCE_BIOMASS]: { enabled: false, amount: 1000 },
                        [RESOURCE_SILICON]: { enabled: false, amount: 10000 },
                        [RESOURCE_MIST]: { enabled: false, amount: 10000 },
                        // Power creep resources
                        [RESOURCE_POWER]: { enabled: false, amount: 1000 },
                        [RESOURCE_OPS]: { enabled: false, amount: 1000 },
                        // Factory intermediates
                        [RESOURCE_REDUCTANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_OXIDANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_KEANIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_LEMERGIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_PURIFIER]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM_MELT]: { enabled: false, amount: 1000 },
                        // Factory Products
                        [RESOURCE_BATTERY]: { enabled: false, amount: 1000 },
                        [RESOURCE_COMPOSITE]: { enabled: false, amount: 100 },
                        [RESOURCE_CRYSTAL]: { enabled: false, amount: 100 },
                        [RESOURCE_LIQUID]: { enabled: false, amount: 100 },
                        // Ghodium chain
                        [RESOURCE_HYDROXIDE]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_KEANITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_LEMERGITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM]: { enabled: false, amount: 1000 },
                    },
                    chunkSize: 10000,
                    allowEnergy: false,
                    energyTarget: 50000
                },
            ]
        },
        W13N33: {
            id: '68ce48fe41ac19b556a39163',
            mode: 'recieve', // or 'receive'
            partners: [
                {
                    room: 'W15N37',
                    sendResources: {
                        [RESOURCE_ENERGY]: { enabled: false, amount: 420000 },
                        [RESOURCE_HYDROGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_OXYGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_KEANIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_LEMERGIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_UTRIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_CATALYST]: { enabled: false, amount: 10000 },
                        [RESOURCE_ZYNTHIUM]: { enabled: false, amount: 10000 },
                        // Regional resources
                        [RESOURCE_METAL]: { enabled: false, amount: 10000 },
                        [RESOURCE_BIOMASS]: { enabled: false, amount: 1000 },
                        [RESOURCE_SILICON]: { enabled: false, amount: 10000 },
                        [RESOURCE_MIST]: { enabled: false, amount: 10000 },
                        // Power creep resources
                        [RESOURCE_POWER]: { enabled: false, amount: 1000 },
                        [RESOURCE_OPS]: { enabled: false, amount: 1000 },
                        // Factory intermediates
                        [RESOURCE_REDUCTANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_OXIDANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_KEANIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_LEMERGIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_PURIFIER]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM_MELT]: { enabled: false, amount: 1000 },
                        // Factory Products
                        [RESOURCE_BATTERY]: { enabled: false, amount: 1000 },
                        [RESOURCE_COMPOSITE]: { enabled: false, amount: 100 },
                        [RESOURCE_CRYSTAL]: { enabled: false, amount: 100 },
                        [RESOURCE_LIQUID]: { enabled: false, amount: 100 },
                        // Ghodium chain
                        [RESOURCE_HYDROXIDE]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_KEANITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_LEMERGITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM]: { enabled: false, amount: 1000 },
                    },
                    chunkSize: 10000,
                    allowEnergy: false,
                    energyTarget: 50000
                },
            ]
        },
        W13N39: {
            id: '68b4bd6f9c4840f48e1ae829',
            mode: 'recieve', // or 'receive'
            partners: [
                {
                    room: 'W15N37',
                    sendResources: {
                        [RESOURCE_ENERGY]: { enabled: false, amount: 420000 },
                        [RESOURCE_HYDROGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_OXYGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_KEANIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_LEMERGIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_UTRIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_CATALYST]: { enabled: false, amount: 10000 },
                        [RESOURCE_ZYNTHIUM]: { enabled: false, amount: 10000 },
                        // Regional resources
                        [RESOURCE_METAL]: { enabled: false, amount: 10000 },
                        [RESOURCE_BIOMASS]: { enabled: false, amount: 1000 },
                        [RESOURCE_SILICON]: { enabled: false, amount: 10000 },
                        [RESOURCE_MIST]: { enabled: false, amount: 10000 },
                        // Power creep resources
                        [RESOURCE_POWER]: { enabled: false, amount: 1000 },
                        [RESOURCE_OPS]: { enabled: false, amount: 1000 },
                        // Factory intermediates
                        [RESOURCE_REDUCTANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_OXIDANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_KEANIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_LEMERGIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_PURIFIER]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM_MELT]: { enabled: false, amount: 1000 },
                        // Factory Products
                        [RESOURCE_BATTERY]: { enabled: false, amount: 1000 },
                        [RESOURCE_COMPOSITE]: { enabled: false, amount: 100 },
                        [RESOURCE_CRYSTAL]: { enabled: false, amount: 100 },
                        [RESOURCE_LIQUID]: { enabled: false, amount: 100 },
                        // Ghodium chain
                        [RESOURCE_HYDROXIDE]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_KEANITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_LEMERGITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM]: { enabled: false, amount: 1000 },
                    },
                    chunkSize: 10000,
                    allowEnergy: false,
                    energyTarget: 50000
                },
            ]
        },
        W23N34: {
            id: '68f682150fb1f8a4d6e87cb1',
            mode: 'recieve', // or 'receive'
            partners: [
                {
                    room: 'W15N37',
                    sendResources: {
                        [RESOURCE_ENERGY]: { enabled: false, amount: 420000 },
                        [RESOURCE_HYDROGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_OXYGEN]: { enabled: false, amount: 10000 },
                        [RESOURCE_KEANIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_LEMERGIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_UTRIUM]: { enabled: false, amount: 10000 },
                        [RESOURCE_CATALYST]: { enabled: false, amount: 10000 },
                        [RESOURCE_ZYNTHIUM]: { enabled: false, amount: 10000 },
                        // Regional resources
                        [RESOURCE_METAL]: { enabled: false, amount: 10000 },
                        [RESOURCE_BIOMASS]: { enabled: false, amount: 1000 },
                        [RESOURCE_SILICON]: { enabled: false, amount: 10000 },
                        [RESOURCE_MIST]: { enabled: false, amount: 10000 },
                        // Power creep resources
                        [RESOURCE_POWER]: { enabled: false, amount: 1000 },
                        [RESOURCE_OPS]: { enabled: false, amount: 1000 },
                        // Factory intermediates
                        [RESOURCE_REDUCTANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_OXIDANT]: { enabled: false, amount: 1000 },
                        [RESOURCE_KEANIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_LEMERGIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_PURIFIER]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_BAR]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM_MELT]: { enabled: false, amount: 1000 },
                        // Factory Products
                        [RESOURCE_BATTERY]: { enabled: false, amount: 1000 },
                        [RESOURCE_COMPOSITE]: { enabled: false, amount: 100 },
                        [RESOURCE_CRYSTAL]: { enabled: false, amount: 100 },
                        [RESOURCE_LIQUID]: { enabled: false, amount: 100 },
                        // Ghodium chain
                        [RESOURCE_HYDROXIDE]: { enabled: false, amount: 1000 },
                        [RESOURCE_ZYNTHIUM_KEANITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_UTRIUM_LEMERGITE]: { enabled: false, amount: 1000 },
                        [RESOURCE_GHODIUM]: { enabled: false, amount: 1000 },
                    },
                    chunkSize: 10000,
                    allowEnergy: false,
                    energyTarget: 50000
                },
            ]
        },
        // end of room line
    },

    run: function () {
        for (const roomName in this.config) {
            const cfg = this.config[roomName];
            if (!cfg || cfg.mode !== 'send') continue;

            const terminal = Game.getObjectById(cfg.id);
            if (!terminal) continue;
            if (!cfg.partners || cfg.partners.length === 0) continue;

            for (const partnerCfg of cfg.partners) {
                const partner = this.config[partnerCfg.room];
                if (!partner || !partner.id) continue;

                const partnerTerminal = Game.getObjectById(partner.id);
                if (!partnerTerminal) continue;

                // --- ENERGY HANDLING ---
                if (partnerCfg.allowEnergy && partnerCfg.energyTarget) {
                    if (partnerTerminal.store[RESOURCE_ENERGY] < partnerCfg.energyTarget) {
                        const needed = partnerCfg.energyTarget - partnerTerminal.store[RESOURCE_ENERGY];
                        const sendAmount = Math.min(needed, partnerCfg.chunkSize || 1000, terminal.store[RESOURCE_ENERGY]);
                        if (sendAmount > 0) {
                            const cost = Game.market.calcTransactionCost(sendAmount, roomName, partnerCfg.room);
                            if (terminal.store[RESOURCE_ENERGY] >= cost + sendAmount) {
                                const result = terminal.send(RESOURCE_ENERGY, sendAmount, partnerCfg.room);
                                if (result === OK) {
                                    console.log(`[TerminalLogic] ${roomName} sent ${sendAmount} energy → ${partnerCfg.room}`);
                                } else {
                                    console.log(`[TerminalLogic] ⚠️ ${roomName} failed to send energy: ${result}`);
                                }
                                return;
                            }
                        }
                    }
                }

                // --- RESOURCE HANDLING ---
                const resources = partnerCfg.sendResources || {};
                for (const resType in resources) {
                    const resCfg = resources[resType];
                    if (!resCfg.enabled) continue;

                    const partnerAmount = partnerTerminal.store[resType] || 0;
                    if (partnerAmount >= resCfg.amount) continue;

                    const toSend = Math.min(resCfg.amount - partnerAmount, terminal.store[resType] || 0, partnerCfg.chunkSize || 1000);
                    if (toSend <= 0) continue;

                    const cost = Game.market.calcTransactionCost(toSend, roomName, partnerCfg.room);
                    if (terminal.store[RESOURCE_ENERGY] < cost) continue;

                    const result = terminal.send(resType, toSend, partnerCfg.room);
                    if (result === OK) {
                        console.log(`[TerminalLogic] ${roomName} sent ${toSend} ${resType} → ${partnerCfg.room}`);
                    } else {
                        console.log(`[TerminalLogic] ⚠️ ${roomName} failed to send ${resType}: ${result}`);
                    }

                    return; // send one thing per tick
                }
            }
        }
    }
};

module.exports = terminalLogic;