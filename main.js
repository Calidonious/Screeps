const spawnConfigs = require('config.spawn');
const LinkManager = require('logic.linkManager');
const terminalLogic = require('logic.terminal');
const towerLogic = require('logic.tower');
const labLogic = require('logic.lab');


const roleBuilder = require('role.builder');
const roleClaimer = require('role.claimer');
const roleCollector = require('role.collector');
const roleDefender = require('role.defender');
const roleExtractor = require('role.extractor');
const roleHarasser = require('role.harasser');
const roleHarvester = require('role.harvester');
const roleMedic = require('role.medic');
const rolePioneer = require('role.pioneer');
const roleScout = require('role.scout');
const roleTransfer = require('role.transfer');
const roleTransporter = require('role.transporter');
const roleUpgrader = require('role.upgrader');
const roleLabManager = require('role.labManager');

module.exports.loop = function () {
    const funnyNames = [
        'Killbot 3000','Stabby Boi','Sneaky Steve','MurderCube','AngryToast','Zap Lad',
        'Blood Exanguination Bot','MeatShield','Boomba Roomba','Sir Slashalot','Pain Distributor',
        'Yeeter','Hostile Hugger','Clanka','Clanker','Bob The Atom Smasher', 'Emancipator bot', 
        'T-2000', 'Optimus', 'Astro', 'Awsomo', 'C-3PO', 'Darlik', 'CogsWorth', 'Hal', 'Jimmy',
        'Officer Stabbington',
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
        return _.sum(Game.creeps, c =>
            c && c.memory && c.memory.role === role && c.memory.homeRoom === roomName ? 1 : 0
        );
    }

    // Run static logic
    towerLogic.run();
    LinkManager.run();
    terminalLogic.run();
    labLogic.run();

    // Memory cleanup
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    // Auto-renew creeps
    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        if (creep.ticksToLive < 2000) {
            const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) spawn.renewCreep(creep);
        }
    }

    // Auto-adjust defender/medic needs per room
    Object.values(spawnConfigs).forEach(cfg => {
        const hostiles = getHostiles(cfg.room);
    
        let roomDefenders = 0;
        let roomMedics = 0;
    
        if (hostiles.length > 0) {
            console.log(`[ALERT] Room ${cfg.room} under attack! Hostiles: ${hostiles.length}`);
            
            if (hostiles.length >= 2) roomDefenders = Math.min(1, hostiles.length);
            if (hostiles.length >= 4) roomMedics = Math.min(1, Math.ceil(hostiles.length / 2));
        }
    
        cfg.min.defender = roomDefenders;
        cfg.min.medic = roomMedics;
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

                // Assign medic to follow defender
                if (role === 'medic' && min[role] > 0 && mem.follow === undefined) {
                    const defenders = _.filter(Game.creeps, c => c.memory.role === 'defender' && c.memory.homeRoom === room);
                    if (defenders.length) mem.follow = defenders[0].name;
                }

                if (trySpawn(spawn, bodies[role], role, mem)) break;
            }
        }
    });

    // Role execution map
    const roleModules = {
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
        pioneer: rolePioneer,
        collector: roleCollector,
        extractor: roleExtractor,
        labManager: roleLabManager,
    };

    // Run all creeps by role
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (!creep || !creep.memory || !creep.memory.role) {
            continue; // skip creeps without memory/role
        }

        const role = creep.memory.role;
        const roleModule = roleModules[role];

        if (roleModule && roleModule.run) {
            try {
                roleModule.run(creep);
            } catch (err) {
                console.log(`[Error] ${creep.name} (${role}): ${err}`);
            }
        }
    }
};