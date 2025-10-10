const LinkManager = {
    run: function () {
        // === Per-room link configurations ===
        const linkConfigs = {
            'W14N37': {
                sourceLinks: [
                    '68c5013c3b8b634dce256d71', // source link 1
                    '68c4fc9627ec1e6281926636'                // source link 2
                ],
                receiverLink: '68927e5688ba96a2a57a121c' // link near storage
            },
            'W15N37': {
                sourceLinks: [
                    '68982bc28899736031f0d7e1',
                    'LINK_ID_4'
                ],
                receiverLink: '689831029413445505fa93cf'
            },
            'W13N39': {
                sourceLinks: [
                    '68c4ba17c4d2233b8f57d414',
                    ''
                ],
                receiverLink: '68a97df8d0e860dcf5ffcfae'
            },
            'W13N33': {
                sourceLinks: [
                    '68c119c3b7caff57e8b17fb5',
                    ''
                ],
                receiverLink: '68c112b8d6203e685ef64d66'
            },
            'W23N34': {
                sourceLinks: [
                    '68e41b941f0e522431493b3b',
                    ''
                ],
                receiverLink: '68e42048a4f59b67f316bd04'
            }
        };

        // Loop through each room config
        for (const roomName in linkConfigs) {
            const { sourceLinks, receiverLink } = linkConfigs[roomName];

            const recvLinkObj = Game.getObjectById(receiverLink);
            if (!recvLinkObj) continue;

            sourceLinks.forEach(sourceId => {
                const srcLinkObj = Game.getObjectById(sourceId);
                if (!srcLinkObj) return;

                // Send only if ready and nearly full
                if (srcLinkObj.cooldown === 0 && srcLinkObj.energy >= 800) {
                    srcLinkObj.transferEnergy(recvLinkObj);
                }
            });
        }
    }
};

module.exports = LinkManager;