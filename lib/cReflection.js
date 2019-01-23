const Robot = require("robot-js");
const {Memory} = {Robot};

class Type {
    /**
     * @param size
     * @param memoryFunctions {{read, write}}
     */
    constructor(size, memoryFunctions) {
        this.size = size;
        this.memoryFunctions = {
            /** @this {StructField} */
            read: memoryFunctions.read,
            /** @this {StructField} */
            write: memoryFunctions.write
        }
    }
}

const Struct_MEMORY_FUNCTIONS = {
    read: function(memory, address) {
        return this.type.read(memory, address);
    },
    write: function(memory, address, data) {
        throw new Error('Not implemented');
    }
};

class Struct extends Type {

    static get MEMORY_FUNCTIONS() {
        return Struct_MEMORY_FUNCTIONS;
    };

    constructor(name) {
        super(0, Struct.MEMORY_FUNCTIONS);
        this.name = name;
        this.fields = {};
        this.nextOffset = 0;
        /** @type {StructPointer} */
        this._pointer = undefined;
        this._class = class {
            /**
             * @param struct {Struct}
             * @param memory {Memory}
             * @param address Memory pointer (cf Robot-JS)
             */
            constructor(struct, memory, address) {
                // FIXME trouver des noms sans conflit avec les noms des propriétés de la struct : _ ou __
                this.struct = struct;
                this.memory = memory;
                this.address = address;
            }

            /**
             * @return {string} name of this _class
             */
            static get name() {
                return name;
            }

        };
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
        this.nextOffset = offset + Struct.getSize(field.type);
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

    static getSize(typeOrStruct) {
        if (typeOrStruct instanceof Struct) {
            return StructPointer.getPtrSize();
        }
        if ('size' in typeOrStruct) {
            return typeOrStruct.size;
        }
        throw new Error('size not implemented for ' + typeOrStruct);
    }

    /**
     * Useful to skip unknown fields in a struct
     * @param nextOffset {number}
     * @return {this}
     */
    setNextOffset(nextOffset) {
        this.nextOffset = nextOffset;
        return this;
    }

    // TODO add this method to Memory's prototype
    /**
     * @param memory memory from Robot-JS
     * @param address memory pointer from Robot-JS
     */
    read(memory, address) {
        return new this._class(this, memory, address);
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
        const readFunction = field.type.memoryFunctions.read.bind(field);
        return readFunction(memory, address + field.offset);
    }

    writeField(memory, address, name, data) {
        /** type {StructField} */
        const field = this.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.name}`);
            return undefined;
        }
        const writeFunction = field.type.memoryFunctions.write.bind(field);
        return writeFunction(memory, address + field.offset, data);
    }
}

const StructPointer_MEMORY_FUNCTIONS = {
    read: function(memory, address) {
        return this.type.read(memory, address);
    },
    write: function(memory, address, data) {
        throw new Error('Not implemented');
    }
};

class StructPointer extends Type {

    static get MEMORY_FUNCTIONS() {
        return StructPointer_MEMORY_FUNCTIONS;
    };
    constructor(pointedStruct) {
        super(StructPointer.getPtrSize(), StructPointer.MEMORY_FUNCTIONS);
        this.struct = pointedStruct;
    }

    /**
     * @return {number}
     * @deprecated FIXME only for 32 bits EXE
     */
    static getPtrSize() {
        console.warn("FIXME pointer is 4 bytes only for 32 bits EXE");
        return 4;
    }

    // TODO add this method to Memory's prototype
    /**
     * @param memory memory from Robot-JS
     * @param address memory pointer from Robot-JS
     * @return {Object} instance of this Struct
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

Type.REAL_32 = new Type(4, {
    read: function(memory, address) {
        return memory.readReal32(address);
    },
    write: function(memory, address, data) {
        return memory.writeReal32(address, data);
    },
});

module.exports = {
    Struct,
    StructPointer,
    StructField,
    FieldType: Type
};
