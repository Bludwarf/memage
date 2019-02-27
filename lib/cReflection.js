const {Process, Memory} = require("robot-js");

/**
 * Simple type that does not have properties and can be setted once by the = operator
 * @property {int} size size in bytes
 * @property {ArrayStruct} array the Struct that describes an Array of this Type
 */
class Type {
    /**
     * @param {number} size size in a 32-bits memory in bytes
     */
    constructor(size=0) {
        this.size = size;
        this._array = undefined;
    }

    /**
     * @param memory Robot.Memory instance
     * @param {string} address
     * @param {addFieldOpts} opts
     * @return {*} data read at this address of the memory
     */
    read(memory, address, opts=undefined) {
        throw new Error('Not implemented');
    }

    /**
     * @param memory Robot.Memory instance
     * @param {string} address
     * @param {*} data data to write to this address of the memory
     * @param {addFieldOpts} opts
     * @return {*}
     */
    write(memory, address, data, opts=undefined) {
        throw new Error('Not implemented');
    }

    /**
     * Sample :
     * <pre>Type.int.array</pre>
     * @return {undefined}
     */
    get array() {
        if (!this._array) {
            this._array = new ArrayStruct(this);
        }
        return this._array
    }
}

class Struct extends Type {

    constructor(name) {
        super();
        this.name = name;

        /** @type {Object.<string, StructField>} */
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
        // TODO link with ArrayStruct._class
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
     * Must be unique for this struct
     * @return {Struct._class}
     */
    getClass() {
        return this._class;
    }

    /**
     * @typedef addFieldOpts
     *
     * @property sizeOffset {number} <b>for array pointer or array</b> : offset containing the size of the field being added by addField
     * <p>Example :</p>
     * <pre>
     * StateWithUnits.struct
     *  .addField(Unit.struct.pointer.array.pointer, 'units', 0x04, {
     *      sizeOffset: 0x08
     *  });
     * </pre>
     *
     * @property sizePointer {number} pointer to the field described by sizeOffset when addField was called
     *
     * @property sizeField {string} field in the parent struct containing the size of this array
     */

    /**
     *
     * @param {Type} type
     * @param {string} name
     * @param {number} offset
     * @param {addFieldOpts} opts
     * @return {this}
     */
    addField(type, name, offset = this.nextOffset, opts = undefined) {
        const field = new StructField(this, offset, type, name);
        this.nextOffset = offset + field.type.size;
        this.fields[name] = field;
        Object.defineProperty(this._class.prototype, name, {
            get: function () {
                return this.struct.readField(this.memory, this.address, name, opts);
            },
            set: function (value) {
                return this.struct.writeField(this.memory, this.address, name, value, opts);
            }
        });
        return this;
    }

    // TODO add this method to Memory's prototype
    /** @override */
    read(memory, address, opts = undefined) {
        let object;
        // Object already known in the heap ?
        object = HEAP.get(memory, address);
        if (!object) {
            object = new this._class(memory, address);

            if (opts && 'sizePointer' in opts) {
                Object.defineProperty(object, 'length', {
                    get: function() {
                        return Type.int.read(memory, opts.sizePointer);
                    }
                })
            }

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
     * @param {addFieldOpts} opts
     * @returns {undefined}, undefined if error
     */
    readField(memory, address, name, opts = undefined) {
        const field = this.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.name}`);
            return undefined;
        }
        const type = field.type;

        // Getter
        const readFunction = type.read.bind(type);

        // Runtime Options
        // TODO optimize ? store sizePointer once and for all
        if (opts) {
            if ('sizeField' in opts) {
                const sizeField = this.fields[opts.sizeField];
                if (!sizeField) {
                    throw new Error(`Cannot find field "${opts.sizeField}" in struct ${this.name}. It should contain the size of the array "${name}"`);
                }
                opts.sizeOffset = sizeField.offset;
            }
            if ('sizeOffset' in opts) {
                opts.sizePointer = address + opts.sizeOffset;
            }
        }

        return readFunction(memory, address + field.offset, opts);
    }

    /**
     *
     * @param memory
     * @param address
     * @param name
     * @param data
     * @param {addFieldOpts} opts
     * @return {*}
     */
    writeField(memory, address, name, data, opts = undefined) {
        /** type {StructField} */
        const field = this.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.name}`);
            return undefined;
        }
        const type = field.type;
        const writeFunction = type.write.bind(type);
        return writeFunction(memory, address + field.offset, data, opts);
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
     * @param memory
     * @param {string} address
     * @param {addFieldOpts} opts
     * @return {*}
     */
    read(memory, address, opts = undefined) {
        const ptr = memory.readPtr(address);
        return this.struct.read(memory, ptr, opts);
    }

    // TODO get another pointer
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
    read(memory, address, opts) {
        return Struct.PTR_SIZE === 4 ? memory.readReal32(address) : memory.readReal64(address);
    }

    /** @override */
    write(memory, address, data, opts) {
        return Struct.PTR_SIZE === 4 ? memory.writeReal32(address, data) : memory.writeReal64(address, data);
    }
};

/**
 * 16-bits Integer
 * @typedef {number} __int16
 */
Type.__int16 = new class __int16 extends Type {
    constructor() {
        super(2);
    }

    /** @override */
    read(memory, address, opts) {
        return memory.readInt16(address);
    }

    /** @override */
    write(memory, address, data, opts) {
        return memory.writeInt16(address, data);
    }
};

/**
 * 32-bits Integer
 * @typedef {Number} int
 */
Type.int = new class int extends Type {
    constructor() {
        super(4);
    }

    /** @override */
    read(memory, address, opts) {
        return memory.readInt32(address);
    }

    /** @override */
    write(memory, address, data, opts) {
        return memory.writeInt32(address, data);
    }
};

Type.bool = new class bool extends Type {
    constructor() {
        super(1);
    }

    /** @override */
    read(memory, address, opts) {
        return memory.readBool(address);
    }

    /** @override */
    write(memory, address, data, opts) {
        return memory.writeBool(address, data);
    }
};

/**
 * @typedef {number} int8
 */
Type.int8 = new class int8 extends Type {
    constructor() {
        super(1);
    }

    /** @override */
    read(memory, address, opts) {
        return memory.readInt8(address);
    }

    /** @override */
    write(memory, address, data, opts) {
        return memory.writeInt8(address, data);
    }
};

/**
 * @typedef {int8} _BYTE
 */
Type._BYTE = Type.int8;

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

class ArrayStruct extends Struct {
    // TODO ArrayOf<Type>
    /** @param {Type} itemType */
    constructor(itemType) {
        super('ArrayOf' + itemType || itemType.name);
        this.emptyArray = [];
        this.itemType = itemType;
    }

