'use strict';

var define = define ? define : require('amdefine')(module);

define(function(require) {
    var utils = module.isClient ? require('danf/utils') : require('../utils');

    /**
     * Initialize a new section processor for the config.
     *
     * @param {string} name The name of the section.
     * @param {object} contract The contract that the config must respect.
     * @param {danf:manipulation.dataResolver} configurationResolver The configuration resolver.
     * @param {danf:manipulation.referenceResolver} referenceResolver The reference resolver.
     * @param {danf:configuration.namespacer} namespacer The namespacer.
     */
    function SectionProcessor(name, contract, configurationResolver, referenceResolver, namespacer) {
        if (name) {
            this._name = name;
        }
        this._priority = false;
        this.contract = contract;
        if (configurationResolver) {
            this.configurationResolver = configurationResolver;
        }
        if (referenceResolver) {
            this.referenceResolver = referenceResolver;
        }
        if (namespacer) {
            this.namespacer = namespacer;
        }
    }

    SectionProcessor.defineImplementedInterfaces(['danf:configuration.sectionProcessor']);

    SectionProcessor.defineDependency('_configurationResolver', 'danf:manipulation.dataResolver');
    SectionProcessor.defineDependency('_referenceResolver', 'danf:manipulation.referenceResolver');
    SectionProcessor.defineDependency('_namespacer', 'danf:configuration.namespacer');

    /**
     * @interface {danf:configuration.sectionProcessor}
     */
    Object.defineProperty(SectionProcessor.prototype, 'contract', {
        get: function() { return this._contract; },
        set: function(contract) { this._contract = contract; }
    });

    /**
     * @interface {danf:configuration.sectionProcessor}
     */
    Object.defineProperty(SectionProcessor.prototype, 'name', {
        get: function() { return this._name; },
        set: function(name) {
            this._name = name;
        }
    });

    /**
     * @interface {danf:configuration.sectionProcessor}
     */
    Object.defineProperty(SectionProcessor.prototype, 'priority', {
        get: function() { return this._priority; }
    });

    /**
     * Set The configuration resolver.
     *
     * @param {danf:manipulation.configurationResolver} configurationResolver The configuration resolver.
     * @api public
     */
    Object.defineProperty(SectionProcessor.prototype, 'configurationResolver', {
        set: function(configurationResolver) {
            this._configurationResolver = configurationResolver;
        }
    });

    /**
     * Set the reference resolver.
     *
     * @param {danf:manipulation.referenceResolver} referenceResolver The reference resolver.
     * @api public
     */
    Object.defineProperty(SectionProcessor.prototype, 'referenceResolver', {
        set: function(referenceResolver) {
            this._referenceResolver = referenceResolver;
        }
    });

    /**
     * Set the namespacer.
     *
     * @param {danf:configuration.namespacer} namespacer The namespacer.
     * @api public
     */
    Object.defineProperty(SectionProcessor.prototype, 'namespacer', {
        set: function(namespacer) {
            this._namespacer = namespacer;
        }
    });

    /**
     * @interface {danf:configuration.sectionProcessor}
     */
    SectionProcessor.prototype.process = function(modulesTree, environment) {
        // Check the contract existence.
        if (!this.contract || 'object' !== typeof this.contract) {
            throw new Error(
                'There is no defined contract for the field "{0}".'.format(this._name)
            );
        }

        var config = {},
            level = 0,
            modules = modulesTree.getLevel(level),
            levelConfig = {},
            maxLevel = -1
        ;

        // Process each level.
        while (0 !== modules.length) {
            levelConfig[level] = {};

            var names = [this._name, '{0}/{1}'.format(this._name, environment)];

            for (var i = 0; i < names.length; i++) {
                var name = names[i],
                    envConfig = {}
                ;

                for (var j = 0; j < modules.length; j++) {
                    var module = modules[j],
                        moduleConfig = getModuleConfig(name, module, this.contract)
                    ;

                    if (moduleConfig) {
                        moduleConfig = processField(
                            name,
                            moduleConfig,
                            module,
                            this.contract,
                            this._configurationResolver,
                            modulesTree
                        );

                        moduleConfig = this.interpretModuleConfig(moduleConfig, module, modulesTree);

                        envConfig = mergeConfig(
                            name,
                            envConfig,
                            moduleConfig,
                            this.contract,
                            module,
                            false,
                            this._configurationResolver,
                            modulesTree,
                            true
                        );
                    }
                }

                // Overwrite section config with environment section config.
                levelConfig[level] = mergeConfig(
                    name,
                    levelConfig[level],
                    envConfig,
                    this.contract,
                    module,
                    true,
                    this._configurationResolver,
                    modulesTree,
                    true
                );
            }

            modules = modulesTree.getLevel(++level);

            if (0 === modules.length && -1 === maxLevel) {
                maxLevel = level - 1;
                // Handle danf framework module.
                modules = modulesTree.getLevel(1000);
            }
        }

        // Overwrite higher levels config with lower ones.
        for (var level in levelConfig) {
            config = mergeConfig(
                this._name,
                levelConfig[level],
                config,
                this.contract,
                module,
                true,
                this._configurationResolver,
                modulesTree,
                maxLevel != level
            );
        }

        return config;
    }

    /**
     * @interface {danf:configuration.sectionProcessor}
     */
    SectionProcessor.prototype.preProcess = function(config, sectionConfig, modulesTree) {
        return config;
    }

    /**
     * @interface {danf:configuration.sectionProcessor}
     */
    SectionProcessor.prototype.postProcess = function(config, sectionConfig, modulesTree) {
        return config;
    }

    /**
     * @interface {danf:configuration.sectionProcessor}
     */
    SectionProcessor.prototype.interpretAllModuleConfig = function(config, module, modulesTree) {
        return config;
    }

    /**
     * Interpret the config of a module for this section.
     *
     * @param {object} config The config of the module.
     * @param {danf:configuration.module} module The module.
     * @param {danf:configuration.modulesTree} modulesTree The modules tree.
     * @return {object} The interpreted config of the module.
     * @api protected
     */
    SectionProcessor.prototype.interpretModuleConfig = function(config, module, modulesTree) {
        return config;
    }

    /**
     * Resolve the references in the config.
     *
     * @param {string|object} config The config.
     * @param {string} delimiter The delimiter for the reference.
     * @param {object} contect The context.
     * @return {string|object} The config with resolved references.
     * @api protected
     */
    SectionProcessor.prototype.resolveReferences = function(config, delimiter, context) {
        if ('object' === typeof config) {
            for (var key in config) {
                config[key] = this.resolveReferences(config[key], delimiter, context);
            }
        } else if ('string' === typeof config) {
            config = this._referenceResolver.resolve(
                config,
                delimiter,
                context
            );
        }

        return config;
    }

    /**
     * Get the config of the module.
     *
     * @param {string} name The name of the field.
     * @param {danf:configuration.module} module The module.
     * @param {object} contract The contract to merge the config.
     * @return {object} The config.
     * @api private
     */
    var getModuleConfig = function(name, module, contract) {
        if (module.alias) {
            return {};
        }

        var config = {},
            relativeName = '',
            environment = name.split('/')[1],
            thisName = 'this'
        ;

        if (module.id === name.substr(0, module.id.length)) {
            relativeName = name.substr(module.id.length + 1);
        }

        if (environment) {
            thisName = 'this/{0}'.format(environment);
        }

        // Config in the module itself.
        if (name.split('/')[0] === module.id && module.config[thisName]) {
            config = module.config[thisName];
        // Config in a parent module.
        } else if (module.config[relativeName]) {
            config = module.config[relativeName];
        // General config
        } else if (module.config[name]) {
            config = module.config[name];
        }

        return utils.clone(config);
    }

    /**
     * Merge two config of the section.
     *
     * @param {string} name The name of the field.
     * @param {object} config1 The first config.
     * @param {object} config2 The second config.
     * @param {object} contract The contract to merge the config.
     * @param {danf:configuration.module} module The module.
     * @param {object} erase Should erase config1 with config2 if conflicts?
     * @param {danf:manipultation.dataInterpreter} configurationResolver The configuration resolver.
     * @param {danf:configuration.modulesTree} modulesTree The modules tree.
     * @param {boolean} disableDefault Whether or not to disable default value setting.
     * @return {object} The merged config.
     * @api private
     */
    var mergeConfig = function(name, config1, config2, contract, module, erase, configurationResolver, modulesTree, disableDefault) {
        try {
            var mergedConfig = configurationResolver.merge(
                config1,
                config2,
                contract,
                erase,
                name,
                {module: module, modulesTree: modulesTree, disableDefault: disableDefault}
            );
        } catch (error) {
            if (error.instead) {
                throw new Error('{0} {1}.'.format(
                    error.message.substr(0, error.message.length - 1),
                    'in the configuration of the module "{0}"'.format(module.id)
                ));
            }

            throw error;
        }

        return mergedConfig;
    }

    /**
     * Process a field of the config.
     *
     * @param {string} name The name of the field.
     * @param {object} value The value of the field.
     * @param {danf:configuration.module} module The module.
     * @param {object} contract The contract to validate the field.
     * @param {danf:manipultation.dataInterpreter} configurationResolver The configuration resolver.
     * @param {danf:configuration.modulesTree} modulesTree The modules tree.
     * @return {object} The processed field value.
     * @api private
     */
    var processField = function(name, value, module, contract, configurationResolver, modulesTree) {
        try {
            var processedValue = configurationResolver.resolve(
                value,
                contract,
                name,
                {module: module, modulesTree: modulesTree, disableDefault: true}
            );
        } catch (error) {
            if (error.instead) {
                throw new Error('{0} {1}.'.format(
                    error.message.substr(0, error.message.length - 1),
                    'in the configuration of the module "{0}"'.format(module.id)
                ));
            }

            throw error;
        }

        return processedValue;
    }

    /**
     * Expose `SectionProcessor`.
     */
    return SectionProcessor;
});