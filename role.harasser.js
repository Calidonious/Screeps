var roleHarasser = {

    config: {
        default: {
            homeRoom: 'W13N39',
            targetRoom: 'W12N40',
            useCustomPath: true,
            customPath: [
                { room: 'W13N39', x: 36, y: 4 },
                { room: 'W13N40', x: 47, y: 30 },
                { room: 'W12N40', x: 15, y: 10 }
            ]
        }
    },

    /** @param {Creep} creep **/
    run: function (creep) {
        const isRanged = creep.getActiveBodyparts(RANGED_ATTACK) > 0;
        const isMelee = creep.getActiveBodyparts(ATTACK) > 0;
        const canHeal = creep.getActiveBodyparts(HEAL) > 0;
        const safeHealthRatio = 0.6; // below this % health, creep retreats

        const cfg = this.config.default; // could extend for multiple configs
        const inTargetRoom = creep.room.name === cfg.targetRoom;

        // --- Auto-heal self ---
        if (canHeal && creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        // --- Retreat if health is low ---
        if (creep.hits < creep.hitsMax * safeHealthRatio) {
            creep.say('🏃Fallback');
            creep.moveTo(new RoomPosition(25, 25, cfg.homeRoom));
            return;
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

        // --- In target room: prioritize hostiles ---
        const target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS) ||
            creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: s => s.structureType !== STRUCTURE_CONTROLLER
            });

        if (target) {
            // RANGED
            if (isRanged) {
                if (creep.pos.inRangeTo(target, 3)) {
                    creep.rangedAttack(target);
                    // Optional kiting: back off if too close
                    if (creep.pos.inRangeTo(target, 1)) {
                        creep.moveTo(creep.pos.findClosestByPath(FIND_EXIT));
                    }
                } else {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff00ff' } });
                }
            }

            // MELEE
            if (isMelee) {
                if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
                }
            }
        } else {
            // Patrol controller if no targets
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