    /** @override */
    read(memory, address, opts) {
        let object;
        // Object already known in the heap ?
        object = HEAP.get(memory, address);
        if (!object) {
            const thisArray = this;
            const getSize = this.getSizeGetter(memory, address, opts);
            object = new Proxy(this.emptyArray, {
                /**
                 * @param target
                 * @param property
                 * @return {Struct} instance of itemType
                 */
                get: function(target, property) {
                    if (typeof(property) === 'symbol') {
                        return Reflect.get(target, property)
                    }
                    const i = +property;
                    if (isNaN(i)) {
                        if (property === 'length') {
                            if (getSize !== undefined) {
                                return getSize();
                            } else {
                                throw new Error('unknown array length');
                            }
                            // return Type.int.read(memory, address + Type.int.size);
                        }
                        return Reflect.get(target, property)
                    }
                    return thisArray.itemType.read(memory, address + i * thisArray.itemType.size, opts);
                },
                set: function(target, name, value) {
                    throw new Error('Not implemented');
                },
                /** @author https://stackoverflow.com/a/40408918/1655155 */
                has(target, property) {
                    if (typeof(property) === 'symbol') {
                        return Reflect.has(target, property)
                    }
                    const i = +property;
                    if (isNaN(i)) {
                        if (property === 'length') {
                            return getSize !== undefined;
                        }
                        return Reflect.get(target, property)
                    }

                    // Check index ?
                    if (ArrayStruct.checkIndex && this.has(target, 'length')) {
                        const length = getSize();
                        return i < length;
                    } else {
                        return true;
                    }
                },
            });
            HEAP.put(memory, address, object);
        }
        return object;
    }

    getSizeGetter(memory, address, opts) {

        if (!opts) {
            return undefined;
        }

        // Cas #1 : this array is pointed by a pointer (dynamic)
        if ('sizePointer' in opts) {
            const sizePointer = opts.sizePointer;
            delete opts.sizePointer;
            return () => Type.int.read(memory, sizePointer);
        }

        // Cas #2 : this array has static length
        if ('size' in opts) {
            return () => opts.length;
        }
    }
}

/**
 * true if we want to check the length of the array in the has method (called by the forEach for instance)
 * @type boolean
 */
ArrayStruct.checkIndex = false;

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

        // TODO nécessaire ?
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
    ArrayStruct,
    Type
};
