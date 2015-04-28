/*** Bloom 4 ***/
var Bloom;
(function (Bloom) {
    Bloom.elements = {};
    Bloom.global = {};

    function grow() {
        register_element();
    }
    Bloom.grow = grow;

    function register_element() {
        var proto = Object.create(HTMLElement.prototype);

        proto.createdCallback = function () {
            var name = this.attributes.name.value;
            var template = this.querySelector('template');
            var content = template.content;
            var children = content.childNodes;
            for (var i = children.length - 1; i >= 0; --i) {
                var node = children[i];
                if (node.nodeType == 8)
                    content.removeChild(node);
            }

            Bloom.elements[name] = {
                name: name,
                template: template
            };
        };

        document.registerElement('bloom-flower', { prototype: proto });
    }

    function bootrap_angular_app(flower, model, modules) {
        model = model || {};
        var element = jQuery(flower);
        if (typeof model.preinitialize == 'function') {
            model.preinitialize.call(model, flower);
        }

        modules = modules || [];
        modules.unshift([
            '$provide', function ($provide) {
                $provide.value('$rootElement', element);
            }]);
        modules.unshift('ng');

        function bind_to_scope(scope, i, item) {
            scope[i] = typeof item != 'function' ? item : function () {
                item.apply(flower, arguments);
            };
        }

        var injector = angular.injector(modules);
        injector.invoke([
            '$rootScope', '$compile', '$injector',
            function (scope, compile, injector) {
                scope.global = Bloom.global;
                if (typeof model == 'function') {
                    model(scope, element);
                } else {
                    for (var i in model) {
                        flower[i] = model[i];
                    }
                    if (model.scope) {
                        for (var i in model.scope) {
                            bind_to_scope(scope, i, model.scope[i]);
                        }
                    }
                }

                //console.log('Created', element[0].nodeName, model)
                flower.element = scope.element = element;
                element.children().each(function () {
                    compile(this)(scope);
                });

                flower.scope = scope;
                if (typeof flower.initialize == 'function')
                    flower.initialize();

                scope.$digest();
            }]);
        return injector;
    }

    function flower(name, model, modules) {
        //console.log('Registering custom flower: ' + name)
        var proto = Object.create(HTMLElement.prototype);

        proto.createdCallback = function () {
            var element_type = Bloom.elements[name];
            var template = document.importNode(element_type.template.content, true);
            var content = template.querySelector('content');
            if (content) {
                var children = [], i;
                for (i = this.children.length - 1; i >= 0; --i) {
                    children.push(this.removeChild(this.children[i]));
                }

                this.appendChild(template);
                var parent = content.parentNode;
                for (i = 0; i < children.length; ++i) {
                    parent.insertBefore(children[i], content);
                }

                parent.removeChild(content);
            } else {
                if (this.childNodes.length > 0)
                    this.insertBefore(template, this.firstChild);
                else
                    this.appendChild(template);
            }

            this.setAttribute('ng-non-bindable', '');
        };

        proto.attachedCallback = function () {
            bootrap_angular_app(this, model, modules);
        };

        document.registerElement(name, { prototype: proto });
    }
    Bloom.flower = flower;

    function get_url_arguments(source) {
        if (typeof source === "undefined") { source = undefined; }
        var result = {}, text;
        if (source !== undefined)
            text = source;
        else
            text = window.location.search;

        var items = text.slice(1).split(/[\&=]/);
        if (items.length < 2)
            return {};

        for (var x = 0; x < items.length; x += 2) {
            result[items[x]] = decodeURIComponent(items[x + 1].replace(/\+/g, ' '));
        }
        return result;
    }
    Bloom.get_url_arguments = get_url_arguments;

    var Event = (function () {
        function Event() {
            this.listeners = [];
            this.one_time = [];
            this.was_invoked = false;
            this.last_args = null;
        }
        Event.prototype.add = function (listener, callback) {
            this.listeners.push({
                listener: listener,
                callback: callback
            });
        };

        Event.prototype.once = function (listener, callback) {
            if (this.was_invoked) {
                callback.apply(listener, this.last_args);
            } else {
                this.one_time.push({
                    listener: listener,
                    callback: callback
                });
            }
        };

        Event.prototype.invoke = function () {
            var args = this.last_args = Array.prototype.slice.call(arguments);

            for (var i = 0; i < this.listeners.length; ++i) {
                var item = this.listeners[i];
                item.callback.apply(item.listener, args);
            }

            for (var i = 0; i < this.one_time.length; ++i) {
                var item = this.one_time[i];
                item.callback.apply(item.listener, args);
            }

            this.one_time = [];
            this.was_invoked = true;
        };
        return Event;
    })();
    Bloom.Event = Event;
})(Bloom || (Bloom = {}));

Bloom.grow();
//# sourceMappingURL=bloom.js.map
