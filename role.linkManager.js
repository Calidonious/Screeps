const roleLinkManager = {
    run: function () {
        // === Define structure IDs here ===
        const sourceLinkIds = [
            '68927c892211de6e2edf4aeb', // ID of source link 1
            'LINK_ID_2'  // ID of source link 2
        ];
        const receiverLinkId = '68927e5688ba96a2a57a121c'; // ID of the link next to storage
        // ======================================

        const receiverLink = Game.getObjectById(receiverLinkId);
        if (!receiverLink) return;

        sourceLinkIds.forEach(linkId => {
            const sourceLink = Game.getObjectById(linkId);
            if (!sourceLink) return;

            // Check cooldown and energy before transferring
            if (
                sourceLink.cooldown === 0 &&
                sourceLink.energy >= 800
            ) {
                sourceLink.transferEnergy(receiverLink);
            }
        });
    }
};

module.exports = roleLinkManager;