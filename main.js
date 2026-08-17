var spawnConfigs = require('config.spawn');
var linkLogic = require('logic.link');
var terminalLogic = require('logic.terminal');
var towerLogic = require('logic.tower');
var labLogic = require('logic.lab');
var factoryLogic = require('logic.factory');

var roleModules = {
    harvester: require('role.harvester'),
    builder: require('role.builder'),
    upgrader: require('role.upgrader'),
    defender: require('role.defender'),
    scout: require('role.scout'),
    transporter: require('role.transporter'),
    transfer: require('role.transfer'),
    claimer: require('role.claimer'),
    harasser: require('role.harasser'),
    medic: require('role.medic'),
    pioneer: require('role.pioneer'),
    collector: require('role.collector'),
    extractor: require('role.extractor'),
    labRat: require('role.labRat'),
    factoryWorker: require('role.factoryWorker'),
};

var funnyNames = [
    'Killbot 3000','Stabby Boi','Sneaky Steve','MurderCube','AngryToast','Zap Lad',
    'Boomba Roomba','Sir Slashalot','Clanker','Bob The Atom Smasher','T-2000','Optimus'
];

function getUniqueCreepName(role) {
    var base = role + ' ' + funnyNames[Math.floor(Math.random() * funnyNames.length)];
    var name = base;
    var i = 1;
    while (Game.creeps[name]) {
        name = base + ' ' + i++;
    }
    return name;
}

// Cache hostiles every 10 ticks
if (!Memory._cacheTick) Memory._cacheTick = 0;
if (Game.time % 10 === 0) {
    Memory._cachedHostiles = {};
    for (var sName in spawnConfigs) {
        var cfg = spawnConfigs[sName];
        var room = Game.rooms[cfg.room];
        if (room) {
            var hostiles = room.find(FIND_HOSTILE_CREEPS);
            Memory._cachedHostiles[cfg.room] = hostiles.length;
        }
    }
    Memory._cacheTick = Game.time;
}

module.exports.loop = function () {
    var creeps = Game.creeps;
    var spawns = Game.spawns;

    // === Memory cleanup every 50 ticks ===
    if (Game.time % 50 === 0) {
        for (var name in Memory.creeps) {
            if (!creeps[name]) delete Memory.creeps[name];
        }
    }

    // === Static logic ===
    towerLogic.run();
    linkLogic.run();
    terminalLogic.run();
    labLogic.run();
    factoryLogic.run();

    // === Auto-renew creeps every 10 ticks ===
    if (Game.time % 1 === 0) {
        for (var spawnName in spawns) {
            var spawn = spawns[spawnName];
            if (!spawn) continue;
            var renewTargets = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {
                filter: function(c) { return c.ticksToLive < 1400; }
            });
            if (renewTargets.length) {
                var lowest = _.min(renewTargets, 'ticksToLive');
                if (lowest !== Infinity) spawn.renewCreep(lowest);
            }
        }
    }

    // === Adjust defenders/medics every 20 ticks ===
    if (Game.time % 20 === 0) {
        for (var cfgName in spawnConfigs) {
            var cfg = spawnConfigs[cfgName];
            var hostiles = (Memory._cachedHostiles && Memory._cachedHostiles[cfg.room]) || 0;

            cfg.min.defender = hostiles >= 3 ? Math.min(1, hostiles) : 0;
            cfg.min.medic = hostiles >= 4 ? Math.min(1, Math.ceil(hostiles / 2)) : 0;

            if (hostiles > 0) {
                console.log('[ALERT] ' + cfg.room + ' under attack: ' + hostiles + ' hostiles.');
            }
        }
    }

    // === Spawn creeps (optimized) ===
    for (var spawnName in spawnConfigs) {
        var config = spawnConfigs[spawnName];
        var spawn = spawns[spawnName];
        if (!spawn || spawn.spawning) continue;

        var min = config.min;
        var bodies = config.bodies;
        var memory = config.memory;
        var room = config.room;

        // Group creeps by role per room once
        var roomCreeps = _.groupBy(_.filter(creeps, function(c) {
            return c.memory.homeRoom === room;
        }), function(c) {
            return c.memory.role;
        });

        for (var role in min) {
            var minCount = min[role];
            var current = (roomCreeps[role] || []).length;
            if (current < minCount) {
                var mem = {};
                if (memory[role]) {
                    for (var key in memory[role]) {
                        mem[key] = memory[role][key];
                    }
                }
                mem.homeRoom = room;

                // assign medic follow
                if (role === 'medic' && !mem.follow && roomCreeps.defender && roomCreeps.defender.length) {
                    mem.follow = roomCreeps.defender[0].name;
                }

                var result = spawn.spawnCreep(
                    bodies[role],
                    getUniqueCreepName(role.charAt(0).toUpperCase() + role.slice(1)),
                    { memory: _.merge({ role: role }, mem) }
                );

                if (result === OK) break; // spawn one creep max per tick
            }
        }
    }

    // === Run role logic ===
    for (var name in creeps) {
        var creep = creeps[name];
        if (!creep.memory || !creep.memory.role) continue;

        var mod = roleModules[creep.memory.role];
        if (mod && mod.run) {
            try {
                mod.run(creep);
            } catch (err) {
                console.log('[Error] ' + creep.name + ': ' + err);
            }
        }
    }
};