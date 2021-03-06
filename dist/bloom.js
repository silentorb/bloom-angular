/*** Bloom Angular ***/
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
            var info = Bloom.elements[name] = Bloom.elements[name] || {};
            info.name = name;
            info.template = template;
        };
        document.registerElement('bloom-flower', { prototype: proto });
    }
    function angularize(flower, model, modules) {
        model = model || {};
        var element = jQuery(flower);
        if (typeof model.preinitialize == 'function') {
            model.preinitialize.call(model, flower);
        }
        modules = modules || [];
        if (typeof modules == 'string')
            modules = [modules];
        modules.unshift(['$provide', function ($provide) {
            $provide.value('$rootElement', element);
        }]);
        modules.unshift('ng');
        function bind_to_scope(scope, i, item) {
            scope[i] = typeof item != 'function' ? item : function () {
                return item.apply(flower, arguments);
            };
        }
        var injector = angular.injector(modules);
        injector.invoke(['$rootScope', '$compile', '$injector', function (scope, compile, injector) {
            scope.global = Bloom.global;
            if (typeof model == 'function') {
                model(scope, element);
            }
            else {
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
            flower.get_component = function (name) {
                return injector.get(name);
            };
            if (typeof flower.initialize == 'function')
                flower.initialize();
            scope.$digest();
        }]);
        return injector;
    }
    function flowerize(node, name) {
        var element_type = Bloom.elements[name];
        var template = document.importNode(element_type.template.content, true);
        for (var j in element_type.template.attributes) {
            var attr = element_type.template.attributes[j];
            if (attr.value)
                node.setAttribute(attr.name, attr.value);
        }
        var content = template.querySelector('content');
        if (content) {
            var children = [], i;
            for (i = node.children.length - 1; i >= 0; --i) {
                children.push(node.removeChild(node.children[i]));
            }
            node.appendChild(template);
            var parent = content.parentNode;
            for (i = 0; i < children.length; ++i) {
                parent.insertBefore(children[i], content);
            }
            parent.removeChild(content);
        }
        else {
            if (node.childNodes.length > 0)
                node.insertBefore(template, node.firstChild);
            else
                node.appendChild(template);
        }
        node.setAttribute('ng-non-bindable', '');
    }
    Bloom.flowerize = flowerize;
    function flower(name, model, modules) {
        //console.log('Registering custom flower: ' + name)
        var proto = Object.create(HTMLElement.prototype);
        proto.createdCallback = function () {
            flowerize(this, name);
        };
        proto.attachedCallback = function () {
            angularize(this, Bloom.extend({}, model), modules);
        };
        if (typeof model.on_prune == 'function') {
            proto.detachedCallback = function () {
                this.on_prune();
            };
        }
        else if (typeof model.on_disconnect == 'function') {
            proto.detachedCallback = function () {
                this.on_disconnect();
            };
        }
        //console.log('registering custom element:', name);
        document.registerElement(name, { prototype: proto });
    }
    Bloom.flower = flower;
    function extend(target, source, depth) {
        if (depth === void 0) { depth = 0; }
        if (depth > 6)
            if (depth > 6)
                throw new Error('Bloom.extend(): Depth limit of 6 was exceeded.');
        for (var i in source) {
            if (typeof source[i] == 'object') {
                if (!source[i]) {
                    target[i] = null;
                }
                else {
                    var child = Array.isArray(source[i]) ? [] : {};
                    target[i] = Bloom.extend(child, source[i], depth + 1);
                }
            }
            else {
                target[i] = source[i];
            }
        }
        return target;
    }
    Bloom.extend = extend;
    function bud(name, model, modules) {
        var info = Bloom.elements[name] = Bloom.elements[name] || {};
        info.model = model;
        info.modules = modules;
    }
    Bloom.bud = bud;
    function blossom(parent, name) {
        var info = Bloom.elements[name];
        var flower = document.createElement(name);
        parent.appendChild(flower);
        flowerize(flower, name);
        angularize(flower, Bloom.extend({}, info.model), info.modules);
        return flower;
    }
    Bloom.blossom = blossom;
    function prune(flower) {
        if (typeof flower.on_disconnect == 'function')
            flower.on_disconnect();
        if (typeof flower.on_prune == 'function')
            flower.on_prune();
        if (flower.parentNode)
            flower.parentNode.removeChild(flower);
    }
    Bloom.prune = prune;
    function get_url_arguments(source) {
        if (source === void 0) { source = undefined; }
        var result = {}, text;
        if (source !== undefined)
            text = source;
        else
            text = window.location.search;
        var items = text.slice(1).split(/[\&=]/);
        if (items.length < 2)
            return {};
        for (var x = 0; x < items.length; x += 2) {
          if (!items[x + 1])
            continue
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
            }
            else {
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