const TRANSFER_CONFIG = {
    'W14N37': {
        1: {
            fromId: '68927f15563654719b60fc5f', // container ID
            toId: '68927c892211de6e2edf4aeb', // link ID
            position: { x: 10, y: 13 },
            type: 'containerToLink'
        },
        2: {
            fromId: '6898df3629f295767f335f7c',
            toId: '6898de8be150056fcac08e49',
            position: { x: 29, y: 27 },
            type: 'containerToLink'
        },
        3: {
            fromId: '68927e5688ba96a2a57a121c', // link ID
            toId: '688d5a468b99246abd95096f', // storage ID
            secondLinkId: '', // optional link to refill from storage
            position: { x: 10, y: 30 },
            type: 'linkToStorage'
        }
    },
    'W15N37': {
        1: {
            fromId: '68982f5e7bc95867b188c3c0',
            toId: '68982bc28899736031f0d7e1',
            position: { x: 40, y: 21 },
            type: 'containerToLink'
        },
        2: {
            fromId: 'CONTAINER_ID_GROUP_2',
            toId: 'LINK_ID_GROUP_2',
            position: { x: 29, y: 28 },
            type: 'containerToLink'
        },
        3: {
            fromId: '689831029413445505fa93cf', // link ID
            toId: '689593f14c3ddc337079485d', // storage ID
            secondLinkId: '', // optional
            position: { x: 36, y: 42 },
            type: 'linkToStorage'
        }
    },
    'W13N39': {
        1: {
            fromId: '68a98b2eab78dd2632667cb1',
            toId: '68a9959216275babcd54414e',
            position: { x: 43, y: 17 },
            type: 'containerToLink'
        },
        2: {
            fromId: 'CONTAINER_ID_GROUP_2',
            toId: 'LINK_ID_GROUP_2',
            position: { x: 29, y: 28 },
            type: 'containerToLink'
        },
        3: {
            fromId: '68a97df8d0e860dcf5ffcfae', // link ID
            toId: '68a688e6d89b6f1cd82a4e03', // storage ID
            secondLinkId: '', // optional
            position: { x: 22, y: 16 },
            type: 'linkToStorage'
        }
    }
};

const RENEW_THRESHOLD = 1300;

function isWounded(creep) {
    return creep.hits < creep.hitsMax / 2;
}
function shouldStartRenewing(creep) {
    return creep.ticksToLive < 300 && !creep.memory.renewing;
}
function shouldContinueRenewing(creep) {
    return creep.memory.renewing && creep.ticksToLive < RENEW_THRESHOLD;
}
function stopRenewing(creep) {
    creep.memory.renewing = false;
}
function startRenewing(creep) {
    creep.memory.renewing = true;
}
function renewCreep(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('⏳');
    }
}
function moveToSpawn(creep) {
    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        return true;
    }
    return false;
}

const roleTransfer = {
    run(creep) {
        if (isWounded(creep)) {
            creep.say('🏥');
            if (moveToSpawn(creep)) return;
        }

        if (shouldStartRenewing(creep)) startRenewing(creep);
        if (shouldContinueRenewing(creep)) {
            renewCreep(creep);
            return;
        } else if (creep.memory.renewing) {
            stopRenewing(creep);
        }

        const roomName = creep.memory.homeRoom || creep.room.name;
        if (!TRANSFER_CONFIG[roomName]) {
            console.log(`❌ No transfer config for room ${roomName} (${creep.name})`);
            return;
        }

        const group = creep.memory.group;
        const config = TRANSFER_CONFIG[roomName][group];
        if (!config) {
            console.log(`❌ Invalid group ${group} in room ${roomName} for ${creep.name}`);
            return;
        }

        const from = Game.getObjectById(config.fromId);
        const to = Game.getObjectById(config.toId);
        const secondLink = config.secondLinkId ? Game.getObjectById(config.secondLinkId) : null;
        const targetPos = new RoomPosition(config.position.x, config.position.y, roomName);

        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#8888ff' } });
            creep.say('🚗💨');
            return;
        }

        if (config.type === 'containerToLink' || config.type === 'linkToStorage') {
            // === MAIN JOB ===
            if (creep.store[RESOURCE_ENERGY] === 0 && from && from.store[RESOURCE_ENERGY] > 0) {
                creep.withdraw(from, RESOURCE_ENERGY);
                creep.say('🫴');
                return;
            } 
            if (creep.store[RESOURCE_ENERGY] > 0 && to && to.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.transfer(to, RESOURCE_ENERGY);
                creep.say('🫳');
                return;
            }

            // === SECOND LINK REFILL (only after main job is done) ===
            if (secondLink) {
                if (creep.store[RESOURCE_ENERGY] === 0 && to && to.store[RESOURCE_ENERGY] > 5000) {
                    creep.withdraw(to, RESOURCE_ENERGY); // to = storage in group3
                } else if (creep.store[RESOURCE_ENERGY] > 0 && secondLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    creep.transfer(secondLink, RESOURCE_ENERGY);
                }
            }
        }
    }
};

module.exports = roleTransfer;