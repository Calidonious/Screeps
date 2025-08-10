module.exports = {
    'Spawn1': {
        room: 'W14N37',
        min: {
            harvester: 2,
            builder: 2,
            upgrader: 1,
            transporter: 3,
            transfer: 3,
            claimer: 0,
            pioneer: 0,
            harasser: 0,
            scout: 0,
            defender: 0,
            medic: 0,
        },
        bodies: {
            harvester: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            builder: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            upgrader: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            transporter: [WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            transfer: [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            defender: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE],
            harasser: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,HEAL,MOVE,MOVE,MOVE,MOVE],
            medic: [HEAL,MOVE,MOVE],
            claimer: [CLAIM,MOVE],
            pioneer: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            scout: [MOVE]
        },
        memory: {
            harvester: { group: 2 },
            builder: { group: 1 },
            upgrader: {},
            transporter: { group: 2 },
            transfer: { group: 2 },
            harasser: { targetRoom: 'W14N37' },
            medic: { targetRoom: 'W14N37', follow: 'MedicBuddy' },
            claimer: { targetRoom: 'W15N37', suicideAfterClaim: false },
            pioneer: { targetRoom: 'W15N37', group: 1 },
            scout: {}
        }
    },
    
    'Spawn2': {
        room: 'W15N37',
        min: {
            harvester: 2,
            builder: 1,
            upgrader: 1,
            transporter: 3,
            transfer: 2,
            claimer: 0,
            pioneer: 0,
            harasser: 0,
            scout: 0,
            defender: 0,
            medic: 0,
        },
        bodies: {
            harvester: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            builder: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            upgrader: [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            transporter: [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE],
            transfer: [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE],
            defender: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE],
            harasser: [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,HEAL,MOVE,MOVE,MOVE,MOVE],
            medic: [HEAL,MOVE,MOVE],
            claimer: [CLAIM,MOVE],
            pioneer: [WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE],
            scout: [MOVE]
        },
        memory: {
            harvester: { group: 2 },
            builder: { group: 2 },
            upgrader: {},
            transporter: { group: 2 },
            transfer: { group: 3 },
            harasser: { targetRoom: 'W14N37' },
            medic: { targetRoom: 'W14N37', follow: 'MedicBuddy' },
            claimer: { targetRoom: 'W15N37', suicideAfterClaim: false },
            pioneer: { targetRoom: 'W15N37', group: 1 },
            scout: {}
        }
    },
};