'use strict';

require('../../lib/init');

var assert = require('assert'),
    ServicesContainer = require('../../lib/dependency-injection/services-container'),
    AbstractServiceBuilder = require('../../lib/dependency-injection/service-builder/abstract'),
    AliasServiceBuilder = require('../../lib/dependency-injection/service-builder/alias'),
    ChildrenServiceBuilder = require('../../lib/dependency-injection/service-builder/children'),
    ClassServiceBuilder = require('../../lib/dependency-injection/service-builder/class'),
    DeclinationsServiceBuilder = require('../../lib/dependency-injection/service-builder/declinations'),
    FactoriesServiceBuilder = require('../../lib/dependency-injection/service-builder/factories'),
    ParentServiceBuilder = require('../../lib/dependency-injection/service-builder/parent'),
    PropertiesServiceBuilder = require('../../lib/dependency-injection/service-builder/properties'),
    TagsServiceBuilder = require('../../lib/dependency-injection/service-builder/tags'),
    AbstractBuilder = require('../../lib/dependency-injection/service-builder/abstract-service-builder'),
    ReferenceResolver = require('../../lib/manipulation/reference-resolver'),
    ReferenceType = require('../../lib/manipulation/reference-type'),
    InterfacesRegistry = require('../../lib/object/interfaces-registry'),
    utils = require('../../lib/utils')
;

var referenceResolver = new ReferenceResolver(),
    interfacesRegistry = new InterfacesRegistry(),
    servicesContainer = new ServicesContainer(referenceResolver, interfacesRegistry)
;

var parameterType = new ReferenceType();
parameterType.name = '%';
parameterType.delimiter = '%';

var contextType = new ReferenceType();
contextType.name = '@';
contextType.delimiter = '@';

var configType = new ReferenceType();
configType.name = '$';
configType.delimiter = '$';

var serviceType = new ReferenceType();
serviceType.name = '#';
serviceType.delimiter = '#';
serviceType.allowsConcatenation = false;

var serviceTagType = new ReferenceType();
serviceTagType.name = '&';
serviceTagType.delimiter = '&';
serviceTagType.allowsConcatenation = false;

var serviceFactoryType = new ReferenceType();
serviceFactoryType.name = '>';
serviceFactoryType.delimiter = '>';
serviceFactoryType.size = 3;
serviceFactoryType.allowsConcatenation = false;

referenceResolver.addReferenceType(parameterType);
referenceResolver.addReferenceType(contextType);
referenceResolver.addReferenceType(configType);
referenceResolver.addReferenceType(serviceType);
referenceResolver.addReferenceType(serviceTagType);
referenceResolver.addReferenceType(serviceFactoryType);

servicesContainer.addServiceBuilder(new AbstractServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new AliasServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new ChildrenServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new ClassServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new DeclinationsServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new FactoriesServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new ParentServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new PropertiesServiceBuilder(servicesContainer, referenceResolver));
servicesContainer.addServiceBuilder(new TagsServiceBuilder(servicesContainer, referenceResolver));

var Provider = function() { this.name = 'provider'; };
Provider.prototype.provide = function() {
    return this.name;
};
Provider.prototype.reset = function() {
    this.name = '';
};
Provider.defineImplementedInterfaces(['provider']);

interfacesRegistry.index(
    'provider',
    {
        methods: {
            provide: {
                arguments: []
            }
        }
    }
);

var Manager = function() { this.name = 'manager'; };
Manager.defineDependency('providers', 'provider_object');
Object.defineProperty(Manager.prototype, 'providers', {
    get: function() {
        return this._providers;
    },
    set: function(providers) {
        this._providers = {};

        for (var i = 0; i < providers.length; i++) {
            var provider = providers[i];

            this._providers[provider.id] = provider;
        }
    }
});

var config = {
    services: {
        manager: {
            class: Manager,
            properties: {
                providers: '&provider&',
                storages: '&storage&',
                timeOut: '$timeOut$'
            }
        },
        provider: {
            class: Provider,
            declinations: '$providers$',
            properties: {
                id: '@_@',
                rules: '>rule.@rules@>provider>@@rules.@rules@@@>',
                storages: '#storage.@storages@#',
                adapter: '#@adapter@#'
            },
            tags: ['provider']
        },
        rule: {
            factories: {
                provider: {
                    properties: {
                        parameters: '>parameter.@parameters.type@>rule>@@parameters.@parameters@@@>'
                    }
                }
            },
            children: {
                minSize: {
                    class:  function() { this.name = 'rule minSize'; },
                    abstract: true
                },
                maxSize: {
                    class:  function() { this.name = 'rule maxSize'; },
                    abstract: true
                }
            }
        },
        adapter: {
            children: {
                image: {
                    class: function() { this.name = 'adapter image'; }
                }
            }
        },
        'parameter.size': {
            class: function() { this.name = 'parameter size'; },
            abstract: true,
            factories: {
                rule: {
                    properties: {
                        value: '@value@'
                    }
                }
            }
        },
        'parameter.unit': {
            class: function() { this.name = 'parameter unit'; },
            abstract: true,
            factories: {
                rule: {
                    properties: {
                        value: '@value@'
                    }
                }
            }
        },
        abstractStorage: {
            abstract: true,
            properties: {
                size: '2GB',
                type: 'SD'
            }
        },
        storage: {
            parent: 'abstractStorage',
            tags: ['storage'],
            properties: {
                type: 'HD'
            },
            children: {
                local: {
                    class: function() { this.name = 'local storage'; }
                },
                remote: {
                    class: function() { this.name = 'remote storage'; }
                }
            }
        }
    },
    providers: {
        smallImages: {
            rules: {
                maxSize: {
                    parameters: [{
                        type: 'size',
                        value: '2m'
                    }]
                }
            },
            storages: ['local'],
            adapter: 'adapter.image'
        },
        bigImages: {
            rules: {
                minSize: {
                    parameters: [
                        {
                            type: 'size',
                            value: 2
                        },
                        {
                            type: 'unit',
                            value: 'm'
                        }
                    ],
                },
                maxSize: {
                    parameters: [
                        {
                            type: 'size',
                            value: 10
                        },
                        {
                            type: 'unit',
                            value: 'm'
                        }
                    ],
                }
            },
            storages: ['local', 'remote'],
            adapter: 'adapter.image'
        }
    },
    timeOut: 2000
}

