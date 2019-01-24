const Robot = require("robot-js");
const {Memory} = {Robot};

/**
 * Simple type that does not have properties and can be setted once by the = operator
 */
class Type {
    /**
     * @param {number} size size in memory in bytes
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
         * @private
         * @property {Struct} struct
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
        return new this._class(memory, address);
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

/** @type {boolean} */
const X32 = (function() {
    switch (process.arch) {
        case 'x32':
            return true;
        case 'x64':
            return false;
        default:
            throw new Error('Unsupported running Node architecture type : ' + process.arch);
    }
})();

class StructPointer extends Type {

    constructor(pointedStruct) {
        super(StructPointer.getPtrSize());
        this.struct = pointedStruct;
    }

    /**
     * @return {number}
     */
    static getPtrSize() {
        switch (process.arch) {
            case 'x32':
                return 4;
            case 'x64':
                return 8;
            default:
                throw new Error('Unsupported running Node architecture type : ' + process.arch);
        }
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
        super(X32 ? 4 : 8);
    }

    /** @override */
    read(memory, address) {
        return X32 ? memory.readReal32(address) : memory.readReal64(address);
    }

    /** @override */
    write(memory, address, data) {
        return X32 ? memory.writeReal32(address, data) : memory.writeReal64(address, data);
    }
};

module.exports = {
    Struct,
    StructPointer,
    StructField,
    Type
};
