'use strict';

var define = define ? define : require('amdefine')(module);

define(function(require) {
    /**
     * Module dependencies.
     */
    var utils = module.isClient ? require('danf/utils') : require('../../utils'),
        Abstract = module.isClient ? require('danf/configuration/data-interpreter/abstract-namespacer') : require('./abstract-namespacer')
    ;

    /**
     * Initialize a new section interpreter references for the config.
     *
     * @param {danf:configuration.namespacer} namespacer The namespacer.
     */
    function References(namespacer) {
    	Abstract.call(this, namespacer);
    }

    utils.extend(Abstract, References);

    /**
     * @interface {danf:manipulation.dataInterpreter}
     */
    Object.defineProperty(References.prototype, 'handles', {
        value: 'References'
    });

    /**
     * @interface {danf:manipulation.dataInterpreter}
     */
    Object.defineProperty(References.prototype, 'order', {
        value: 1300
    });

    /**
     * @interface {danf:manipulation.dataInterpreter}
     */
    References.prototype.interpret = function(name, value, contract, parameters) {
        // Prefix the references with the namespace.
        if (null != value && contract.references) {
            for (var i = 0; i < contract.references.length; i++) {
                value = this._namespacer.prefixReferences(
                    value,
                    contract.references[i],
                    parameters.module,
                    parameters.modulesTree
                );
            }
        }

        return value;
    }

    /**
     * Expose `References`.
     */
    return References;
});