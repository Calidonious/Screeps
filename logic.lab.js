var labLogic = {
    config: {
        'W14N37': {
            storageId: '688d5a468b99246abd95096f',
            terminalId: '68a0005110ab6307347c0d2e',
            labEnergyTarget: 2000,
            idlePos: { x: 10, y: 18 },
            enableReactions: true,   // toggle reactions on/off
            enableManagers: false,

            // Input labs: reagents
            inputLabs: [
                { id: '68a16633528fb297a918d017', resource: RESOURCE_ZYNTHIUM },
                { id: '68a27e8600d73a39398b50d7', resource: RESOURCE_HYDROGEN }
            ],

            // Reaction labs: produce compounds
            reactionLabs: ['68a1c3cc759572125328d85c'],

            // Target compound
            targetCompound: RESOURCE_ZYNTHIUM_HYDRIDE,

            // Optional boost labs
            boostLabs: [] // { id: 'labId5', resource: RESOURCE_CATALYZED_GHODIUM_ALKALIDE }
        },

        'W15N37': {
            storageId: '689593f14c3ddc337079485d',
            terminalId: '689ec5ee57237e81b20999b7',
            labEnergyTarget: 2000,
            idlePos: { x: 39, y: 26 },
            enableReactions: true,   // toggle reactions on/off
            enableManagers: false,

            inputLabs: [
                { id: '68a18295dcc52e264ef07030', resource: RESOURCE_ZYNTHIUM },
                { id: '68a063109ba3ff3f22ed6066', resource: RESOURCE_HYDROGEN }
            ],
            reactionLabs: ['68a0ef7360b82f69d3df7e63,'],
            targetCompound: RESOURCE_ZYNTHIUM_HYDRIDE,
            boostLabs: []
        }
    },

    run: function () {
        for (const roomName in this.config) {
            const roomCfg = this.config[roomName];
            const room = Game.rooms[roomName];
            if (!room) continue;

            // Input labs
            const inputLabs = [];
            for (let input of roomCfg.inputLabs) {
                const lab = Game.getObjectById(input.id);
                if (lab) inputLabs.push(lab);
            }
            if (roomCfg.enableReactions) {
                // Reaction labs
                const reactionLabs = [];
                for (let id of roomCfg.reactionLabs) {
                    const lab = Game.getObjectById(id);
                    if (lab) reactionLabs.push(lab);
                }
    
                if (inputLabs.length < 2 || reactionLabs.length === 0) continue;
    
                // Assign reactions
                for (let rLab of reactionLabs) {
                    rLab.runReaction(inputLabs[0], inputLabs[1]);
                }
            }
        }
    }
};

module.exports = labLogic;