class Enum {
    /**
     * @param enumClass the Enum to search value into
     * @param searchValue value to search name, value type must <b>exactly</b> match enumClass values type
     * @return {string} the key in the enum class where we can find the search value
     */
    static name(enumClass, searchValue) {
        return Object.keys(enumClass)
            .find(key => enumClass[key] === searchValue);
    }

    /**
     * @param enumClass the Enum that will get every Java-like enum functions
     */
    static addEnumFunctions(enumClass) {
        enumClass.name = function(searchValue) {
            return Enum.name(enumClass, searchValue);
        }
    }
}

module.exports = {
    Enum
};
