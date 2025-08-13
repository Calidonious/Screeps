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
const roleCollector = require('role.collector');
const roleExtractor = require('role.extractor');
const towerLogic = require('tower.logic');
const roleLinkManager = require('role.linkManager');
const spawnConfigs = require('spawn.config');

module.exports.loop = function () {
    const funnyNames = [
        'Killbot 3000','Stabby Boi','Sneaky Steve','MurderCube','AngryToast','Zap Lad',
        'Blood Extractor Bot','MeatShield','Boom Roomba','Sir Slashalot','Pain Distributor',
        'Yeeter','Hostile Hugger','Clanka','Clanker','Bob The Atom Smasher',
    ];

    const getUniqueCreepName = (role) => {
        const base = `${role} ${funnyNames[Math.floor(Math.random() * funnyNames.length)]}`;
        let name = base, i = 1;
        while (Game.creeps[name]) name = `${base} ${i++}`;
        return name;
    };

    const defenseRooms = Object.values(spawnConfigs).map(cfg => cfg.room);
    const getHostiles = roomName => {
        if (Game.rooms[roomName]) {
            return Game.rooms[roomName].find(FIND_HOSTILE_CREEPS) || [];
        }
        return [];
    };

    // Utility to count creeps by role AND homeRoom
    function countCreepsByRoomAndRole(roomName, role) {
        return _.sum(Game.creeps, c => c.memory.role === role && c.memory.homeRoom === roomName ? 1 : 0);
    }

    // Run static logic
    towerLogic.run();
    roleLinkManager.run();

    // Memory cleanup
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    // Auto-renew creeps
    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        if (creep.ticksToLive < 800) {
            const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) spawn.renewCreep(creep);
        }
    }

    // Auto-adjust defender/medic needs
    let totalMinDefenders = 0, totalMinMedics = 0;
    defenseRooms.forEach(roomName => {
        const hostiles = getHostiles(roomName);
        if (hostiles.length > 0) {
            if (hostiles.length >= 2) totalMinDefenders += Math.min(2, hostiles.length);
            if (hostiles.length >= 4) totalMinMedics += Math.min(2, Math.ceil(hostiles.length / 2));
        }
    });

    Object.values(spawnConfigs).forEach(cfg => {
        cfg.min.defender = totalMinDefenders;
        cfg.min.medic = totalMinMedics;
    });

    // Spawn creeps per room based on min per role
    const trySpawn = (spawn, body, role, memory = {}) => {
        return spawn.spawnCreep(body, getUniqueCreepName(_.capitalize(role)), { memory: { role, ...memory } }) === OK;
    };

    Object.entries(spawnConfigs).forEach(([spawnName, config]) => {
        const spawn = Game.spawns[spawnName];
        if (!spawn || spawn.spawning) return;

        const { min, bodies, memory, room } = config;

        for (const role of Object.keys(min)) {
            if (countCreepsByRoomAndRole(room, role) < min[role]) {
                const mem = Object.assign({}, memory[role] || {});
                mem.homeRoom = room;

                if (role === 'medic' && min[role] > 0 && mem.follow === undefined) {
                    const defenders = _.filter(Game.creeps, c => c.memory.role === 'defender' && c.memory.homeRoom === room);
                    if (defenders.length) mem.follow = defenders[0].name;
                }

                if (trySpawn(spawn, bodies[role], role, mem)) break;
            }
        }
    });

    // Run all creeps by role
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        const roleModule = {
            harvester: roleHarvester,
            builder: roleBuilder,
            upgrader: roleUpgrader,
            defender: roleDefender,
            scout: roleScout,
            transporter: roleTransporter,
            transfer: roleTransfer,
            claimer: roleClaimer,
            harasser: roleHarasser,
            medic: roleMedic,
            collector: roleCollector,
            extractor: roleExtractor,
        }[creep.memory.role];

        if (roleModule) roleModule.run(creep);
    }
};