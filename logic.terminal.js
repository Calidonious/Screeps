var terminalLogic = {
    config: {
        W15N37: {
            id: '689ec5ee57237e81b20999b7',
            mode: 'receive',
            partners: [
                {
                    room: 'W14N37',
                    resources: [RESOURCE_GHODIUM_OXIDE,RESOURCE_KEANIUM_OXIDE,RESOURCE_ZYNTHIUM_HYDRIDE,RESOURCE_UTRIUM_HYDRIDE,],
                    chunkSize: 10000,
                    allowEnergy: false,        // allow sending energy?
                    energyTarget: 15000       // stop once receiver has >= this much energy
                },
            ]
        },
        W14N37: {
            id: '68a0005110ab6307347c0d2e',
            mode: 'receive',
            partners: [
                {
                    room: 'W13N39',
                    resources: [RESOURCE_BIOMASS], // only send
                    chunkSize: 1000,
                    allowEnergy: false,      // won’t send energy
                    energyTarget: 15000
                },
            ]
        },
        W13N39: {
            id: '68b4bd6f9c4840f48e1ae829',
            mode: 'receive',
            partners: [
                {
                    room: 'W15N37',
                    resources: [RESOURCE_GHODIUM_OXIDE,RESOURCE_KEANIUM_OXIDE,RESOURCE_ZYNTHIUM_HYDRIDE,RESOURCE_UTRIUM_HYDRIDE,RESOURCE_SILICON], // only send
                    chunkSize: 9000,
                    allowEnergy: false,      // won’t send energy
                    energyTarget: 55000
                },
            ]
        },
    },

    run: function () {
        for (const roomName in this.config) {
            const cfg = this.config[roomName];
            if (!cfg || cfg.mode !== 'send') continue;

            const terminal = Game.getObjectById(cfg.id);
            if (!terminal) continue;

            if (!cfg.partners || cfg.partners.length === 0) continue;

            // Loop partners
            for (const partnerCfg of cfg.partners) {
                const partner = this.config[partnerCfg.room];
                if (!partner || !partner.id) continue;

                const partnerTerminal = Game.getObjectById(partner.id);
                if (!partnerTerminal) continue;

                // --- Check Energy Sending ---
                if (partnerCfg.allowEnergy && partnerCfg.energyTarget) {
                    if (partnerTerminal.store[RESOURCE_ENERGY] < partnerCfg.energyTarget) {
                        const needed = partnerCfg.energyTarget - partnerTerminal.store[RESOURCE_ENERGY];
                        const sendAmount = Math.min(needed, partnerCfg.chunkSize || 1000, terminal.store[RESOURCE_ENERGY]);

                        if (sendAmount > 0) {
                            const cost = Game.market.calcTransactionCost(
                                sendAmount,
                                roomName,
                                partnerCfg.room
                            );

                            if (terminal.store[RESOURCE_ENERGY] >= cost + sendAmount) {
                                const result = terminal.send(RESOURCE_ENERGY, sendAmount, partnerCfg.room);
                                if (result === OK) {
                                    console.log(`[TerminalLogic] ${roomName} sent ${sendAmount} energy to ${partnerCfg.room} (target ${partnerCfg.energyTarget})`);
                                } else {
                                    console.log(`[TerminalLogic] ${roomName} failed to send energy to ${partnerCfg.room}: ${result}`);
                                }
                                return; // one batch per tick
                            }
                        }
                    }
                }

                // --- Normal Resource Sending ---
                for (const resourceType in terminal.store) {
                    const amount = terminal.store[resourceType];

                    // Skip empty amounts
                    if (amount <= 0) continue;

                    // Skip energy unless allowed
                    if (resourceType === RESOURCE_ENERGY) continue;

                    // If resources are specified, skip if not in list
                    if (partnerCfg.resources && !partnerCfg.resources.includes(resourceType)) continue;

                    const sendAmount = Math.min(amount, partnerCfg.chunkSize || 1000);

                    const cost = Game.market.calcTransactionCost(
                        sendAmount,
                        roomName,
                        partnerCfg.room
                    );

                    if (terminal.store[RESOURCE_ENERGY] < cost) continue;

                    const result = terminal.send(resourceType, sendAmount, partnerCfg.room);
                    if (result === OK) {
                        console.log(`[TerminalLogic] ${roomName} sent ${sendAmount} ${resourceType} to ${partnerCfg.room}`);
                    } else {
                        console.log(`[TerminalLogic] ${roomName} failed to send ${resourceType} to ${partnerCfg.room}: ${result}`);
                    }

                    return; // one batch per tick
                }
            }
        }
    }
};

module.exports = terminalLogic;