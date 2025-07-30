var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleDefender = require('role.defender');
var roleScout = require('role.scout');
var roleTransporter = require('role.transporter');
var roleRepairer = require('role.repairer');
var roleClaimer = require('role.claimer');
var roleHarasser = require('role.harasser');
var roleMedic = require('role.medic');
var towerLogic = require('tower.logic');
var roleLinkManager = require('role.linkManager');

module.exports.loop = function () {
    
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

    // Minimum number of creeps for each role cur:9
    var minHarvesters = 6;
    var minBuilders = 1;
    var minUpgraders = 1;
    var minDefenders = 0;
    var minScouts = 0;
    var minTransporters = 0;
    var minRepairers = 0;
    var minClaimers = 0;
    var minHarassers = 0;
    var minMedics = 0;

    // Count creeps for each role
    var numHarvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester').length;
    var numBuilders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder').length;
    var numUpgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader').length;
    var numDefenders = _.filter(Game.creeps, (creep) => creep.memory.role == 'defender').length;
    var numScouts = _.filter(Game.creeps, (creep) => creep.memory.role == 'scout').length;
    var numTransporters = _.filter(Game.creeps, (creep) => creep.memory.role == 'transporter').length;
    var numRepairers = _.filter(Game.creeps, (creep) => creep.memory.role == 'repairer').length;
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
    if (numHarvesters < minHarvesters) {
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE], 'Harvester' + Game.time, { memory: { role: 'harvester', group: 2 } });
    } else if (numBuilders < minBuilders) {
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE], 'Builder' + Game.time, { memory: { role: 'builder' } });
    } else if (numUpgraders < minUpgraders) {
        Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE], 'Upgrader' + Game.time, { memory: { role: 'upgrader' } });
    } else if (numDefenders < minDefenders) {
        Game.spawns['Spawn1'].spawnCreep([ATTACK, ATTACK, MOVE], 'Defender' + Game.time, { memory: { role: 'defender' } });
    } else if (numScouts < minScouts) {
        Game.spawns['Spawn1'].spawnCreep([MOVE], 'Scout' + Game.time, { memory: { role: 'scout', targetRoom: undefined } });
    } else if (numTransporters < minTransporters) {
        Game.spawns['Spawn1'].spawnCreep([CARRY, CARRY, MOVE], 'Transporter' + Game.time, { memory: { role: 'transporter' } });
    } else if (numRepairers < minRepairers) {
        Game.spawns['Spawn1'].spawnCreep([WORK, CARRY, MOVE], 'Repairer' + Game.time, { memory: { role: 'repairer' } });
    } else if (numClaimers < minClaimers) {
        Game.spawns['Spawn1'].spawnCreep([CLAIM, MOVE], 'Claimer' + Game.time, { memory: { role: 'claimer' } });
    } else if (numHarassers < minHarassers) {
        Game.spawns['Spawn1'].spawnCreep([ATTACK, MOVE], 'Harasser' + Game.time, { memory: { role: 'harasser' } });
    } else if (numMedics < minMedics) {
        Game.spawns['Spawn1'].spawnCreep([HEAL, MOVE], 'Medic' + Game.time, { memory: { role: 'medic' } });
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
        if (creep.memory.role == 'repairer') {
            roleRepairer.run(creep);
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
