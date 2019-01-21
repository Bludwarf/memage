const Robot = require("robot-js");
const [Memory] = [Robot.Memory];

class Struct {
    constructor(name) {
        this.name = name;
        this.fields = {};
        this.nextOffset = 0;
    }

    /**
     *
     * @param type {FieldType}
     * @param name {string}
     * @param offset {number}
     * @return {this}
     */
    addField(type, name, offset=this.nextOffset) {
        const field = new StructField(this, offset, type, name);
        this.nextOffset = offset + field.type.size;
        this.fields[name] = field;
        return this;
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
}

class StructField {
    /**
     * @param struct {Struct} structure containing this field
     * @param offset {number} offset from struct base pointer
     * @param type {FieldType}
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

class FieldType {
    /**
     * @param size
     * @param memoryFunctions {{read, write}}
     */
    constructor(size, memoryFunctions) {
        this.size = size;
        this.memoryFunctions = {
            read: memoryFunctions.read,
            write: memoryFunctions.write
        }
    }
}

FieldType.REAL_32 = new FieldType(4, {
    read: 'readReal32',
    write: 'writeReal32'
});

class StructInstance {

    /**
     * @param struct {Struct}
     * @param memory {Memory}
     * @param ptr Memory pointer (cf Robot-JS)
     */
    constructor(struct, memory, ptr) {
        this.struct = struct;
        this.memory = memory;
        this.ptr = ptr;

        // Add getter and setter to fields
        const properties = {};
        for (const fieldName in this.struct.fields) {
            if (this.struct.fields.hasOwnProperty(fieldName)) {
                properties[fieldName] = {
                    get: function () {
                        return this.readField(fieldName);
                    },
                    set: function (value) {
                        return this.writeField(fieldName, value);
                    }
                };
            }
        }
        Object.defineProperties(this, properties);
    }

    /**
     * @param name {string}
     * @returns {undefined}, undefined if error
     */
    readField(name) {
        const field = this.struct.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.struct.name}`);
            return undefined;
        }
        const readFunction = this.memory[field.type.memoryFunctions.read].bind(this.memory);
        return readFunction(this.ptr + field.offset);
    }

    writeField(name, value) {
        /** type {StructField} */
        const field = this.struct.fields[name];
        if (!field) {
            console.error(`Field ${name} not found in struct ${this.struct.name}`);
            return undefined;
        }
        const writeFunction = this.memory[field.type.memoryFunctions.write].bind(this.memory);
        return writeFunction(this.ptr + field.offset, value);
    }
}

module.exports = {
    Struct,
    StructField,
    FieldType,
    StructInstance
};
