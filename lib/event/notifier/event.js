'use strict';

var define = define ? define : require('amdefine')(module);

define(function(require) {
    /**
     * Module dependencies.
     */
    var utils = module.isClient ? require('danf/utils') : require('../../utils'),
        Abstract = module.isClient ? require('danf/event/notifier/abstract') : require('./abstract')
    ;

    /**
     * Initialize a new event notifier.
     *
     * @param {danf:manipulation.dataResolver} dataResolver The data resolver.
     */
    function Event(dataResolver) {
        Abstract.call(this, dataResolver);
    }

    utils.extend(Abstract, Event);

    /**
     * @interface {danf:event.notifier}
     */
    Object.defineProperty(Event.prototype, 'name', {
        value: 'event'
    });

    /**
     * @interface {danf:event.notifier}
     */
    Object.defineProperty(Event.prototype, 'contract', {
        value: {
            context: {
                type: 'free'
            },
            callback: {
                type: 'function'
            }
        }
    });

    /**
     * @inheritdoc
     */
    Event.prototype.notifyEvent = function(name, event, sequencer, data) {
        sequencer.start(
            {
                data: data,
                context: event.context
            },
            event.callback
        );
    }

    /**
     * Expose `Event`.
     */
    return Event;
});