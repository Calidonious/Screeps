var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleDefender = require('role.defender');
var roleScout = require('role.scout');
var roleTransporter = require('role.transporter');
var roleTranfer = require('role.transfer');
var roleClaimer = require('role.claimer');
var roleHarasser = require('role.harasser');
var roleMedic = require('role.medic');
var towerLogic = require('tower.logic');
var roleLinkManager = require('role.linkManager');

module.exports.loop = function () {
    // Funny name pool for harassers
    const funnyNames = [
        'Killbot 3000',
        'Stabby Boi',
        'Sneaky Steve',
        'MurderCube',
        'AngryToast',
        'Zap Lad',
        'PokeFace',
        'MeatShield',
        'Boom Roomba',
        'Sir Slashalot',
        'Pain Distributor',
        'Yeeter',
        'Hostile Hugger',
        'Clanka',
        'Clanker',
        'Bob The Atom Smasher',
    ];
    
    // Function to get a unique creep name from role + funny name
    function getUniqueCreepName(role) {
        const baseName = role + ' ' + funnyNames[Math.floor(Math.random() * funnyNames.length)];
        let name = baseName;
        let index = 1;
    
        while (Game.creeps[name]) {
            name = `${baseName} ${index++}`;
        }
    
        return name;
    }
    
    // rooms to defend
    const defenseRooms = ['W14N37'];

    const getHostiles = (roomName) => {
        const room = Game.rooms[roomName];
        if (!room) return [];
        return room.find(FIND_HOSTILE_CREEPS);
    };
    
    // Execute tower logic
    towerLogic.run();
    
    // Execute link management logic
    //roleLinkManager.run(); // Call the run method of roleLinkManager
    
    // Clear memory of dead creeps
    for (var name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    
    let totalMinDefenders = 0;
    let totalMinMedics = 0;
    
    for (const roomName of defenseRooms) {
        const hostiles = getHostiles(roomName);
    
        if (hostiles.length > 0) {
            const numDef = Math.min(2, hostiles.length); // max 2 defenders
            const numMed = Math.min(2, Math.ceil(hostiles.length / 2)); // 1 medic per 2 hostiles
    
            totalMinDefenders += numDef;
            totalMinMedics += numMed;
        }
    }

    // Minimum number of creeps for each role
    var minHarvesters = 6;
    var minBuilders = 2;
    var minUpgraders = 2;
    var minScouts = 0;
    var minTransporters = 3;
    var minTransfers = 0;
    var minClaimers = 0;
    var minHarassers = 0;
    var minDefenders = totalMinDefenders;
    var minMedics = totalMinMedics;
    
    // Count creeps for each role
    var numHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester').length;
    var numBuilders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder').length;
    var numUpgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader').length;
    var numDefenders = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender').length;
    var numScouts = _.filter(Game.creeps, (creep) => creep.memory.role == 'scout').length;
    var numTransporters = _.filter(Game.creeps, (creep) => creep.memory.role == 'transporter').length;
    var numTransfers = _.filter(Game.creeps, (creep) => creep.memory.role == 'transfer').length;
    var numClaimers = _.filter(Game.creeps, (creep) => creep.memory.role == 'claimer').length;
    var numHarassers = _.filter(Game.creeps, (creep) => creep.memory.role == 'harasser').length;
    var numMedics = _.filter(Game.creeps, (creep) => creep.memory.role == 'medic').length;

    // Automatically renew creeps
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.ticksToLive < 800) {
            var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
            if (spawn) {
                spawn.renewCreep(creep);
            }
        }
    }

    // Spawn creeps if below minimum amount for each role
    // Civilian units
    if (numHarvesters < minHarvesters) {
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], getUniqueCreepName('Harvester'), { memory: { role: 'harvester', group: 2 } });
        
    } else if (numBuilders < minBuilders) {
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE], getUniqueCreepName('Builder'), { memory: { role: 'builder' } });
        
    } else if (numUpgraders < minUpgraders) {
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], getUniqueCreepName('Upgrader'), { memory: { role: 'upgrader' } });
        
    } else if (numTransporters < minTransporters) {
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE], getUniqueCreepName('Transporter'), { memory: { role: 'transporter', group: 2 } });
        
    } else if (numTransfers < minTransfers) {
        Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, MOVE], 'Transfer1', {memory: { role: 'transfer', group: 1 }});
    
    
    // Military units  D:850 H:1300 M:600  
    } else if (numDefenders < minDefenders) {
        Game.spawns['Spawn1'].spawnCreep(
            [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE],
            getUniqueCreepName('Defender'), { memory: { role: 'defender', homeRoom: 'W14N37' } });
        
    } else if (numHarassers < minHarassers) {
        Game.spawns['Spawn1'].spawnCreep(
            [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, HEAL, MOVE, MOVE, MOVE, MOVE],
            getUniqueCreepName('Harasser'), { memory: { role: 'harasser', targetRoom: 'W14N37', homeRoom: 'W14N37' } });
        
    } else if (numMedics < minMedics) {
        const allDefenders = _.filter(Game.creeps, c => c.memory.role === 'defender');
        const followTarget = allDefenders.length > 0 ? allDefenders[0].name : undefined;
        Game.spawns['Spawn1'].spawnCreep([HEAL, HEAL, MOVE, MOVE], getUniqueCreepName('Medic'), { memory: { role: 'medic', follow: followTarget, homeRoom: 'W14N37', targetRoom:'W14N37' } }
        );
    
        
    //  Colonial units  
    } else if (numClaimers < minClaimers) {
        Game.spawns['Spawn1'].spawnCreep([CLAIM, MOVE], getUniqueCreepName('Claimer'), { memory: { role: 'claimer', targetRoom: 'W14N38', suicideAfterClaim: false } });
        
    } else if (numScouts < minScouts) {
        Game.spawns['Spawn1'].spawnCreep([MOVE], getUniqueCreepName('Scout'), { memory: { role: 'scout' } });
    }

    // Assign roles to creeps
    for (var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if (creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if (creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if (creep.memory.role == 'defender') {
            roleDefender.run(creep);
        }
        if (creep.memory.role == 'scout') {
            roleScout.run(creep);
        }
        if (creep.memory.role == 'transporter') {
            roleTransporter.run(creep);
        }
        if (creep.memory.role == 'transfer') {
            roleTransfer.run(creep);
        }
        if (creep.memory.role == 'claimer') {
            roleClaimer.run(creep);
        }
        if (creep.memory.role == 'harasser') {
            roleHarasser.run(creep);
        }
        if (creep.memory.role == 'medic') {
            roleMedic.run(creep);
        }
    }
};
