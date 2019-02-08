'use strict';

// noinspection JSUnusedLocalSymbols
const {ModuleStruct, Struct, Type, ArrayStruct} = require('./cReflection');
// Must be defined before creating structure
Struct.PTR_SIZE = 4;

/**
 * Toutes les ressources d'un joueur.
 * @typedef Resources
 * @property {float} nourriture
 * @property {float} bois
 * @property {float} pierre
 * @property {float} or
 * @property {float} pop
 * @property {float} popRestante
 */
const Resources = new Struct('Resources')
    .addField(Type.float, 'nourriture')
    .addField(Type.float, 'bois')
    .addField(Type.float, 'pierre')
    .addField(Type.float, 'or')
    .addField(Type.float, 'popRestante')
    .addField(Type.float, 'pop', 11 * Type.float.size)
    .getClass();

/**
 * @typedef StateWithUnits
 * @property {Unit[]} units
 */
const StateWithUnits = new Struct('StateWithUnits')
    .getClass();

/**
 * @typedef Player
 * @property {Resources} resources état des ressources du joueur
 * @property {StateWithUnits} stateElse état contenant, entre autres, la liste des unités
 */
const Player = new Struct('Player')
    .addField(StateWithUnits.struct.pointer, 'stateElse', 0x18)
    .addField(Resources.struct.pointer, 'resources', 0x3C)
    .getClass();

/**
 * @typedef PlayerParent
 * @property {Player} player the current player that runs the game on this computer ? (= players.player1)
 */
const PlayerParent = new Struct('PlayerParent')
    .addField(Player.struct.pointer, 'player', 0x134)
    .getClass();




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Players
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Liste de tous les joueurs possibles (Gaia + les huit joueurs)
 * @typedef Players
 * @property {Player} gaia
 * @property {Player} player1 <b style="color: #0000FF">joueur1</b>
 * @property {Player} player2 <b style="color: #FF0000">joueur2</b>
 * @property {Player} player3 <b style="color: #00FF00">joueur3</b>
 * @property {Player} player4 <b style="color: #FFFF00">joueur4</b>
 * @property {Player} player5 <b style="color: #00FFFF">joueur5</b>
 * @property {Player} player6 <b style="color: #FF00FF">joueur6</b>
 * @property {Player} player7 <b style="color: #CCCCCC">joueur7</b>
 * @property {Player} player8 <b style="color: #FF8201">joueur8</b>
 */
const Players = new Struct('Players')
    .addField(Player.struct.pointer, 'gaia', 0x00)
    .addField(Player.struct.pointer, 'player1', 0x08)
    .addField(Player.struct.pointer, 'player2', 0x10)
    .addField(Player.struct.pointer, 'player3', 0x18)
    .addField(Player.struct.pointer, 'player4', 0x20)
    .addField(Player.struct.pointer, 'player5', 0x28)
    .addField(Player.struct.pointer, 'player6', 0x30)
    .addField(Player.struct.pointer, 'player7', 0x38)
    .addField(Player.struct.pointer, 'player8', 0x40)
    .getClass();

// TODO extends Array
/**
 * @property {Player[]} Players.all
 */
Object.defineProperty(Players.prototype, 'all', {
    get: function() {
        return [
            this.gaia,
            this.player1,
            this.player2,
            this.player3,
            this.player4,
            this.player5,
            this.player6,
            this.player7,
            this.player8
        ]
    }
});

/**
 * @typedef StateWithPlayers
 * @property {Players} players
 */
const StateWithPlayers = new Struct('StateWithPlayers')
    .addField(Players.struct.pointer/*.array*/, 'players', 0x184)
    .getClass();

/**
 * @typedef StatesWithPlayers
 * @property {StateWithPlayers} stateWithPlayers
 */
const StatesWithPlayers = new Struct('StatesWithPlayers')
    .addField(StateWithPlayers.struct.pointer, 'stateWithPlayers', 0xC8)
    .getClass();

/**
 * Ensemble de sprites visuels, de sons et d'animations
 * @typedef SLP
 */
const SLP = new Struct('SLP')
// .addField(Type.String)
    .getClass();

/**
 * @typedef {StructInstance} UnitType
 * @property superTypeId {SuperUnitTypeId}
 * @property i18nName {__int16}
 * @property index {UnitType.Index}
 * @property standingGraphics {SLP} graphismes/sons liés à l'état inoccupé de l'unité
 * @property hp {__int16} max hp for unit
 */
const UnitType = new Struct('UnitType')
    .addField(Type.__int16, 'superTypeId', 0x04)
    .addField(Type.__int16, 'i18nName', 0x08)
    .addField(Type.__int16, 'index', 0x10)
    .addField(SLP.struct.pointer, 'standingGraphics', 0x18)
    .addField(Type.__int16, 'hp', 0x2A)
    // .addField(Type.__int16, 'class', 0x148)
    .getClass();

