const roleLinkManager = {
    run: function () {
        // === Define structure IDs here ===
        const sourceLinkIds = [
            'LINK_ID_1', // Replace with actual ID of source link 1
            'LINK_ID_2'  // Replace with actual ID of source link 2
        ];
        const receiverLinkId = 'RECEIVER_LINK_ID'; // Replace with actual ID of the link next to storage
        // ======================================

        const receiverLink = Game.getObjectById(receiverLinkId);
        if (!receiverLink) return;

        sourceLinkIds.forEach(linkId => {
            const sourceLink = Game.getObjectById(linkId);
            if (!sourceLink) return;

            // Check cooldown and energy before transferring
            if (
                sourceLink.cooldown === 0 &&
                sourceLink.energy >= 100 &&
                sourceLink.pos.inRangeTo(receiverLink.pos, 2)
            ) {
                sourceLink.transferEnergy(receiverLink);
            }
        });
    }
};

module.exports = roleLinkManager;