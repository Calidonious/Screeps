const roleHarvester = require('role.harvester');
const roleBuilder = require('role.builder');
const roleUpgrader = require('role.upgrader');
const roleDefender = require('role.defender');
const roleScout = require('role.scout');
const roleTransporter = require('role.transporter');
const roleTransfer = require('role.transfer');
const roleClaimer = require('role.claimer');
const roleHarasser = require('role.harasser');
const roleMedic = require('role.medic');
const rolePioneer = require('role.pioneer');
const towerLogic = require('tower.logic');
const roleLinkManager = require('role.linkManager');
const spawnConfigs = require('spawn.config');

module.exports.loop = function () {
    const funnyNames = [
        'Killbot 3000','Stabby Boi','Sneaky Steve','MurderCube','AngryToast','Zap Lad',
        'Blood Extractor Bot','MeatShield','Boom Roomba','Sir Slashalot','Pain Distributor',
        'Yeeter','Hostile Hugger','Clanka','Clanker','Bob The Atom Smasher',
    ];

    function getUniqueCreepName(role) {
        var base = role + ' ' + funnyNames[Math.floor(Math.random() * funnyNames.length)];
        var name = base, i = 1;
        while (Game.creeps[name]) name = base + ' ' + i++;
        return name;
    }

    function getHostiles(roomName) {
        if (Game.rooms[roomName]) {
            return Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
        }
        return [];
    }

    towerLogic.run();
    roleLinkManager.run();

    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    for (var i in Game.creeps) {
        var creep = Game.creeps[i];
        if (creep.ticksToLive < 800) {
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) spawn.renewCreep(creep);
        }
    }

    var creepCounts = _.countBy(Game.creeps, function(c) { return c.memory.role; });

    // Handle threat response
    var totalMinDefenders = 0;
    var totalMinMedics = 0;
    for (var cfgName in spawnConfigs) {
        var defRoom = spawnConfigs[cfgName].room;
        var hostiles = getHostiles(defRoom);
        if (hostiles.length > 0) {
            if (hostiles.length >= 3) totalMinDefenders += Math.min(2, hostiles.length);
            if (hostiles.length >= 4) totalMinMedics += Math.min(2, Math.ceil(hostiles.length / 2));
        }
    }

    for (var cfgName in spawnConfigs) {
        if (spawnConfigs[cfgName].min.defender === 0) {
            spawnConfigs[cfgName].min.defender = totalMinDefenders;
        }
        if (spawnConfigs[cfgName].min.medic === 0) {
            spawnConfigs[cfgName].min.medic = totalMinMedics;
        }
    }

    function trySpawn(spawn, body, role, memory) {
        var name = getUniqueCreepName(role.charAt(0).toUpperCase() + role.slice(1));
        return spawn.spawnCreep(body, name, { memory: memory }) === OK;
    }

    for (var spawnName in spawnConfigs) {
        var config = spawnConfigs[spawnName];
        var spawn = Game.spawns[spawnName];
        if (!spawn || spawn.spawning) continue;

        var min = config.min;
        var bodies = config.bodies;
        var memoryMap = config.memory;
        var room = config.room;

        for (var role in min) {
            if ((creepCounts[role] || 0) < min[role]) {
                var mem = {};
                if (memoryMap && memoryMap[role]) {
                    for (var key in memoryMap[role]) {
                        mem[key] = memoryMap[role][key];
                    }
                }

                mem.role = role;
                mem.homeRoom = room;

                if (role === 'medic' && min[role] > 0 && mem.follow === undefined) {
                    var defenders = _.filter(Game.creeps, function(c) { return c.memory.role === 'defender'; });
                    if (defenders.length) {
                        mem.follow = defenders[0].name;
                    }
                }

                var result = trySpawn(spawn, bodies[role], role, mem);
                if (result) break;
            }
        }
    }

    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        var roleModule = {
            harvester: roleHarvester,
            builder: roleBuilder,
            upgrader: roleUpgrader,
            defender: roleDefender,
            scout: roleScout,
            pioneer: rolePioneer,
            transporter: roleTransporter,
            transfer: roleTransfer,
            claimer: roleClaimer,
            harasser: roleHarasser,
            medic: roleMedic
        }[creep.memory.role];

        if (roleModule) roleModule.run(creep);
    }
};