var roleHarasser = {

    config: {
        default: {
            homeRoom: 'W14N37',
            targetRoom: 'W14N36',
            useCustomPath: true,
            customPath: [
                { room: 'W14N37', x: 17, y: 44 },
                { room: 'W14N36', x: 20, y: 5 },
                { room: 'W14N36', x: 32, y: 11 } // defend position if attackInRange is true
            ],
            attackInRange: true,   // true = guard mode, false = normal hunt
            attackRange: 10,         // radius when guarding
            staging: false,          // true = wait at idlePos before deploying
            idlePos: { x: 18, y: 44 } // staging position in homeRoom
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const isRanged = creep.getActiveBodyparts(RANGED_ATTACK) > 0;
        const isMelee = creep.getActiveBodyparts(ATTACK) > 0;
        const canHeal = creep.getActiveBodyparts(HEAL) > 0;
        const safeHealthRatio = 0.6;

        const cfg = this.config.default;
        const inTargetRoom = creep.room.name === cfg.targetRoom;

        // --- Auto-heal self ---
        if (canHeal && creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        // --- Retreat if low health ---
        if (creep.hits < creep.hitsMax * safeHealthRatio) {
            creep.say('🏃Fallback');
            creep.moveTo(new RoomPosition(25, 25, cfg.homeRoom));
            return;
        }

        // --- Staging Mode ---
        if (cfg.staging) {
            if (creep.room.name !== cfg.homeRoom) {
                creep.moveTo(new RoomPosition(25, 25, cfg.homeRoom), {
                    visualizePathStyle: { stroke: '#ffaa00' }
                });
                return;
            }
            if (cfg.idlePos) {
                creep.moveTo(new RoomPosition(cfg.idlePos.x, cfg.idlePos.y, cfg.homeRoom),
                    { visualizePathStyle: { stroke: '#00ff00' } });
                creep.say('⏳Stage');
            }
            return; // stay here until staging is disabled
        }

        // --- Travel to target room ---
        if (!inTargetRoom) {
            if (cfg.useCustomPath && cfg.customPath && cfg.customPath.length > 0) {
                this.followPath(creep, cfg.customPath);
            } else {
                creep.moveTo(new RoomPosition(25, 25, cfg.targetRoom), {
                    visualizePathStyle: { stroke: '#ffaa00' }
                });
            }
            return;
        }

        // --- Guard Mode ---
        if (cfg.attackInRange) {
            const defendPos = cfg.customPath[cfg.customPath.length - 1];
            const pos = new RoomPosition(defendPos.x, defendPos.y, defendPos.room);

            if (!creep.pos.isEqualTo(pos)) {
                creep.moveTo(pos, { visualizePathStyle: { stroke: '#00ff00' } });
                return;
            }

            const nearbyEnemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, cfg.attackRange);
            if (nearbyEnemies.length > 0) {
                const target = nearbyEnemies[0];
                if (isRanged && creep.pos.inRangeTo(target, 3)) {
                    creep.rangedAttack(target);
                }
                if (isMelee && creep.pos.isNearTo(target)) {
                    creep.attack(target);
                }
            }
            return;
        }

        // --- Normal Hunt Mode ---
        const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ||
            creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: s => s.structureType !== STRUCTURE_CONTROLLER
            });

        if (target) {
            if (isRanged) {
                if (creep.pos.inRangeTo(target, 3)) {
                    creep.rangedAttack(target);
                    if (creep.pos.inRangeTo(target, 1)) {
                        creep.moveTo(creep.pos.findClosestByPath(FIND_EXIT));
                    }
                } else {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff00ff' } });
                }
            }

            if (isMelee) {
                if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
                }
            }
        } else {
            const idlePos = creep.room.controller
                ? creep.room.controller.pos
                : new RoomPosition(25, 25, creep.room.name);
            creep.moveTo(idlePos);
        }
    },

    // --- Helper: follow custom path ---
    followPath: function (creep, path) {
        if (creep.memory.pathIndex === undefined) creep.memory.pathIndex = 0;
        const step = path[creep.memory.pathIndex];
        if (!step) { creep.memory.pathIndex = undefined; return; }

        if (creep.pos.roomName === step.room &&
            creep.pos.x === step.x &&
            creep.pos.y === step.y) {
            creep.memory.pathIndex++;
        } else {
            creep.moveTo(new RoomPosition(step.x, step.y, step.room),
                { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    }
};

module.exports = roleHarasser;