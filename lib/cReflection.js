const memoryjs = require('memoryjs');

/**
 * MemoryJS Process
 * @typedef Process
 * @property dwSize {number}
 * @property th32ProcessID {number}
 * @property cntThreads {number}
 * @property th32ParentProcessID {number}
 * @property pcPriClassBase {number}
 * @property szExeFile {string} name
 * @property handle {number}
 * @property modBaseAddr {number} base adresse
 */

/**
 * Simple type that does not have properties and can be setted once by the = operator
 * @property {int} size size in bytes
 * @property {ArrayStruct} array the Struct that describes an Array of this Type
 */
class Type {
    /**
     * @param {number} size size in a 32-bits memory in bytes
     */
    constructor(size = 0) {
        this.size = size;
    }

    /**
     * @param {Process} process MemoryJS process
     * @param {string} address
     * @param {addFieldOpts} opts
     * @return {*} data read at this address of the memory
     */
    read(process, address, opts = undefined) {
        throw new Error('Not implemented');
    }

    /**
     * @param {Process} process MemoryJS process
     * @param {string} address
     * @param {*} data data to write to this address of the memory
     * @param {addFieldOpts} opts
     * @return {*}
     */
    write(process, address, data, opts = undefined) {
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

        // TODO link with ArrayStruct._class
        /**
         * @typedef StructInstance
         * @private
         * @property struct {Struct} the parent structure that has created this instance
         * @property process {Process} MemoryJS Process
         * @property address {string}
         */
        this._class = class {
            /**
             * @param {Process} process
             * @param address Memory pointer (cf Robot-JS)
             */
            constructor(process, address) {
                // FIXME analyse de code KO car this.struct en conflit avec this.class.struct
                this.struct = thisStruct;
                // TODO trouver des noms sans conflit avec les noms des propriétés de la struct : _ ou __
                this.process = process;
                // noinspection JSUnusedGlobalSymbols
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
                return this.struct.readField(this.process, this.address, name, opts);
            },
            set: function (value) {
                return this.struct.writeField(this.process, this.address, name, value, opts);
            }
        });
        return this;
    }

    /** @override */
    read(process, address, opts = undefined) {
        let object;
        // Object already known in the heap ?
        object = HEAP.get(process, address);
        if (!object) {
            object = new this._class(process, address);

            if (opts && 'sizePointer' in opts) {
                Object.defineProperty(object, 'length', {
                    get: function () {
                        return Type.int.read(process, opts.sizePointer);
                    }
                })
            }

            HEAP.put(process, address, object);
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
     * @param {Process} process MemoryJS process
     * @param address Memory pointer
     * @param name {string}
     * @param {addFieldOpts} opts
     * @returns {undefined}, undefined if error
     */
    readField(process, address, name, opts = undefined) {
        const field = this.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.name}`);
            return undefined;
        }
        const type = field.type;

        // Getter
        const readFunction = type.read.bind(type);

        // Runtime Options
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

        return readFunction(process, address + field.offset, opts);
    }

    /**
     *
     * @param process
     * @param address
     * @param name
     * @param data
     * @param {addFieldOpts} opts
     * @return {*}
     */
    writeField(process, address, name, data, opts = undefined) {
        /** type {StructField} */
        const field = this.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.name}`);
            return undefined;
        }
        const type = field.type;
        const writeFunction = type.write.bind(type);
        return writeFunction(process, address + field.offset, data, opts);
    }
}

/**
 * current pointer size based on target process architecture (4 for 32 bits, 8 for 64 bits)
 * @static
 * @memberof Struct
 */
Struct.PTR_SIZE = process.arch.indexOf('64') !== -1 ? 8 : 4;

class StructPointer extends Type {

    constructor(pointedStruct) {
        super(Struct.PTR_SIZE);
        this.struct = pointedStruct;
    }

    /**
     * @param process
     * @param {string} address
     * @param {addFieldOpts} opts
     * @return {*}
     */
    read(process, address, opts = undefined) {
        const ptr = memoryjs.readMemory(process.handle, address, memoryjs.POINTER);
        return this.struct.read(process, ptr, opts);
    }
}

