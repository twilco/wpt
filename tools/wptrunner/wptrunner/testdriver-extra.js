"use strict";

(function(){
    let pending_resolve = null;
    let pending_reject = null;
    let result = null;
    window.addEventListener("message", function(event) {
        const data = event.data;

        if (typeof data !== "object" && data !== null) {
            return;
        }

        if (data.type !== "testdriver-complete") {
            return;
        }

        if (data.status === "success") {
            result = JSON.parse(data.message).result;
            pending_resolve(result);
        } else {
            pending_reject(`${data.status}: ${data.message}`);
        }
    });

    let last_window_id = 0;
    function get_window_id(win) {
        if (win === window) {
            return null;
        }
        // This is a hack until some implementations support proper window ids
        // It won't work cross-frame
        if (!win.name) {
            win.name = "__wptrunner_window " + last_window_id++;
        }
        return win.name;
    }

    const get_context = function(element) {
        console.log("get_context", element);
        if (!element) {
            return null;
        }
        let elementWindow = element.ownerDocument.defaultView;
        let top = elementWindow.top;
        if (top === elementWindow && elementWindow === window) {
            // For the current window just return null
            return null;
        }
        let stack = [[{window: top, index:-1}]];
        while (stack.length) {
            let item = stack.pop();
            let target = item[item.length - 1];
            if (target.window === elementWindow) {
                console.log("get_context", item);
                return item.map((x, i) => i === 0 ? get_window_id(x.window) : x.index);
            }
            for (var i = 0; i<target.window.frames.length; i++) {
                // We could reconstruct the full array from the stack to avoid N**2 complexity
                // but the typical value of N is going to be very small
                stack.push(item.concat([{window: target.window.frames[i], index:i}]));
            }
        }
        return null;
    };

    const get_selector = function(element) {
        let selector;

        if (element.id) {
            const id = element.id;

            selector = "#";
            // escape everything, because it's easy to implement
            for (let i = 0, len = id.length; i < len; i++) {
                selector += '\\' + id.charCodeAt(i).toString(16) + ' ';
            }
        } else {
            // push and then reverse to avoid O(n) unshift in the loop
            let segments = [];
            for (let node = element;
                 node.parentElement;
                 node = node.parentElement) {
                let segment = "*|" + node.localName;
                let nth = Array.prototype.indexOf.call(node.parentElement.children, node) + 1;
                segments.push(segment + ":nth-child(" + nth + ")");
            }
            segments.push(":root");
            segments.reverse();

            selector = segments.join(" > ");
        }

        return selector;
    };

    window.test_driver_internal.in_automation = true;

    window.test_driver_internal.click = function(element) {
        console.log("click");
        const context = get_context(element);
        const selector = get_selector(element);
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "click",
                                               selector,
                                               context});
        return pending_promise;
    };

    window.test_driver_internal.send_keys = function(element, keys) {
        const selector = get_selector(element);
        const context = get_selector(element);
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "send_keys",
                                               selector,
                                               keys,
                                               context});
        return pending_promise;
    };

    window.test_driver_internal.action_sequence = function(actions) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        let context = null;
        for (let actionSequence of actions) {
            if (actionSequence.type == "pointer") {
                for (let action of actionSequence.actions) {
                    // The origin of each action can only be an element or a string of a value "viewport" or "pointer".
                    if (action.type == "pointerMove" && typeof(action.origin) != 'string') {
                        action.origin = {selector: get_selector(action.origin)};
                        let action_context =  get_context(action.origin);
                        if (context !== null && action_context !== context) {
                            throw new Error("Actions must be in a single context");
                        }
                    }
                }
            }
        }
        window.__wptrunner_message_queue.push({type: "action",
                                               action: "action_sequence",
                                               actions,
                                               context});
        return pending_promise;
    };

    window.test_driver_internal.generate_test_report = function(message) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "generate_test_report",
                                               message});
        return pending_promise;
    };

    window.test_driver_internal.set_permission = function(permission_params) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "set_permission",
                                               permission_params});
        return pending_promise;
    };

    window.test_driver_internal.add_virtual_authenticator = function(config) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "add_virtual_authenticator",
                                               config});
        return pending_promise;
    };

    window.test_driver_internal.remove_virtual_authenticator = function(authenticator_id) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "remove_virtual_authenticator",
                                               authenticator_id});
        return pending_promise;
    };

    window.test_driver_internal.add_credential = function(authenticator_id, credential) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "add_credential",
                                               authenticator_id, credential});
        return pending_promise;
    };

    window.test_driver_internal.get_credentials = function(authenticator_id) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "get_credentials",
                                               authenticator_id});
        return pending_promise;
    };

    window.test_driver_internal.remove_credential = function(authenticator_id, credential_id) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "remove_credential",
                                               authenticator_id,
                                               credential_id});
        return pending_promise;
    };

    window.test_driver_internal.remove_all_credentials = function(authenticator_id) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "remove_all_credentials",
                                               authenticator_id});
        return pending_promise;
    };

    window.test_driver_internal.set_user_verified = function(authenticator_id, uv) {
        const pending_promise = new Promise(function(resolve, reject) {
            pending_resolve = resolve;
            pending_reject = reject;
        });
        window.__wptrunner_message_queue.push({"type": "action",
                                               "action": "set_user_verified",
                                               authenticator_id,
                                               uv});
        return pending_promise;
    };
})();
