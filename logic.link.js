const LinkLogic = {
    run: function () {
        // === Per-room link configurations ===
        const linkConfigs = {
            'W14N37': {
                receiverLinks: {
                    main: '68927e5688ba96a2a57a121c',     // link near storage
                    secondary: '' // example secondary receiver
                },
                sourceLinks: [
                    { id: '68c5013c3b8b634dce256d71', target: 'main' },      // source link 1
                    { id: '68c4fc9627ec1e6281926636', target: 'main' }  // source link 2
                ]
            },

            'W15N37': {
                receiverLinks: {
                    main: '689831029413445505fa93cf',
                    secondary: ''
                },
                sourceLinks: [
                    { id: '68982bc28899736031f0d7e1', target: 'main' },
                    { id: 'LINK_ID_4', target: 'secondary' }
                ]
            },

            'W13N39': {
                receiverLinks: {
                    main: '68a97df8d0e860dcf5ffcfae',  // storage
                    secondary: '68e4d41ea530f045ee63d665' // upgrader
                },
                sourceLinks: [
                    { id: '68c4ba17c4d2233b8f57d414', target: 'main' },
                    { id: '68e4c7be491880065f5cee36', target: 'secondary' }
                ]
            },

            'W13N33': {
                receiverLinks: {
                    main: '68c112b8d6203e685ef64d66',
                    secondary: ''
                },
                sourceLinks: [
                    { id: '68c119c3b7caff57e8b17fb5', target: 'main' },
                    { id: '', target: 'secondary' }
                ]
            },

            'W23N34': {
                receiverLinks: {
                    main: '68e42048a4f59b67f316bd04',
                    secondary: ''
                },
                sourceLinks: [
                    { id: '68e41b941f0e522431493b3b', target: 'main' },
                    { id: '', target: 'secondary' }
                ]
            }
        };

        // === Execution Logic ===
        for (const roomName in linkConfigs) {
            const roomCfg = linkConfigs[roomName];
            if (!roomCfg.receiverLinks || !roomCfg.sourceLinks) continue;

            roomCfg.sourceLinks.forEach(linkCfg => {
                if (!linkCfg.id || !linkCfg.target) return;

                const srcLink = Game.getObjectById(linkCfg.id);
                const recvLinkId = roomCfg.receiverLinks[linkCfg.target];
                const recvLink = Game.getObjectById(recvLinkId);

                if (!srcLink || !recvLink) return;

                // Only transfer if the source link is nearly full and off cooldown
                if (srcLink.cooldown === 0 && srcLink.energy >= 800) {
                    const result = srcLink.transferEnergy(recvLink);
                    if (result === OK) {
                        console.log(`🔗 [${roomName}] ${srcLink.id} → ${recvLink.id}`);
                    }
                }
            });
        }
    }
};

module.exports = LinkLogic;