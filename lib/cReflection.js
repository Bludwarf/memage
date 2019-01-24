const {Process, Memory} = require("robot-js");

/**
 * Simple type that does not have properties and can be setted once by the = operator
 */
class Type {
    /**
     * @param {number} size size in a 32-bits memory in bytes
     */
    constructor(size=0) {
        this.size = size;
    }

    /**
     * @param memory Robot.Memory instance
     * @param {string} address
     * @return {*} data read at this address of the memory
     */
    read(memory, address) {
        throw new Error('Not implemented');
    }

    /**
     * @param memory Robot.Memory instance
     * @param {string} address
     * @param {*} data data to write to this address of the memory
     * @return {*}
     */
    write(memory, address, data) {
        throw new Error('Not implemented');
    }
}

class Struct extends Type {

    constructor(name) {
        super();
        this.name = name;
        this.fields = {};

        /**
         * Useful to skip unknown fields in a struct
         * @type {number}
         */
        this.nextOffset = 0;

        /** @type {StructPointer} */
        this._pointer = undefined;

        /** type {Struct} */
        const thisStruct = this;

        /**
         * @typedef StructInstance
         * @private
         * @property {Struct} struct the parent structure that has created this instance
         * @property memory Robot.Memory
         * @property {string} address
         */
        this._class = class {
            /**
             * @param memory {Memory}
             * @param address Memory pointer (cf Robot-JS)
             */
            constructor(memory, address) {
                // FIXME analyse de code KO car this.struct en conflit avec this.class.struct
                this.struct = thisStruct;
                // TODO trouver des noms sans conflit avec les noms des propriétés de la struct : _ ou __
                this.memory = memory;
                this.address = address;
            }

            /**
             * @return {string} name of this _class
             */
            static get name() {
                return name;
            }

            static get struct() {
                return thisStruct;
            }

        };
    }

    /**
     * @return {Struct._class}
     */
    getClass() {
        return this._class;
    }

    /**
     *
     * @param type {Type}
     * @param name {string}
     * @param offset {number}
     * @return {this}
     */
    addField(type, name, offset = this.nextOffset) {
        const field = new StructField(this, offset, type, name);
        this.nextOffset = offset + field.type.size;
        this.fields[name] = field;
        Object.defineProperty(this._class.prototype, name, {
            get: function () {
                return this.struct.readField(this.memory, this.address, name);
            },
            set: function (value) {
                return this.struct.writeField(this.memory, this.address, name, value);
            }
        });
        return this;
    }

    // TODO add this method to Memory's prototype
    /**
     * @param memory memory from Robot-JS
     * @param {string} address memory pointer from Robot-JS
     */
    read(memory, address) {
        let object;
        // Object already known in the heap ?
        object = HEAP.get(memory, address);
        if (!object) {
            object = new this._class(memory, address);
            HEAP.put(memory, address, object);
        }
        return object;
    }

    /**
     * @return {StructPointer}
     */
    get pointer() {
        if (!this._pointer) {
            this._pointer = new StructPointer(this);
        }
        return this._pointer;
    }

    /**
     * @param memory {Memory}
     * @param address Memory pointer (cf Robot-JS)
     * @param name {string}
     * @returns {undefined}, undefined if error
     */
    readField(memory, address, name) {
        const field = this.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.name}`);
            return undefined;
        }
        const type = field.type;
        const readFunction = type.read.bind(type);
        return readFunction(memory, address + field.offset);
    }

    writeField(memory, address, name, data) {
        /** type {StructField} */
        const field = this.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.name}`);
            return undefined;
        }
        const type = field.type;
        const writeFunction = type.write.bind(type);
        return writeFunction(memory, address + field.offset, data);
    }
}

/**
 * current pointer size based on target process architecture (4 for 32 bits, 8 for 64 bits)
 * @static
 * @memberof Struct
 */
Struct.PTR_SIZE = 4;

class StructPointer extends Type {

    constructor(pointedStruct) {
        super(Struct.PTR_SIZE);
        this.struct = pointedStruct;
    }

    // TODO add this method to Memory's prototype
    /**
     * @param memory memory from Robot-JS
     * @param address memory pointer from Robot-JS
     * @return {*} instance of this Struct
     */
    read(memory, address) {
        const ptr = memory.readPtr(address);
        return this.struct.read(memory, ptr);
    }
}

class StructField {
    /**
     * @param struct {Struct} structure containing this field
     * @param offset {number} offset from struct base pointer
     * @param type {Type}
     * @param name
     * @param initValue
     */
    constructor(struct, offset, type, name, initValue = undefined) {
        this.struct = struct;
        this.offset = offset;
        this.type = type;
        this.name = name;
        this.initValue = initValue;
        this.struct.fields[this.name] = this;
    }

}

/**
 * @typedef {number} float
 */
Type.float = new class float extends Type {
    constructor() {
        super(Struct.PTR_SIZE);
    }

    /** @override */
    read(memory, address) {
        return Struct.PTR_SIZE === 4 ? memory.readReal32(address) : memory.readReal64(address);
    }

    /** @override */
    write(memory, address, data) {
        return Struct.PTR_SIZE === 4 ? memory.writeReal32(address, data) : memory.writeReal64(address, data);
    }
};

/**
 * @typedef {number} __int16
 */
Type.__int16 = new class __int16 extends Type {
    constructor() {
        super(2);
    }

    /** @override */
    read(memory, address) {
        return memory.readInt16(address);
    }

    /** @override */
    write(memory, address, data) {
        return memory.writeInt16(address, data);
    }
};

/**
 * @property {[*]} objects all read objects in the heap indexed by memory and by address
 */
class Heap {
    constructor() {
        this.objects = [];
    }

    getObjects(memory) {
        if (!this.objects[memory]) {
            this.objects[memory] = [];
        }
        return this.objects[memory];
    }

    get(memory, address) {
        const memoryObjects = this.getObjects(memory);
        return address in memoryObjects ? memoryObjects[address] : undefined;
    }

    put(memory, address, object) {
        const memoryObjects = this.getObjects(memory);
        return memoryObjects[address] = object;
    }
}

const HEAP = new Heap();

class ModuleStruct extends Struct {
    constructor(processName, moduleName) {
        super('ModuleStruct');
        this.processName = processName;
        this.moduleName = moduleName;
    }

    get process() {
        if (!this._process) {
            const processes = Process.getList(this.processName);
            if (!processes.length) {
                throw new Error(`Processus ${this.processName} introuvable !`);
            }
            if (processes.length > 1) {
                throw new Error(`Processus ${this.processName} non unique !`);
            }
            this._process = processes[0];
        }
        return this._process;
    }

    get module() {
        if (!this._module) {
            const modules = this.process.getModules(this.moduleName);
            if (!modules.length) {
                throw new Error(`Module ${this.moduleName} introuvable !`);
            }
            if (modules.length > 1) {
                throw new Error(`Module ${this.moduleName} non unique !`);
            }
            this._module = modules[0];
        }
        return this._module;
    }

    get memory() {
        if (!this._memory) {
            this._memory = Memory(this.process);
        }
        return this._memory;
    }

    getClass() {
        const memory = this.memory;
        const address = this.module.getBase();

        const superClass = super.getClass();
        /**
         * @typedef {StructInstance} ModuleStructInstance
         */
        return class extends superClass {
            constructor() {
                super(memory, address);
            }
        };
    }
}

module.exports = {
    ModuleStruct,
    Struct,
    StructPointer,
    StructField,
    Type
};