/**
 * @enum {__int16} UnitType.SuperUnitTypeId
 */
UnitType.SuperUnitTypeId = {
    COMBATANT: 70
};

/**
 * Liste des unités (cf Advanced Genie Editor)
 * @memberOf UnitType
 * @enum {__int16} UnitType.Index
 */
UnitType.Index = {
    /** Villager Male */
    VMBAS: 83,
    /** Villager Male Builder */
    VMBLD: 118,
    /** Villager Male Lumberjack */
    VMLUM: 123,
    /** Villager Male Stone Miner */
    VMMIN: 124,
    /** Villager Female Builder */
    VFBLD: 212,
    /** Villager Female Lumberjack */
    VFLUM: 218,
    /** Villager Female Stone Miner */
    VFMIN: 220,
    /** Villager Female */
    VFBAS: 293,
    /** Villager Male Gold Miner */
    VMGLD: 579,
    /** Villager Female Gold Miner */
    VFGLD: 581,
    /** Villager Female Shepherd */
    VFSHE: 590,
    /** Villager Mal Shepherd */
    VMSHE: 592
};

/**
 * @enum {__int16} UnitType.Class
 */
UnitType.Class = {
    CIVILIAN: 4
};


/**
 * @typedef {StructInstance} Unit
 * @property {UnitType} type
 * @property {Player} player
 * @property currentGraphics {SLP} current graphics used to visualize the unit in the game
 * @property {float} hp
 * @property {boolean} selected
 * @property {float} resourceCount
 * @property {_BYTE} resourceType
 * @property speed {float} the current speed of the unit (0 when standing or working)
 * @property {float} x
 * @property {float} y
 */
const Unit = new Struct('Unit')
    .addField(UnitType.struct.pointer, 'type', 0x0C)
    .addField(Player.struct.pointer, 'player', 0x10)
    .addField(SLP.struct.pointer, 'currentGraphics', 0x14)
    .addField(Type.float, 'hp', 0x34)
    .addField(Type.bool, 'selected', 0x3A)
    .addField(Type.float, 'resourceCount', 0x48)
    .addField(Type._BYTE, 'resourceType', 0x50)
    .addField(Type.float, 'speed', 0xC0)
    .addField(Type.float, 'x', 0x104)
    .addField(Type.float, 'y', 0x10C)
    .getClass();

/** @enum */
const ResourceType = {
    /** Hunt ? */
    FOOD: 0,
    WOOD: 1,
    STONE: 2,
    GOLD: 3,
    /** ? */
    GOODS: 9,
    FOOD_2: 0xF,
    FOOD_FORAGE_BUSHES: 0x10,
    FOOD_4: 0x11
};

StateWithUnits.struct
    // TODO make it more beautiful
    .addField(Unit.struct.pointer.array.pointer, 'units', 0x04, {
        sizeOffset: 0x08
    });

/**
 * @typedef StateWithSelectedUnit
 * @property {Unit} selectedUnit
 */
const StateWithSelectedUnit = new Struct()
    .addField(Unit.struct.pointer, 'selectedUnit', 0xD5C)
    .getClass();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MODULE
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {ModuleStructInstance} AoKModule
 * @property {PlayerParent} playerParent
 * @property {StateWithSelectedUnit} stateWithSelectedUnit
 * @property {StatesWithPlayers} statesWithPlayers
 *
 * @property {Players} players shortcut for statesWithPlayers.stateWithPlayers.players
 */
const AoKModule = new ModuleStruct('AoK HD.exe', 'AoK HD.exe')
    .addField(PlayerParent.struct.pointer, 'playerParent', 0x6F4170)
    .addField(StateWithSelectedUnit.struct.pointer, 'stateWithSelectedUnit', 0x6F3D90)
    .addField(StatesWithPlayers.struct.pointer, 'statesWithPlayers', 0x6F2C58)
    .getClass();

/**
 * @param {Resources} resources
 * @param {float} value
 */
AoKModule.prototype.setAllResources = function(resources, value) {
    resources.bois = value;
    resources.nourriture = value;
    resources.or = value;
    resources.pierre = value;
};

Object.defineProperties(AoKModule.prototype, {
    /** @type Players */
    players: {
        get: function() {
            return this.statesWithPlayers.stateWithPlayers.players
        }
    }
});

/** @type AoKModule */
const aokModule = new AoKModule();

/** @type AoKModule */
module.exports = {
    aokModule,
    ResourceType,
    UnitType
};