var expectedBigImagesProvider = {
    id: 'bigImages',
    name: 'provider',
    rules: [
        {
            name: 'rule minSize',
            parameters: [
                {name: 'parameter size', value: 2},
                {name: 'parameter unit', value: 'm'}
            ]
        },
        {
            name: 'rule maxSize',
            parameters: [
                {name: 'parameter size', value: 10},
                {name: 'parameter unit', value: 'm'}
            ]
        }
    ],
    storages: [
        {name: 'local storage', size: '2GB', type: 'HD'},
        {name: 'remote storage', size: '2GB', type: 'HD'}
    ],
    adapter: {name: 'adapter image'}
};

describe('Container', function() {
    it('method "processConfiguration" should set the definitions of the configured services', function() {
        servicesContainer.processConfiguration(config.services, config, true);

        assert(servicesContainer.hasDefinition('manager'));
        assert(servicesContainer.hasDefinition('provider'));
        assert(servicesContainer.hasDefinition('provider.bigImages'));
    })

    describe('method "get"', function() {
        var provider;

        it('should instanciate the definition of the services', function() {
            provider = servicesContainer.get('provider.bigImages');

            assert(provider instanceof Provider);
        })

        it('should resolve and inject the dependencies of the services', function() {
            assert.deepEqual(expectedBigImagesProvider, utils.clean(provider));
        })

        it('should resolve the tags', function() {
            var manager = servicesContainer.get('manager');

            assert.notEqual(manager.providers.bigImages, undefined);
            assert.equal(manager.storages.length, 2);
        })

        it('should add proxies to the properties of the services', function() {
            var manager = servicesContainer.get('manager'),
                provider = manager.providers.bigImages
            ;

            assert.equal(provider.provide(), 'provider');
        })

        it('should fail to resolve a non-existent reference', function() {
            assert.throws(
                function() {
                    var badConfig = utils.clone(config);

                    badConfig.services.provider.declinations = '$providersTypo$';
                    servicesContainer.processConfiguration(badConfig.services, badConfig, true);
                },
                /The reference "\$providersTypo\$" in source "\$providersTypo\$" declared in the definition of the service "provider" cannot be resolved./
            );

            assert.throws(
                function() {
                    var badConfig = utils.clone(config);

                    badConfig.services.provider.properties.rules = '>rule.@rulesTypo@>provider>@@rules.@rules@@@>';
                    servicesContainer.processConfiguration(badConfig.services, badConfig, true);
                },
                /One of the references "@rulesTypo@", "@rules@" in source ">rule.@rulesTypo@>provider>@@rules.@rules@@@>" declared in the definition of the service "provider.smallImages" cannot be resolved./
            );
        })

        it('should fail to instantiate an abstract service', function() {
            assert.throws(
                function() {
                    servicesContainer.processConfiguration(
                        {
                            a: {
                                class: function() {},
                                abstract: true
                            }
                        },
                        {},
                        true
                    );

                    servicesContainer.get('a');
                },
                /The service of id "a" is an abstract service and cannot be instantiated\./
            );
        })

        it('should fail to instantiate a service defined on an abstract class', function() {
            assert.throws(
                function() {
                    var AbstractClass = function() {};

                    AbstractClass.defineAsAbstract();
                    AbstractClass.__metadata.id = 'A';

                    servicesContainer.processConfiguration(
                        {
                            a: {
                                class: AbstractClass
                            }
                        },
                        {},
                        true
                    );

                    servicesContainer.get('a');
                },
                /The service "a" could not be instantiated because its class "A" is an abstract class\./
            );
        })

        it('should fail to instantiate a service with a circular dependency', function() {
            assert.throws(
                function() {
                    servicesContainer.processConfiguration(
                        {
                            a: {
                                class: function() {},
                                properties: {
                                    b: '#b#'
                                }
                            },
                            b: {
                                class: function() {},
                                properties: {
                                    c: '#c#'
                                }
                            },
                            c: {
                                class: function() {},
                                properties: {
                                    a: '#a#'
                                }
                            }
                        },
                        {},
                        true
                    );
                },
                /The circular dependency \["a" -> "b" -> "c" -> "a"\] prevent to build the service "a"\./
            );
        })
    })

    describe('method "set"', function() {
        it('should replace an already instanciated service', function() {
            servicesContainer.processConfiguration(config.services, config, true);

            var storage = servicesContainer.set('storage.local', { name: 'local super storage' }),
                provider = servicesContainer.get('provider.bigImages')
            ;

            assert.equal('local super storage', provider.storages[0].name);
        })
    })

    describe('method "unset"', function() {
        it('should unset an instanciated service', function() {
            assert(servicesContainer.has('storage.local'));
            servicesContainer.unset('storage.local');
            assert(!servicesContainer.has('storage.local'));
        })
    })
})