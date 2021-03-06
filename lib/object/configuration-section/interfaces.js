'use strict';

var define = define ? define : require('amdefine')(module);

define(function(require) {
    /**
     * Module dependencies.
     */
    var utils = module.isClient ? require('danf/utils') : require('../../utils'),
        SectionProcessor = module.isClient ? require('danf/configuration/section-processor') : require('../../configuration/section-processor')
    ;

    /**
     * Initialize a new section processor interfaces for the config.
     *
     * @param {string} name The name of the section.
     * @param {danf:configuration.configurationResolver} configurationResolver The configuration resolver.
     * @param {danf:manipulation.referenceResolver} referenceResolver The reference resolver.
     */
    function Interfaces(name, configurationResolver, referenceResolver) {
        SectionProcessor.call(this, name, null, configurationResolver, referenceResolver);

        this.contract = {
            __any: {
                extends: {
                    type: 'string'
                },
                methods: {
                    type: 'embedded_object',
                    embed: {
                        arguments: {
                            type: 'string_array',
                            default: []
                        },
                        returns: {
                            type: 'string'
                        }
                    },
                    default: {}
                },
                getters: {
                    type: 'string_object',
                    default: {}
                },
                setters: {
                    type: 'string_object',
                    default: {}
                }
            },
            type: 'embedded',
            namespaces: true
        };
    }

    utils.extend(SectionProcessor, Interfaces);

    /**
     * Expose `Interfaces`.
     */
    return Interfaces;
});