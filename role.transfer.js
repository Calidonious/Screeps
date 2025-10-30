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
            toId: '68c7922490f95e795dc1f70e', // storage ID
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
            toId: '68c3b86cd6203efa74f701eb', // storage ID
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
            secondLinkId: '68e4c7be491880065f5cee36', // optional
            position: { x: 22, y: 16 },
            type: 'linkToStorage'
        }
    },
    'W13N33': {
        1: {
            fromId: '',
            toId: '',
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
            fromId: '68c112b8d6203e685ef64d66', // link ID
            toId: '68cf7e69214ab9925ea67037', // storage ID
            secondLinkId: '', // optional
            position: { x: 9, y: 15 },
            type: 'linkToStorage'
        }
    },
    'W23N34': {
        1: {
            fromId: '',
            toId: '',
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
            fromId: '68e42048a4f59b67f316bd04', // link ID
            toId: '68df0b30a4f59bce4d154ff6', // storage ID
            secondLinkId: '', // optional
            position: { x: 14, y: 40 },
            type: 'linkToStorage'
        }
    }
};

const RENEW_THRESHOLD = 1300;

// === Renewal Helpers ===
function isWounded(creep) { return creep.hits < creep.hitsMax / 2; }
function shouldStartRenewing(creep) { return creep.ticksToLive < 300 && !creep.memory.renewing; }
function shouldContinueRenewing(creep) { return creep.memory.renewing && creep.ticksToLive < RENEW_THRESHOLD; }
function startRenewing(creep) { creep.memory.renewing = true; }
function stopRenewing(creep) { creep.memory.renewing = false; }

function renewCreep(creep) {
    var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        creep.say('⏳');
    }
}

function moveToSpawn(creep) {
    var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
    if (spawn) {
        creep.moveTo(spawn, { visualizePathStyle: { stroke: '#ffffff' } });
        return true;
    }
    return false;
}

// === ROLE MAIN ===
var roleTransfer = {
    run: function (creep) {
        // --- Renewal ---
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

        var roomName = creep.memory.homeRoom || creep.room.name;
        var group = creep.memory.group;
        var roomConfig = TRANSFER_CONFIG[roomName];
        if (!roomConfig) return;

        var config = roomConfig[group];
        if (!config) return;

        var from = Game.getObjectById(config.fromId);
        var to = Game.getObjectById(config.toId);
        var secondLink = config.secondLinkId ? Game.getObjectById(config.secondLinkId) : null;
        var targetPos = new RoomPosition(config.position.x, config.position.y, roomName);

        if (!creep.pos.isEqualTo(targetPos)) {
            creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#8888ff' } });
            creep.say('🚗💨');
            return;
        }

        // === CONTAINER -> LINK ===
        if (config.type === 'containerToLink') {
            if (creep.store[RESOURCE_ENERGY] === 0 && from && from.store[RESOURCE_ENERGY] > 0) {
                creep.withdraw(from, RESOURCE_ENERGY);
                creep.say('🫴');
            } else if (creep.store[RESOURCE_ENERGY] > 0 && to && to.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creep.transfer(to, RESOURCE_ENERGY);
                creep.say('🫳');
            }
            return;
        }

        // === LINK -> STORAGE & SECOND LINK LOGIC ===
        if (config.type === 'linkToStorage') {
            var mainLinkHasEnergy = from && from.store[RESOURCE_ENERGY] > 0;
            var storageHasEnergy = to && to.store[RESOURCE_ENERGY] > 50000;
            var secondLinkNeedsEnergy = secondLink && secondLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0;

            // --- PRIMARY JOB: Move energy from main link to storage ---
            if (mainLinkHasEnergy) {
                if (creep.store.getFreeCapacity() > 0) {
                    creep.withdraw(from, RESOURCE_ENERGY);
                    creep.say('🫴');
                } else if (creep.store[RESOURCE_ENERGY] > 0 && to && to.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    creep.transfer(to, RESOURCE_ENERGY);
                    creep.say('🫳');
                }
                return;
            }

            // --- SECONDARY JOB: Move energy from storage to upgrader link ---
            if (!mainLinkHasEnergy && secondLink && secondLinkNeedsEnergy && storageHasEnergy) {
                if (creep.store[RESOURCE_ENERGY] === 0) {
                    creep.withdraw(to, RESOURCE_ENERGY);
                    creep.say('🫴2');
                } else {
                    creep.transfer(secondLink, RESOURCE_ENERGY);
                    creep.say('🫳2');
                }
                return;
            }

            // --- Idle when nothing to do ---
            creep.say('📭');
        }
    }
};

module.exports = roleTransfer;