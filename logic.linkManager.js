const LinkManager = {
    run: function () {
        // === Per-room link configurations ===
        const linkConfigs = {
            'W14N37': {
                sourceLinks: [
                    '68927c892211de6e2edf4aeb', // source link 1
                    '6898de8be150056fcac08e49'                // source link 2
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
                    '68a9959216275babcd54414e',
                    ''
                ],
                receiverLink: '68a97df8d0e860dcf5ffcfae'
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