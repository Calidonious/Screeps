var terminalLogic = {
    config: {
        W15N37: {
            id: '689ec5ee57237e81b20999b7',
            mode: 'send',
            partners: [
                {
                    room: 'W14N37',
                    //resources: [RESOURCE_HYDROGEN, RESOURCE_OXYGEN],
                    chunkSize: 1000
                },
            ]
        },
        W14N37: {
            id: '68a0005110ab6307347c0d2e',
            mode: 'receive'
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

                // Loop resources in sender terminal
                for (const resourceType in terminal.store) {
                    const amount = terminal.store[resourceType];

                    // Skip energy and empty amounts
                    if (resourceType === RESOURCE_ENERGY || amount <= 0) continue;

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

                    return; // send only one batch per tick
                }
            }
        }
    }
};

module.exports = terminalLogic;