class StructField {
    /**
     * @param struct {Struct} structure containing this field
     * @param offset {number} offset from struct base pointer
     * @param type {Type}
     * @param name
     */
    constructor(struct, offset, type, name) {
        this.struct = struct;
        this.offset = offset;
        this.type = type;
        this.name = name;
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

    // noinspection JSUnusedLocalSymbols
    /** @override */
    read(process, address, opts) {
        return memoryjs.readMemory(process.handle, address, memoryjs.FLOAT);
    }

    // noinspection JSUnusedLocalSymbols
    /** @override */
    write(process, address, data, opts) {
        return memoryjs.writeMemory(process.handle, address, data, memoryjs.FLOAT);
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

    // noinspection JSUnusedLocalSymbols
    /** @override */
    read(process, address, opts) {
        return memoryjs.readMemory(process.handle, address, memoryjs.SHORT);
    }

    // noinspection JSUnusedLocalSymbols
    /** @override */
    write(process, address, data, opts) {
        return memoryjs.writeMemory(process.handle, address, data, memoryjs.SHORT);
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

    // noinspection JSUnusedLocalSymbols
    /** @override */
    read(process, address, opts) {
        return memoryjs.readMemory(process.handle, address, memoryjs.INT32);
    }

    // noinspection JSUnusedLocalSymbols
    /** @override */
    write(process, address, data, opts) {
        return memoryjs.writeMemory(process.handle, address, data, memoryjs.INT32);
    }
};

Type.bool = new class bool extends Type {
    constructor() {
        super(1);
    }

    // noinspection JSUnusedLocalSymbols
    /** @override */
    read(process, address, opts) {
        return memoryjs.readMemory(process.handle, address, memoryjs.BOOL);
    }

    // noinspection JSUnusedLocalSymbols
    /** @override */
    write(process, address, data, opts) {
        return memoryjs.writeMemory(process.handle, address, data, memoryjs.BOOL);
    }
};

/**
 * @typedef {number} int8
 */
Type.int8 = new class int8 extends Type {
    constructor() {
        super(1);
    }

    // noinspection JSUnusedLocalSymbols
    /** @override */
    read(process, address, opts) {
        return memoryjs.readBuffer(process.handle, address, 1).readInt8();
    }

    // noinspection JSUnusedLocalSymbols
    /** @override */
    write(process, address, data, opts) {
        return memoryjs.writeBuffer(process.handle, address, Buffer.from([data]));
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

    getObjects(process) {
        if (!this.objects[process]) {
            this.objects[process] = [];
        }
        return this.objects[process];
    }

    get(process, address) {
        const processObjects = this.getObjects(process);
        return address in processObjects ? processObjects[address] : undefined;
    }

    put(process, address, object) {
        const processObjects = this.getObjects(process);
        return processObjects[address] = object;
    }
}

const HEAP = new Heap();

class ArrayStruct extends Struct {
    /** @param {Type} itemType */
    constructor(itemType) {
        super('ArrayOf' + ('name' in itemType ? itemType.name : 'SomeType'));
        this.emptyArray = [];
        this.itemType = itemType;
    }

    /** @override */
    read(process, address, opts) {
        let object;
        // Object already known in the heap ?
        object = HEAP.get(process, address);
        if (!object) {
            const thisArray = this;
            const getSize = this.getSizeGetter(process, address, opts);
            // noinspection JSUnusedLocalSymbols
            object = new Proxy(this.emptyArray, {
                /**
                 * @param target
                 * @param property
                 * @return {Struct} instance of itemType
                 */
                get: function (target, property) {
                    if (typeof (property) === 'symbol') {
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
                            // return Type.int.read(process, address + Type.int.size);
                        }
                        return Reflect.get(target, property)
                    }
                    return thisArray.itemType.read(process, address + i * thisArray.itemType.size, opts);
                },
                set: function (target, name, value) {
                    throw new Error('Not implemented');
                },
                /** @author https://stackoverflow.com/a/40408918/1655155 */
                has(target, property) {
                    if (typeof (property) === 'symbol') {
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
            HEAP.put(process, address, object);
        }
        return object;
    }

    getSizeGetter(process, address, opts) {

        if (!opts) {
            return undefined;
        }

        // Cas #1 : this array is pointed by a pointer (dynamic)
        if ('sizePointer' in opts) {
            const sizePointer = opts.sizePointer;
            delete opts.sizePointer;
            return () => Type.int.read(process, sizePointer);
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

class ProcessStruct extends Struct {
    constructor(processName) {
        super('ProcessStruct');
        this.processName = processName;
    }

    /** @type Process */
    get process() {
        if (!this._process) {
            this._process = memoryjs.openProcess(this.processName);
        }
        return this._process;
    }

    getClass() {
        const process = this.process;
        const superClass = super.getClass();
        /**
         * @typedef {StructInstance} ModuleStructInstance
         */
        return class extends superClass {
            constructor() {
                super(process, process.modBaseAddr);
            }
        };
    }
}

module.exports = {
    ProcessStruct,
    Struct,
    ArrayStruct,
    Type
};
