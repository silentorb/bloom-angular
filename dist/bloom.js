var Bloom;
(function (Bloom) {
    Bloom.elements = {};
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
        flower = jQuery(flower);
        modules = modules || [];
        modules.unshift(['$provide', function ($provide) {
            $provide.value('$rootElement', flower);
        }]);
        modules.unshift('ng');
        var injector = angular.injector(modules);
        injector.invoke(['$rootScope', '$rootElement', '$compile', '$injector', function (scope, flower, compile, injector) {
            scope.$apply(function () {
                var new_scope;
                if (typeof model == 'function') {
                    new_scope = scope;
                    model(scope, flower);
                }
                else {
                    new_scope = angular.extend(scope.$new(), model);
                }
                flower.data('$injector', injector);
                compile(flower)(new_scope);
                new_scope.flower = flower;
                if (typeof new_scope.initialize == 'function')
                    new_scope.initialize();
            });
        }]);
        return injector;
    }
    function flower(name, model, modules) {
        var proto = Object.create(HTMLElement.prototype);
        proto.createdCallback = function () {
            var element_type = Bloom.elements[name];
            var template = document.importNode(element_type.template.content, true);
            this.appendChild(template);
        };
        proto.attachedCallback = function () {
            bootrap_angular_app(this, model, modules);
        };
        document.registerElement(name, { prototype: proto });
    }
    Bloom.flower = flower;
    var Event = (function () {
        function Event() {
            this.listeners = [];
        }
        Event.prototype.add = function (listener, callback) {
            this.listeners.push({
                listener: listener,
                callback: callback
            });
        };
        Event.prototype.invoke = function () {
            var args = Array.prototype.slice.call(arguments);
            for (var i = 0; i < this.listeners.length; ++i) {
                var item = this.listeners[i];
                item.callback.apply(item.listener, args);
            }
        };
        return Event;
    })();
    Bloom.Event = Event;
})(Bloom || (Bloom = {}));
Bloom.grow();
//# sourceMappingURL=bloom.js.map