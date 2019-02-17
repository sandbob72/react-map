(function(plugin_name) {
    var dependencies = {};
    (function() {
        var root = dependencies;
        var Tweenable = (function() {
            var formula;
            var DEFAULT_SCHEDULE_FUNCTION;
            var DEFAULT_EASING = "linear";
            var DEFAULT_DURATION = 500;
            var UPDATE_TIME = 16.666666666666668;
            var _now = Date.now ? Date.now : function() {
                    return +new Date;
                };
            var now = typeof SHIFTY_DEBUG_NOW !== "undefined" ? SHIFTY_DEBUG_NOW : _now;
            if (typeof window !== "undefined") {
                DEFAULT_SCHEDULE_FUNCTION = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || window.mozCancelRequestAnimationFrame && window.mozRequestAnimationFrame || setTimeout;
            } else {
                DEFAULT_SCHEDULE_FUNCTION = setTimeout;
            }
            function noop() {}
            function each(obj, fn) {
                var key;
                for (key in obj) {
                    if (Object.hasOwnProperty.call(obj, key)) {
                        fn(key);
                    }
                }
            }
            function shallowCopy(targetObj, srcObj) {
                each(srcObj, function(prop) {
                    targetObj[prop] = srcObj[prop];
                });
                return targetObj;
            }
            function defaults(target, src) {
                each(src, function(prop) {
                    if (typeof target[prop] === "undefined") {
                        target[prop] = src[prop];
                    }
                });
            }
            function tweenProps(forPosition, currentState, originalState, targetState, duration, timestamp, easing) {
                var normalizedPosition = forPosition < timestamp ? 0 : (forPosition - timestamp) / duration;
                var prop;
                var easingObjectProp;
                var easingFn;
                for (prop in currentState) {
                    if (currentState.hasOwnProperty(prop)) {
                        easingObjectProp = easing[prop];
                        easingFn = typeof easingObjectProp === "function" ? easingObjectProp : formula[easingObjectProp];
                        currentState[prop] = tweenProp(originalState[prop], targetState[prop], easingFn, normalizedPosition);
                    }
                }
                return currentState;
            }
            function tweenProp(start, end, easingFunc, position) {
                return start + (end - start) * easingFunc(position);
            }
            function applyFilter(tweenable, filterName) {
                var filters = Tweenable.prototype.filter;
                var args = tweenable._filterArgs;
                each(filters, function(name) {
                    if (typeof filters[name][filterName] !== "undefined") {
                        filters[name][filterName].apply(tweenable, args);
                    }
                });
            }
            var timeoutHandler_endTime;
            var timeoutHandler_currentTime;
            var timeoutHandler_isEnded;
            var timeoutHandler_offset;

            function timeoutHandler(tweenable, timestamp, delay, duration, currentState, originalState, targetState, easing, step, schedule, opt_currentTimeOverride) {
                timeoutHandler_endTime = timestamp + delay + duration;
                timeoutHandler_currentTime = Math.min(opt_currentTimeOverride || now(), timeoutHandler_endTime);
                timeoutHandler_isEnded = timeoutHandler_currentTime >= timeoutHandler_endTime;
                timeoutHandler_offset = duration - (timeoutHandler_endTime - timeoutHandler_currentTime);
                if (tweenable.isPlaying()) {
                    if (timeoutHandler_isEnded) {
                        step(targetState, tweenable._attachment, timeoutHandler_offset);
                        tweenable.stop(true);
                    } else {
                        tweenable._scheduleId = schedule(tweenable._timeoutHandler, UPDATE_TIME);
                        applyFilter(tweenable, "beforeTween");
                        if (timeoutHandler_currentTime < timestamp + delay) {
                            tweenProps(1, currentState, originalState, targetState, 1, 1, easing);
                        } else {
                            tweenProps(timeoutHandler_currentTime, currentState, originalState, targetState, duration, timestamp + delay, easing);
                        }
                        applyFilter(tweenable, "afterTween");
                        step(currentState, tweenable._attachment, timeoutHandler_offset);
                    }
                }
            }
            function composeEasingObject(fromTweenParams, easing) {
                var composedEasing = {};
                var typeofEasing = typeof easing;
                if (typeofEasing === "string" || typeofEasing === "function") {
                    each(fromTweenParams, function(prop) {
                        composedEasing[prop] = easing;
                    });
                } else {
                    each(fromTweenParams, function(prop) {
                        if (!composedEasing[prop]) {
                            composedEasing[prop] = easing[prop] || DEFAULT_EASING;
                        }
                    });
                }
                return composedEasing;
            }
            function Tweenable(opt_initialState, opt_config) {
                this._currentState = opt_initialState || {};
                this._configured = false;
                this._scheduleFunction = DEFAULT_SCHEDULE_FUNCTION;
                if (typeof opt_config !== "undefined") {
                    this.setConfig(opt_config);
                }
            }
            Tweenable.prototype.tween = function(opt_config) {
                if (this._isTweening) {
                    return this;
                }
                if (opt_config !== undefined || !this._configured) {
                    this.setConfig(opt_config);
                }
                this._timestamp = now();
                this._start(this.get(), this._attachment);
                return this.resume();
            };
            Tweenable.prototype.setConfig = function(config) {
                config = config || {};
                this._configured = true;
                this._attachment = config.attachment;
                this._pausedAtTime = null;
                this._scheduleId = null;
                this._delay = config.delay || 0;
                this._start = config.start || noop;
                this._step = config.step || noop;
                this._finish = config.finish || noop;
                this._duration = config.duration || DEFAULT_DURATION;
                this._currentState = shallowCopy({}, config.from || this.get());
                this._originalState = this.get();
                this._targetState = shallowCopy({}, config.to || this.get());
                var self = this;
                this._timeoutHandler = function() {
                    timeoutHandler(self, self._timestamp, self._delay, self._duration, self._currentState, self._originalState, self._targetState, self._easing, self._step, self._scheduleFunction);
                };
                var currentState = this._currentState;
                var targetState = this._targetState;
                defaults(targetState, currentState);
                this._easing = composeEasingObject(currentState, config.easing || DEFAULT_EASING);
                this._filterArgs = [currentState, this._originalState, targetState, this._easing];
                applyFilter(this, "tweenCreated");
                return this;
            };
            Tweenable.prototype.get = function() {
                return shallowCopy({}, this._currentState);
            };
            Tweenable.prototype.set = function(state) {
                this._currentState = state;
            };
            Tweenable.prototype.pause = function() {
                this._pausedAtTime = now();
                this._isPaused = true;
                return this;
            };
            Tweenable.prototype.resume = function() {
                if (this._isPaused) {
                    this._timestamp += now() - this._pausedAtTime;
                }
                this._isPaused = false;
                this._isTweening = true;
                this._timeoutHandler();
                return this;
            };
            Tweenable.prototype.seek = function(millisecond) {
                millisecond = Math.max(millisecond, 0);
                var currentTime = now();
                if (this._timestamp + millisecond === 0) {
                    return this;
                }
                this._timestamp = currentTime - millisecond;
                if (!this.isPlaying()) {
                    this._isTweening = true;
                    this._isPaused = false;
                    timeoutHandler(this, this._timestamp, this._delay, this._duration, this._currentState, this._originalState, this._targetState, this._easing, this._step, this._scheduleFunction, currentTime);
                    this.pause();
                }
                return this;
            };
            Tweenable.prototype.stop = function(gotoEnd) {
                this._isTweening = false;
                this._isPaused = false;
                this._timeoutHandler = noop;
                (window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame || window.mozCancelRequestAnimationFrame || window.clearTimeout)(this._scheduleId);
                if (gotoEnd) {
                    applyFilter(this, "beforeTween");
                    tweenProps(1, this._currentState, this._originalState, this._targetState, 1, 0, this._easing);
                    applyFilter(this, "afterTween");
                    applyFilter(this, "afterTweenEnd");
                    this._finish.call(this, this._currentState, this._attachment);
                }
                return this;
            };
            Tweenable.prototype.isPlaying = function() {
                return this._isTweening && !this._isPaused;
            };
            Tweenable.prototype.setScheduleFunction = function(scheduleFunction) {
                this._scheduleFunction = scheduleFunction;
            };
            Tweenable.prototype.dispose = function() {
                var prop;
                for (prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        delete this[prop];
                    }
                }
            };
            Tweenable.prototype.filter = {};
            Tweenable.prototype.formula = {
                linear: function(pos) {
                    return pos;
                }
            };
            formula = Tweenable.prototype.formula;
            shallowCopy(Tweenable, {
                now: now,
                each: each,
                tweenProps: tweenProps,
                tweenProp: tweenProp,
                applyFilter: applyFilter,
                shallowCopy: shallowCopy,
                defaults: defaults,
                composeEasingObject: composeEasingObject
            });
            if (typeof SHIFTY_DEBUG_NOW === "function") {
                root.timeoutHandler = timeoutHandler;
            }
            root.Tweenable = Tweenable;
            return Tweenable;
        })();
        (function() {
            Tweenable.shallowCopy(Tweenable.prototype.formula, {
                easeInQuad: function(pos) {
                    return Math.pow(pos, 2);
                },
                easeOutQuad: function(pos) {
                    return -(Math.pow(pos - 1, 2) - 1);
                },
                easeInOutQuad: function(pos) {
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * Math.pow(pos, 2);
                    }
                    return -0.5 * ((pos -= 2) * pos - 2);
                },
                easeInCubic: function(pos) {
                    return Math.pow(pos, 3);
                },
                easeOutCubic: function(pos) {
                    return Math.pow(pos - 1, 3) + 1;
                },
                easeInOutCubic: function(pos) {
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * Math.pow(pos, 3);
                    }
                    return 0.5 * (Math.pow(pos - 2, 3) + 2);
                },
                easeInQuart: function(pos) {
                    return Math.pow(pos, 4);
                },
                easeOutQuart: function(pos) {
                    return -(Math.pow(pos - 1, 4) - 1);
                },
                easeInOutQuart: function(pos) {
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * Math.pow(pos, 4);
                    }
                    return -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
                },
                easeInQuint: function(pos) {
                    return Math.pow(pos, 5);
                },
                easeOutQuint: function(pos) {
                    return Math.pow(pos - 1, 5) + 1;
                },
                easeInOutQuint: function(pos) {
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * Math.pow(pos, 5);
                    }
                    return 0.5 * (Math.pow(pos - 2, 5) + 2);
                },
                easeInSine: function(pos) {
                    return -Math.cos(pos * (Math.PI / 2)) + 1;
                },
                easeOutSine: function(pos) {
                    return Math.sin(pos * (Math.PI / 2));
                },
                easeInOutSine: function(pos) {
                    return -0.5 * (Math.cos(Math.PI * pos) - 1);
                },
                easeInExpo: function(pos) {
                    return pos === 0 ? 0 : Math.pow(2, 10 * (pos - 1));
                },
                easeOutExpo: function(pos) {
                    return pos === 1 ? 1 : -Math.pow(2, -10 * pos) + 1;
                },
                easeInOutExpo: function(pos) {
                    if (pos === 0) {
                        return 0;
                    }
                    if (pos === 1) {
                        return 1;
                    }
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * Math.pow(2, 10 * (pos - 1));
                    }
                    return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
                },
                easeInCirc: function(pos) {
                    return -(Math.sqrt(1 - pos * pos) - 1);
                },
                easeOutCirc: function(pos) {
                    return Math.sqrt(1 - Math.pow(pos - 1, 2));
                },
                easeInOutCirc: function(pos) {
                    if ((pos /= 0.5) < 1) {
                        return -0.5 * (Math.sqrt(1 - pos * pos) - 1);
                    }
                    return 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
                },
                easeOutBounce: function(pos) {
                    if (pos < 0.36363636363636365) {
                        return 7.5625 * pos * pos;
                    } else if (pos < 0.7272727272727273) {
                        return 7.5625 * (pos -= 0.5454545454545454) * pos + 0.75;
                    } else if (pos < 0.9090909090909091) {
                        return 7.5625 * (pos -= 0.8181818181818182) * pos + 0.9375;
                    } else {
                        return 7.5625 * (pos -= 0.9545454545454546) * pos + 0.984375;
                    }
                },
                easeInBack: function(pos) {
                    var s = 1.70158;
                    return pos * pos * ((s + 1) * pos - s);
                },
                easeOutBack: function(pos) {
                    var s = 1.70158;
                    return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
                },
                easeInOutBack: function(pos) {
                    var s = 1.70158;
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * (pos * pos * (((s *= 1.525) + 1) * pos - s));
                    }
                    return 0.5 * ((pos -= 2) * pos * (((s *= 1.525) + 1) * pos + s) + 2);
                },
                elastic: function(pos) {
                    return -1 * Math.pow(4, -8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
                },
                swingFromTo: function(pos) {
                    var s = 1.70158;
                    return (pos /= 0.5) < 1 ? 0.5 * (pos * pos * (((s *= 1.525) + 1) * pos - s)) : 0.5 * ((pos -= 2) * pos * (((s *= 1.525) + 1) * pos + s) + 2);
                },
                swingFrom: function(pos) {
                    var s = 1.70158;
                    return pos * pos * ((s + 1) * pos - s);
                },
                swingTo: function(pos) {
                    var s = 1.70158;
                    return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
                },
                bounce: function(pos) {
                    if (pos < 0.36363636363636365) {
                        return 7.5625 * pos * pos;
                    } else if (pos < 0.7272727272727273) {
                        return 7.5625 * (pos -= 0.5454545454545454) * pos + 0.75;
                    } else if (pos < 0.9090909090909091) {
                        return 7.5625 * (pos -= 0.8181818181818182) * pos + 0.9375;
                    } else {
                        return 7.5625 * (pos -= 0.9545454545454546) * pos + 0.984375;
                    }
                },
                bouncePast: function(pos) {
                    if (pos < 0.36363636363636365) {
                        return 7.5625 * pos * pos;
                    } else if (pos < 0.7272727272727273) {
                        return 2 - (7.5625 * (pos -= 0.5454545454545454) * pos + 0.75);
                    } else if (pos < 0.9090909090909091) {
                        return 2 - (7.5625 * (pos -= 0.8181818181818182) * pos + 0.9375);
                    } else {
                        return 2 - (7.5625 * (pos -= 0.9545454545454546) * pos + 0.984375);
                    }
                },
                easeFromTo: function(pos) {
                    if ((pos /= 0.5) < 1) {
                        return 0.5 * Math.pow(pos, 4);
                    }
                    return -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
                },
                easeFrom: function(pos) {
                    return Math.pow(pos, 4);
                },
                easeTo: function(pos) {
                    return Math.pow(pos, 0.25);
                }
            });
        })();
        (function() {
            function cubicBezierAtTime(t, p1x, p1y, p2x, p2y, duration) {
                var ax = 0,
                    bx = 0,
                    cx = 0,
                    ay = 0,
                    by = 0,
                    cy = 0;

                function sampleCurveX(t) {
                    return ((ax * t + bx) * t + cx) * t;
                }
                function sampleCurveY(t) {
                    return ((ay * t + by) * t + cy) * t;
                }
                function sampleCurveDerivativeX(t) {
                    return (3 * ax * t + 2 * bx) * t + cx;
                }
                function solveEpsilon(duration) {
                    return 1 / (200 * duration);
                }
                function solve(x, epsilon) {
                    return sampleCurveY(solveCurveX(x, epsilon));
                }
                function fabs(n) {
                    if (n >= 0) {
                        return n;
                    } else {
                        return 0 - n;
                    }
                }
                function solveCurveX(x, epsilon) {
                    var t0, t1, t2, x2, d2, i;
                    for (t2 = x, i = 0; i < 8; i++) {
                        x2 = sampleCurveX(t2) - x;
                        if (fabs(x2) < epsilon) {
                            return t2;
                        }
                        d2 = sampleCurveDerivativeX(t2);
                        if (fabs(d2) < 0.000001) {
                            break;
                        }
                        t2 = t2 - x2 / d2;
                    }
                    t0 = 0;
                    t1 = 1;
                    t2 = x;
                    if (t2 < t0) {
                        return t0;
                    }
                    if (t2 > t1) {
                        return t1;
                    }
                    while (t0 < t1) {
                        x2 = sampleCurveX(t2);
                        if (fabs(x2 - x) < epsilon) {
                            return t2;
                        }
                        if (x > x2) {
                            t0 = t2;
                        } else {
                            t1 = t2;
                        }
                        t2 = (t1 - t0) * 0.5 + t0;
                    }
                    return t2;
                }
                cx = 3 * p1x;
                bx = 3 * (p2x - p1x) - cx;
                ax = 1 - cx - bx;
                cy = 3 * p1y;
                by = 3 * (p2y - p1y) - cy;
                ay = 1 - cy - by;
                return solve(t, solveEpsilon(duration));
            }
            function getCubicBezierTransition(x1, y1, x2, y2) {
                return function(pos) {
                    return cubicBezierAtTime(pos, x1, y1, x2, y2, 1);
                };
            }
            Tweenable.setBezierFunction = function(name, x1, y1, x2, y2) {
                var cubicBezierTransition = getCubicBezierTransition(x1, y1, x2, y2);
                cubicBezierTransition.displayName = name;
                cubicBezierTransition.x1 = x1;
                cubicBezierTransition.y1 = y1;
                cubicBezierTransition.x2 = x2;
                cubicBezierTransition.y2 = y2;
                return Tweenable.prototype.formula[name] = cubicBezierTransition;
            };
            Tweenable.unsetBezierFunction = function(name) {
                delete Tweenable.prototype.formula[name];
            };
        })();
        (function() {
            function getInterpolatedValues(from, current, targetState, position, easing, delay) {
                return Tweenable.tweenProps(position, current, from, targetState, 1, delay, easing);
            }
            var mockTweenable = new Tweenable;
            mockTweenable._filterArgs = [];
            Tweenable.interpolate = function(from, targetState, position, easing, opt_delay) {
                var current = Tweenable.shallowCopy({}, from);
                var delay = opt_delay || 0;
                var easingObject = Tweenable.composeEasingObject(from, easing || "linear");
                mockTweenable.set({});
                var filterArgs = mockTweenable._filterArgs;
                filterArgs.length = 0;
                filterArgs[0] = current;
                filterArgs[1] = from;
                filterArgs[2] = targetState;
                filterArgs[3] = easingObject;
                Tweenable.applyFilter(mockTweenable, "tweenCreated");
                Tweenable.applyFilter(mockTweenable, "beforeTween");
                var interpolatedValues = getInterpolatedValues(from, current, targetState, position, easingObject, delay);
                Tweenable.applyFilter(mockTweenable, "afterTween");
                return interpolatedValues;
            };
        })();
        (function(Tweenable) {
            var formatManifest;
            var R_NUMBER_COMPONENT = /(\d|\-|\.)/;
            var R_FORMAT_CHUNKS = /([^\-0-9\.]+)/g;
            var R_UNFORMATTED_VALUES = /[0-9.\-]+/g;
            var R_RGB = new RegExp("rgb\\(" + R_UNFORMATTED_VALUES.source + /,\s*/.source + R_UNFORMATTED_VALUES.source + /,\s*/.source + R_UNFORMATTED_VALUES.source + "\\)", "g");
            var R_RGB_PREFIX = /^.*\(/;
            var R_HEX = /#([0-9]|[a-f]){3,6}/gi;
            var VALUE_PLACEHOLDER = "VAL";

            function getFormatChunksFrom(rawValues, prefix) {
                var accumulator = [];
                var rawValuesLength = rawValues.length;
                var i;
                for (i = 0; i < rawValuesLength; i++) {
                    accumulator.push("_" + prefix + "_" + i);
                }
                return accumulator;
            }
            function getFormatStringFrom(formattedString) {
                var chunks = formattedString.match(R_FORMAT_CHUNKS);
                if (!chunks) {
                    chunks = ["", ""];
                } else if (chunks.length === 1 || formattedString.charAt(0).match(R_NUMBER_COMPONENT)) {
                    chunks.unshift("");
                }
                return chunks.join(VALUE_PLACEHOLDER);
            }
            function sanitizeObjectForHexProps(stateObject) {
                Tweenable.each(stateObject, function(prop) {
                    var currentProp = stateObject[prop];
                    if (typeof currentProp === "string" && currentProp.match(R_HEX)) {
                        stateObject[prop] = sanitizeHexChunksToRGB(currentProp);
                    }
                });
            }
            function sanitizeHexChunksToRGB(str) {
                return filterStringChunks(R_HEX, str, convertHexToRGB);
            }
            function convertHexToRGB(hexString) {
                var rgbArr = hexToRGBArray(hexString);
                return "rgb(" + rgbArr[0] + "," + rgbArr[1] + "," + rgbArr[2] + ")";
            }
            var hexToRGBArray_returnArray = [];

            function hexToRGBArray(hex) {
                hex = hex.replace(/#/, "");
                if (hex.length === 3) {
                    hex = hex.split("");
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }
                hexToRGBArray_returnArray[0] = hexToDec(hex.substr(0, 2));
                hexToRGBArray_returnArray[1] = hexToDec(hex.substr(2, 2));
                hexToRGBArray_returnArray[2] = hexToDec(hex.substr(4, 2));
                return hexToRGBArray_returnArray;
            }
            function hexToDec(hex) {
                return parseInt(hex, 16);
            }
            function filterStringChunks(pattern, unfilteredString, filter) {
                var pattenMatches = unfilteredString.match(pattern);
                var filteredString = unfilteredString.replace(pattern, VALUE_PLACEHOLDER);
                if (pattenMatches) {
                    var pattenMatchesLength = pattenMatches.length;
                    var currentChunk;
                    for (var i = 0; i < pattenMatchesLength; i++) {
                        currentChunk = pattenMatches.shift();
                        filteredString = filteredString.replace(VALUE_PLACEHOLDER, filter(currentChunk));
                    }
                }
                return filteredString;
            }
            function sanitizeRGBChunks(formattedString) {
                return filterStringChunks(R_RGB, formattedString, sanitizeRGBChunk);
            }
            function sanitizeRGBChunk(rgbChunk) {
                var numbers = rgbChunk.match(R_UNFORMATTED_VALUES);
                var numbersLength = numbers.length;
                var sanitizedString = rgbChunk.match(R_RGB_PREFIX)[0];
                for (var i = 0; i < numbersLength; i++) {
                    sanitizedString += parseInt(numbers[i], 10) + ",";
                }
                sanitizedString = sanitizedString.slice(0, -1) + ")";
                return sanitizedString;
            }
            function getFormatManifests(stateObject) {
                var manifestAccumulator = {};
                Tweenable.each(stateObject, function(prop) {
                    var currentProp = stateObject[prop];
                    if (typeof currentProp === "string") {
                        var rawValues = getValuesFrom(currentProp);
                        manifestAccumulator[prop] = {
                            formatString: getFormatStringFrom(currentProp),
                            chunkNames: getFormatChunksFrom(rawValues, prop)
                        };
                    }
                });
                return manifestAccumulator;
            }
            function expandFormattedProperties(stateObject, formatManifests) {
                Tweenable.each(formatManifests, function(prop) {
                    var currentProp = stateObject[prop];
                    var rawValues = getValuesFrom(currentProp);
                    var rawValuesLength = rawValues.length;
                    for (var i = 0; i < rawValuesLength; i++) {
                        stateObject[formatManifests[prop].chunkNames[i]] = +rawValues[i];
                    }
                    delete stateObject[prop];
                });
            }
            function collapseFormattedProperties(stateObject, formatManifests) {
                Tweenable.each(formatManifests, function(prop) {
                    var currentProp = stateObject[prop];
                    var formatChunks = extractPropertyChunks(stateObject, formatManifests[prop].chunkNames);
                    var valuesList = getValuesList(formatChunks, formatManifests[prop].chunkNames);
                    currentProp = getFormattedValues(formatManifests[prop].formatString, valuesList);
                    stateObject[prop] = sanitizeRGBChunks(currentProp);
                });
            }
            function extractPropertyChunks(stateObject, chunkNames) {
                var extractedValues = {};
                var currentChunkName, chunkNamesLength = chunkNames.length;
                for (var i = 0; i < chunkNamesLength; i++) {
                    currentChunkName = chunkNames[i];
                    extractedValues[currentChunkName] = stateObject[currentChunkName];
                    delete stateObject[currentChunkName];
                }
                return extractedValues;
            }
            var getValuesList_accumulator = [];

            function getValuesList(stateObject, chunkNames) {
                getValuesList_accumulator.length = 0;
                var chunkNamesLength = chunkNames.length;
                for (var i = 0; i < chunkNamesLength; i++) {
                    getValuesList_accumulator.push(stateObject[chunkNames[i]]);
                }
                return getValuesList_accumulator;
            }
            function getFormattedValues(formatString, rawValues) {
                var formattedValueString = formatString;
                var rawValuesLength = rawValues.length;
                for (var i = 0; i < rawValuesLength; i++) {
                    formattedValueString = formattedValueString.replace(VALUE_PLACEHOLDER, +rawValues[i].toFixed(4));
                }
                return formattedValueString;
            }
            function getValuesFrom(formattedString) {
                return formattedString.match(R_UNFORMATTED_VALUES);
            }
            function expandEasingObject(easingObject, tokenData) {
                Tweenable.each(tokenData, function(prop) {
                    var currentProp = tokenData[prop];
                    var chunkNames = currentProp.chunkNames;
                    var chunkLength = chunkNames.length;
                    var easing = easingObject[prop];
                    var i;
                    if (typeof easing === "string") {
                        var easingChunks = easing.split(" ");
                        var lastEasingChunk = easingChunks[easingChunks.length - 1];
                        for (i = 0; i < chunkLength; i++) {
                            easingObject[chunkNames[i]] = easingChunks[i] || lastEasingChunk;
                        }
                    } else {
                        for (i = 0; i < chunkLength; i++) {
                            easingObject[chunkNames[i]] = easing;
                        }
                    }
                    delete easingObject[prop];
                });
            }
            function collapseEasingObject(easingObject, tokenData) {
                Tweenable.each(tokenData, function(prop) {
                    var currentProp = tokenData[prop];
                    var chunkNames = currentProp.chunkNames;
                    var chunkLength = chunkNames.length;
                    var firstEasing = easingObject[chunkNames[0]];
                    var typeofEasings = typeof firstEasing;
                    if (typeofEasings === "string") {
                        var composedEasingString = "";
                        for (var i = 0; i < chunkLength; i++) {
                            composedEasingString += " " + easingObject[chunkNames[i]];
                            delete easingObject[chunkNames[i]];
                        }
                        easingObject[prop] = composedEasingString.substr(1);
                    } else {
                        easingObject[prop] = firstEasing;
                    }
                });
            }
            Tweenable.prototype.filter.token = {
                tweenCreated: function(currentState, fromState, toState, easingObject) {
                    sanitizeObjectForHexProps(currentState);
                    sanitizeObjectForHexProps(fromState);
                    sanitizeObjectForHexProps(toState);
                    this._tokenData = getFormatManifests(currentState);
                },
                beforeTween: function(currentState, fromState, toState, easingObject) {
                    expandEasingObject(easingObject, this._tokenData);
                    expandFormattedProperties(currentState, this._tokenData);
                    expandFormattedProperties(fromState, this._tokenData);
                    expandFormattedProperties(toState, this._tokenData);
                },
                afterTween: function(currentState, fromState, toState, easingObject) {
                    collapseFormattedProperties(currentState, this._tokenData);
                    collapseFormattedProperties(fromState, this._tokenData);
                    collapseFormattedProperties(toState, this._tokenData);
                    collapseEasingObject(easingObject, this._tokenData);
                }
            };
        })(Tweenable);
    }).call(null);
    (function() {
        (function(funcName, baseObj) {
            funcName = funcName || "docReady";
            baseObj = baseObj || window;
            var readyList = [];
            var readyFired = false;
            var readyEventHandlersInstalled = false;

            function ready() {
                if (!readyFired) {
                    readyFired = true;
                    for (var i = 0; i < readyList.length; i++) {
                        readyList[i].fn.call(window, readyList[i].ctx);
                    }
                    readyList = [];
                }
            }
            function readyStateChange() {
                if (document.readyState === "complete") {
                    ready();
                }
            }
            baseObj[funcName] = function(callback, context) {
                if (readyFired) {
                    setTimeout(function() {
                        callback(context);
                    }, 1);
                    return;
                } else {
                    readyList.push({
                        fn: callback,
                        ctx: context
                    });
                }
                if (document.readyState === "complete" || !document.attachEvent && document.readyState === "interactive") {
                    setTimeout(ready, 1);
                } else if (!readyEventHandlersInstalled) {
                    if (document.addEventListener) {
                        document.addEventListener("DOMContentLoaded", ready, false);
                        window.addEventListener("load", ready, false);
                    } else {
                        document.attachEvent("onreadystatechange", readyStateChange);
                        window.attachEvent("onload", ready);
                    }
                    readyEventHandlersInstalled = true;
                }
            };
        })("docReady", dependencies);
        (function(console, Object, Array) {
            if (typeof console === "undefined" || typeof console.log === "undefined") {
                console = {};
                console.log = function() {};
            }
            if (typeof Object.create !== "function") {
                Object.create = function(o) {
                    function F() {}
                    F.prototype = o;
                    return new F;
                };
            }
            if (!Array.prototype.forEach) {
                Array.prototype.forEach = function(fn, scope) {
                    for (var i = 0, len = this.length; i < len; ++i) {
                        fn.call(scope, this[i], i, this);
                    }
                };
            }
        })(window.console, window.Object, window.Array);
    })();
    var helper = (function() {
        function delete_element(e) {
            e.parentNode.removeChild(e);
        }
        function clear_sets(arr) {
            for (var i = 0; i < arr.length; i++) {
                var set = arr[i];
                set.forEach(function(e) {
                    e.remove();
                });
                set.splice(0, set.length);
            }
        }
        function replaceAll(str, find, replace) {
            return str.replace(new RegExp(find, "g"), replace);
        }
        function to_float(str) {
            var num = parseFloat(str);
            if (isNaN(num)) {
                return false;
            } else {
                return num;
            }
        }
        function addEvent(obj, type, fn) {
            if (obj.attachEvent) {
                obj["e" + type + fn] = fn;
                obj[type + fn] = function() {
                    obj["e" + type + fn](window.event);
                };
                obj.attachEvent("on" + type, obj[type + fn]);
            } else {
                obj.addEventListener(type, fn, false);
            }
        }
        function linePath(startX, startY, endX, endY) {
            var start = {
                x: startX,
                y: startY
            };
            var end = {
                x: endX,
                y: endY
            };
            return "M" + start.x + " " + start.y + " L" + end.x + " " + end.y;
        }
        function clone(srcInstance) {
            if (typeof srcInstance != "object" || srcInstance === null) {
                return srcInstance;
            }
            var newInstance = srcInstance.constructor();
            for (var i in srcInstance) {
                newInstance[i] = clone(srcInstance[i]);
            }
            return newInstance;
        }
        var isMobile = {
            Android: function() {
                return navigator.userAgent.match(/Android/i);
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i);
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i);
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera\sMini/i);
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i);
            },
            any: function() {
                return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows();
            }
        };

        function isFunction(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === "[object Function]";
        }
        function findPos(obj) {
            function getStyle(obj, styleProp) {
                if (obj.currentStyle) {
                    var y = obj.currentStyle[styleProp];
                } else if (window.getComputedStyle) {
                    var y = window.getComputedStyle(obj, null)[styleProp];
                }
                return y;
            }
            function scrollDist() {
                var html = document.getElementsByTagName("html")[0];
                if (html.scrollTop && document.documentElement.scrollTop) {
                    return [html.scrollLeft, html.scrollTop];
                } else if (html.scrollTop || document.documentElement.scrollTop) {
                    return [html.scrollLeft + document.documentElement.scrollLeft, html.scrollTop + document.documentElement.scrollTop];
                } else if (document.body.scrollTop) {
                    return [document.body.scrollLeft, document.body.scrollTop];
                }
                return [0, 0];
            }
            var body_position = getStyle(document.body, "position");
            if (body_position == "relative") {
                document.body.style.position = "static";
            }
            var current = getStyle(document.body, "position");
            var curtop;
            var curleft = curtop = 0,
                scr = obj,
                fixed = false;
            while ((scr = scr.parentNode) && scr != document.body) {
                curleft -= scr.scrollLeft || 0;
                curtop -= scr.scrollTop || 0;
                if (getStyle(scr, "position") == "fixed") {
                    fixed = true;
                }
            }
            if (fixed && !window.opera) {
                var scrDist = scrollDist();
                curleft += scrDist[0];
                curtop += scrDist[1];
            }
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
            document.body.style.position = body_position;
            return [curleft, curtop];
        }
        function distance(xy0, xy1) {
            var x0 = xy0.x;
            var y0 = xy0.y;
            var x1 = xy1.x;
            var y1 = xy1.y;
            var dx = x1 - x0;
            var dy = y1 - y0;
            return Math.sqrt(dy * dy + dx * dx);
        }
        function rotate(point, transform) {
            var x = point[0];
            var y = point[1];
            var str = Raphael.transformPath("M" + x + "," + y, transform).toString();
            var re = /M(-?\d+.?\d*),(-?\d+.?\d*)/;
            var m = re.exec(str);
            return [m[1], m[2]];
        }
        function bbox_union(arr) {
            var xa = [];
            var x2a = [];
            var y2a = [];
            var ya = [];
            for (var i = 0; i < arr.length; i++) {
                var bb = arr[i];
                xa.push(bb.x);
                x2a.push(bb.x2);
                ya.push(bb.y);
                y2a.push(bb.y2);
            }
            var x = helper.min(xa);
            var x2 = helper.max(x2a);
            var y = helper.min(ya);
            var y2 = helper.max(y2a);
            return {
                x: x,
                x2: x2,
                y: y,
                y2: y2,
                width: x2 - x,
                height: y2 - y
            };
        }
        function min(array) {
            return Math.min.apply(Math, array);
        }
        function max(array) {
            return Math.max.apply(Math, array);
        }
        function rotate_bbox(bbox, transform) {
            var a = [bbox.x, bbox.y];
            var b = [bbox.x2, bbox.y];
            var c = [bbox.x, bbox.y2];
            var d = [bbox.x2, bbox.y2];
            var a2 = rotate(a, transform);
            var b2 = rotate(b, transform);
            var c2 = rotate(c, transform);
            var d2 = rotate(d, transform);
            var x_array = [a2[0], b2[0], c2[0], d2[0]];
            var y_array = [a2[1], b2[1], c2[1], d2[1]];
            var x_min = min(x_array);
            var x_max = max(x_array);
            var y_min = min(y_array);
            var y_max = max(y_array);
            return {
                x: x_min,
                y: y_min,
                x2: x_max,
                y2: y_max,
                width: x_max - x_min,
                height: y_max - y_min
            };
        }
        function x_in_array(x, a) {
            var i = a.length;
            while (i--) {
                if (a[i] === x) {
                    return true;
                }
            }
            return false;
        }
        return {
            min: min,
            max: max,
            addEvent: addEvent,
            isMobile: isMobile,
            linePath: linePath,
            clone: clone,
            isFunction: isFunction,
            findPos: findPos,
            replaceAll: replaceAll,
            rotate_bbox: rotate_bbox,
            rotate: rotate,
            bbox_union: bbox_union,
            distance: distance,
            x_in_array: x_in_array,
            clear_sets: clear_sets,
            delete_element: delete_element,
            to_float: to_float
        };
    })();
    var mapdata = window[plugin_name + "_mapdata"] ? window[plugin_name + "_mapdata"] : false;
    var mapinfo = window[plugin_name + "_mapinfo"] ? window[plugin_name + "_mapinfo"] : false;
    var mapname = plugin_name.substring(0, plugin_name.length - 3).replace("simplemaps_", "");
    var demo = true;
    var branded = false;
    var autoload_array = [];
    var shared_paths = {
        rounded_box: "m2.158.263h5.684c1.05 0 1.895.845 1.895 1.895v5.684c0 1.05-.845 1.895-1.895 1.895h-5.684c-1.05 0-1.895-.845-1.895-1.895v-5.684c0-1.05.845-1.895 1.895-1.895z",
        plus: "m4.8 1.5c-.111 0-.2.089-.2.2v3h-2.9c-.111 0-.2.134-.2.3 0 .166.089.3.2.3h2.9v3c0 .111.089.2.2.2h.2c.111 0 .2-.089.2-.2v-3h3.1c.111 0 .2-.134.2-.3 0-.166-.089-.3-.2-.3h-3.1v-3c0-.111-.089-.2-.2-.2z",
        minus: "m1.8 4.7h6.6c.111 0 .2.134.2.3 0 .166-.089.3-.2.3h-6.6c-.111 0-.2-.134-.2-.3 0-.166.089-.3.2-.3",
        arrow: "m7.07 8.721c2.874-1.335 2.01-5.762-2.35-5.661v-1.778l-3.445 2.694 3.445 2.843v-1.818c3.638-.076 3.472 2.802 2.35 3.721z"
    };
    var hooks_object = {
        over_state: false,
        over_region: false,
        over_location: false,
        out_state: false,
        out_region: false,
        out_location: false,
        click_state: false,
        click_region: false,
        click_location: false,
        close_popup: false,
        zoomable_click_state: false,
        zoomable_click_region: false,
        complete: false,
        refresh_complete: false,
        zooming_complete: false,
        back: false,
        ready: false,
        click_xy: false
    };
    var plugin_hooks = {
        over_state: [],
        over_region: [],
        over_location: [],
        out_state: [],
        out_region: [],
        out_location: [],
        click_state: [],
        click_region: [],
        click_location: [],
        preclick_state: [],
        preclick_region: [],
        preclick_location: [],
        close_popup: [],
        zoomable_click_state: [],
        zoomable_click_region: [],
        complete: [],
        refresh_complete: [],
        zooming_complete: [],
        back: [],
        ready: [],
        click_xy: []
    };
    var api_object = {
        mapdata: mapdata,
        mapinfo: mapinfo,
        load: load,
        hooks: helper.clone(hooks_object),
        plugin_hooks: helper.clone(plugin_hooks),
        copy: function() {
            var new_plugin = {
                mapdata: helper.clone(this.mapdata),
                mapinfo: helper.clone(this.mapinfo),
                hooks: helper.clone(this.hooks),
                plugin_hooks: helper.clone(this.plugin_hooks),
                copy: this.copy,
                load: load
            };
            autoload_array.push(new_plugin);
            return new_plugin;
        },
        create: function() {
            var new_plugin = {
                mapdata: window[plugin_name + "_mapdata"] ? helper.clone(window[plugin_name + "_mapdata"]) : false,
                mapinfo: window[plugin_name + "_mapinfo"] ? helper.clone(window[plugin_name + "_mapinfo"]) : false,
                hooks: helper.clone(this.hooks),
                plugin_hooks: helper.clone(this.plugin_hooks),
                copy: this.copy,
                load: load
            };
            autoload_array.push(new_plugin);
            return new_plugin;
        },
        mobile_device: helper.isMobile.any() ? true : false,
        loaded: false
    };

    function trigger_hook(name, args) {
        var hooks_object = api_object.hooks;
        var fn = hooks_object[name];
        if (fn) {
            fn.apply(null, args);
        }
        var plugin_hooks = api_object.plugin_hooks;
        var plugin_array = plugin_hooks[name];
        for (var i = 0; i < plugin_array.length; i++) {
            var fn = plugin_array[i];
            if (fn) {
                fn.apply(null, args);
            }
        }
    }
    function load() {
        var api_object = this;
        var mapdata = api_object.mapdata;
        var mapinfo = api_object.mapinfo;
        if (!mapdata || !mapinfo) {
            console.log("The mapdata or mapinfo object is missing or corrupted.");
            return;
        }
        var hooks_object = api_object.hooks;
        var plugin_hooks = api_object.plugin_hooks;

        function trigger_hook(name, args) {
            var fn = hooks_object[name];
            if (fn) {
                fn.apply(null, args);
            }
            var plugin_hooks = api_object.plugin_hooks;
            var plugin_array = plugin_hooks[name];
            for (var i = 0; i < plugin_array.length; i++) {
                var fn = plugin_array[i];
                if (fn) {
                    fn.apply(null, args);
                }
            }
        }
        var div = mapdata.main_settings.div === undefined ? "map" : mapdata.main_settings.div;
        if (!document.getElementById(div)) {
            console.log("Can't find target for map #" + div + ".  Check mapdata.main_settings.div");
            return false;
        }
        var back_image_url, images_directory, directory, state_specific, main_settings, normalizing_factor;

        function preload() {
            state_specific = mapdata.state_specific;
            main_settings = mapdata.main_settings;
            var scripts = document.getElementsByTagName("script");
            var mysrc = scripts[scripts.length - 1].src;
            var back_image = main_settings.back_image != "no" ? main_settings.back_image : false;
            back_image_url = main_settings.back_image_url != "no" ? main_settings.back_image_url : false;
            images_directory = main_settings.images_directory != "default" ? main_settings.images_directory : false;
            directory = images_directory ? images_directory : mysrc.substring(0, mysrc.lastIndexOf("/countrymap.js") + 1) + "map_images/";
            if (!back_image_url && back_image) {
                back_image_url = directory + back_image;
            }
        }
        var ignore_pos, fly_in, rotate, manual_zoom, responsive, div, initial_zoom, initial_zoom_solo, tooltip_manual, last_clicked, tooltip_up, regions;

        function get_map_info() {
            div = main_settings.div === undefined ? "map" : main_settings.div;
            initial_zoom = main_settings.initial_zoom === undefined ? -1 : main_settings.initial_zoom;
            initial_zoom_solo = main_settings.initial_zoom_solo == "yes" && initial_zoom != -1 ? true : false;
            fly_in = main_settings.fly_in_from === undefined || main_settings.fly_in_from == "no" ? false : main_settings.fly_in_from;
            responsive = main_settings.width == "responsive" ? true : false;
            rotate = main_settings.rotate ? main_settings.rotate : false;
            if (rotate == "0") {
                rotate = false;
            }
            zooming_on = main_settings.zoom == "no" ? false : true;
            manual_zoom = main_settings.manual_zoom == "yes" ? true : false;
            regions = mapinfo.default_regions && zooming_on ? mapinfo.default_regions : false;
            if (mapdata.regions) {
                regions = mapdata.regions;
            }
            if (mapdata.labels) {
                labels = mapdata.labels;
            }
            tooltip_manual = false;
            last_clicked = false;
            last_over = false;
            tooltip_up = false;
            ignore_pos = false;
        }
        var background_image_url, background_image_bbox, zoom_time, zoom_mobile, zoom_increment, custom_shapes, popup_centered, popup_orientation, order_number, zoom_percentage, initial_back, link_text, zooming_on, fade_time, hide_eastern_labels, labels, ignore_default_labels;
        var adjacent_opacity;
        var opacity;
        var incremental;
        var label_size;
        var label_color;
        var label_opacity;
        var new_tab;
        var default_location_opacity;
        var hooks;
        var border_size;
        var popup_color;
        var popup_maxwidth;
        var popup_opacity;
        var popup_shadow;
        var popup_corners;
        var popup_nocss;
        var popup_font;

        function get_refreshable_info() {
            background_image_url = main_settings.background_image_url && main_settings.background_image_url != "no" ? main_settings.background_image_url : false;
            background_image_bbox = main_settings.background_image_bbox ? main_settings.background_image_bbox : false;
            opacity = main_settings.background_transparent == "yes" ? 0 : 1;
            label_size = main_settings.label_size ? main_settings.label_size : 22;
            label_color = main_settings.label_color ? main_settings.label_color : "#ffffff";
            new_tab = main_settings.url_new_tab == "yes" ? true : false;
            default_location_opacity = main_settings.location_opacity ? main_settings.location_opacity : 1;
            hooks = main_settings.js_hooks == "yes" ? true : false;
            border_size = main_settings.border_size ? main_settings.border_size : 1.5;
            popup_color = main_settings.popup_color ? main_settings.popup_color : "#ffffff";
            popup_orientation = main_settings.popup_orientation ? main_settings.popup_orientation : "auto";
            popup_centered = main_settings.popup_centered ? main_settings.popup_centered : "auto";
            popup_opacity = main_settings.popup_opacity ? main_settings.popup_opacity : 0.9;
            popup_shadow = main_settings.popup_shadow > -1 ? main_settings.popup_shadow : 1;
            popup_corners = main_settings.popup_corners ? main_settings.popup_corners : 5;
            popup_nocss = main_settings.popup_nocss == "yes" ? true : false;
            popup_maxwidth = main_settings.popup_maxwidth ? main_settings.popup_maxwidth : false;
            popup_font = main_settings.popup_font ? main_settings.popup_font : "12px/1.5 Verdana, Arial, Helvetica, sans-serif";
            incremental = main_settings.zoom_out_incrementally == "no" ? false : true;
            adjacent_opacity = main_settings.adjacent_opacity ? main_settings.adjacent_opacity : 0.3;
            zoom_time = main_settings.zoom_time ? main_settings.zoom_time : 0.5;
            zoom_increment = main_settings.zoom_increment ? main_settings.zoom_increment : 2;
            zoom_mobile = main_settings.zoom_mobile == "no" ? false : true;
            fade_time = main_settings.fade_time ? main_settings.fade_time * 1000 : 200;
            labels = mapdata.labels;
            custom_shapes = main_settings.custom_shapes ? main_settings.custom_shapes : {};
            initial_back = main_settings.initial_back && main_settings.initial_back != "no" ? main_settings.initial_back : false;
            hide_eastern_labels = main_settings.hide_eastern_labels == "yes" ? true : false;
            link_text = main_settings.link_text ? main_settings.link_text : "View Website";
            order_number = main_settings.order_number ? main_settings.order_number : false;
            zoom_percentage = main_settings.zoom_percentage ? main_settings.zoom_percentage : 0.99;
        }
        function is_onclick(popups) {
            if (popups == "on_click") {
                return true;
            } else if (popups == "detect" && touch) {
                return true;
            } else {
                return false;
            }
        }
        function is_off(popups) {
            if (popups == "off") {
                return true;
            } else {
                return false;
            }
        }
        var vml;
        var tough;
        var ie;
        var ios;
        var on_click;
        var popup_off = false;
        var reload = false;
        var touch;
        var popups;

        function get_client_info() {
            vml = Raphael.type == "VML" ? true : false;
            ie = document.all ? true : false;
            ios = helper.isMobile.iOS() ? true : false;
            touch = helper.isMobile.any() ? true : false;
            popups = main_settings.pop_ups ? main_settings.pop_ups : main_settings.popups;
            on_click = false;
            popup_off = is_off(popups);
        }
        var map_outer;
        var map_inner;
        var mapdiv;
        var map_holder;
        var map_zoom;

        function create_dom_structure() {
            mapdiv = document.getElementById(div);
            map_holder = document.getElementById(div + "_holder") ? document.getElementById(div + "_holder") : false;
            if (map_holder) {
                mapdiv.removeChild(map_holder);
                var tt_to_del = document.getElementById("tt_sm_" + div);
                if (tt_to_del) {
                    tt_to_del.parentNode.removeChild(tt_to_del);
                }
            }
            map_holder = document.createElement("div");
            map_outer = document.createElement("div");
            map_zoom = document.createElement("div");
            map_inner = document.createElement("div");
            map_outer.id = div + "_outer";
            map_zoom.id = div + "_zoom";
            map_inner.id = div + "_inner";
            map_holder.id = div + "_holder";
            map_holder.style.position = "relative";
            map_inner.style.position = "relative";
            map_outer.style.position = "absolute";
            map_zoom.style.position = "absolute";
            map_zoom.style.zIndex = "1";
            map_outer.style.zIndex = "1";
            mapdiv.appendChild(map_holder);
            map_holder.appendChild(map_zoom);
            map_holder.appendChild(map_outer);
            map_holder.appendChild(map_inner);
        }
        var transform_rotate;
        var width;
        var height;
        var scale;
        var original_width;
        var original_height;
        var initial_view;
        var normalizing_factor;
        var ratio;
        var width_to_height;

        function create_dimensions(resizing) {
            mapdiv.style.width = "";
            map_holder.style.width = "";
            if (responsive) {
                width = mapdiv.offsetWidth;
                if (width < 1) {
                    width = mapdiv.parentNode.offsetWidth;
                }
                map_holder.style.width = width + "px";
            } else {
                width = main_settings.width === undefined ? 800 : main_settings.width;
                mapdiv.style.width = width + "px";
            }
            width = width * 1;
            if (mapinfo.calibrate) {
                initial_view = {};
                initial_view.x = -1 * mapinfo.calibrate.x_adjust;
                initial_view.y = -1 * mapinfo.calibrate.y_adjust;
                initial_view.x2 = initial_view.x + mapinfo.calibrate.width;
                initial_view.y2 = (initial_view.x2 - initial_view.x) / mapinfo.calibrate.ratio;
            } else {
                initial_view = mapinfo.initial_view;
            }
            original_width = initial_view.x2 - initial_view.x;
            original_height = initial_view.y2 - initial_view.y;
            width_to_height = original_width / original_height;
            height = width / width_to_height;
            normalizing_factor = original_width / 1000;
            if (!resizing) {
                scale = width / original_width;
                ratio = 1;
                if (rotate) {
                    var bbox_array = [];
                    for (var i in mapinfo.state_bbox_array) {
                        var bb = mapinfo.state_bbox_array[i];
                        bbox_array.push(bb);
                    }
                    var path_bbox = helper.bbox_union(bbox_array);
                    var center_x = 0.5 * (path_bbox.x2 + path_bbox.x) * scale;
                    var center_y = 0.5 * (path_bbox.y2 + path_bbox.y) * scale;
                    transform_rotate = "r" + rotate + "," + center_x + "," + center_y;
                    var riv = helper.rotate_bbox(initial_view, transform_rotate);
                    original_width = riv.width;
                    original_height = riv.height;
                }
                transform_scale = "s" + scale + "," + scale + ",0,0";
                transform = rotate ? transform_scale + transform_rotate : transform_scale;
            }
        }
        var paper;
        var everything;
        var all_lines;
        var all_visible_states;
        var location_labels;
        var all_external_lines;
        var all_visible_labels;
        var transform;
        var transform_scale;
        var background;
        var background_color;
        var background_image;
        var all_pills;
        var all_states;
        var all_regions;
        var all_locations;
        var top_locations;
        var bottom_locations;
        var all_labels;

        function create_canvas() {
            paper = Raphael(map_inner, width, height);
            background = paper.set();
            background_color = paper.rect(initial_view.x - original_width * 2, initial_view.y - original_height * 2, original_width * 5, original_height * 5);
            if (background_image_url) {
                var image_bbox = background_image_bbox ? background_image_bbox : initial_view;
                background_image = paper.image(background_image_url, image_bbox.x, image_bbox.y, image_bbox.x2 - image_bbox.x, image_bbox.y2 - image_bbox.y);
                background.push(background_image);
            }
            background.push(background_color);
            background.transform(transform_scale);
            background.hide();
            all_states = paper.set();
            all_visible_states = paper.set();
            all_regions = paper.set();
            all_locations = paper.set();
            top_locations = paper.set();
            bottom_locations = paper.set();
            all_labels = paper.set();
            location_labels = paper.set();
            all_visible_labels = paper.set();
            all_external_lines = paper.set();
            all_pills = paper.set();
            all_lines = paper.set();
            everything = paper.set();
            everything.push(all_states, all_locations, background, all_labels, all_external_lines);
        }
        var trial_paper;
        var map_trial = false;

        function create_trial_text() {
            if (!demo) {
                return;
            }
            if (location.hostname.match("simplemaps.com")) {
                demo = false;
                return;
            }
            if (map_trial) {
                var parent = map_trial.parentNode;
                parent.removeChild(map_trial);
                map_trial = false;
            }
            map_trial = document.createElement("div");
            map_trial.style.cssText = "display:inline !important";
            map_trial.style.position = "absolute";
            if (branded) {
                var h = 20;
                var w = 140;
            } else {
                var h = 30;
                var w = 200;
            }
            map_trial.style.left = width - w + "px";
            map_trial.style.top = height - h + "px";
            map_trial.style.zIndex = "1";
            map_inner.appendChild(map_trial);
            trial_paper = Raphael(map_trial, w, h);
            if (branded) {
                var text = trial_paper.text(w - 5, h * 0.5, "Simplemaps.com");
                text.attr({
                    'text-anchor': "end",
                    'font-size': 14,
                    'font-weight': "bold",
                    cursor: "pointer",
                    'font-family': "arial,sans-serif",
                    title: "Built with SimpleMaps"
                });
            } else {
                var text = trial_paper.text(w - 5, h * 0.5, "Simplemaps.com Trial");
                text.attr({
                    'text-anchor': "end",
                    'font-size': 18,
                    'font-weight': "bold",
                    cursor: "pointer",
                    'font-family': "arial,sans-serif"
                });
            }
            text.node.setAttribute("href", "http://simplemaps.com");
            text.click(function() {
                window.location.href = "http://simplemaps.com";
            });
        }
        var paper_back;
        var back_arrow;
        var zoom_in;
        var zoom_out;
        var zoom_back;
        var zoom_about;
        var zoom_in_click;
        var zoom_out_click;

        function create_nav_buttons() {
            var navigation_color = main_settings.navigation_color ? main_settings.navigation_color : "#f7f7f7";
            var navigation_border_color = main_settings.navigation_border_color ? main_settings.navigation_border_color : "#636363";
            var navigation_opacity = main_settings.navigation_opacity ? main_settings.navigation_opacity : 0.8;
            var arrow_color = main_settings.arrow_color ? main_settings.arrow_color : navigation_color;
            var legacy = main_settings.arrow_color_border ? main_settings.arrow_color_border : navigation_border_color;
            var arrow_border_color = main_settings.arrow_border_color ? main_settings.arrow_border_color : legacy;
            var navw = main_settings.navigation_size === undefined ? 40 : main_settings.navigation_size;
            var arrow_border_opacity = main_settings.arrow_box == "yes" ? 1 : 0;
            navw = navw * 1;
            var back_height = navw;
            var m = navw * 0.1;
            var s = navw / 10;
            var image_w, image_h;
            create_arrow();

            function create_arrow() {
                back_arrow = paper.set();
                var w = navw;
                var h = navw;
                if (back_image_url) {
                    var img = new Image;
                    img.onload = function() {
                        image_w = img.width;
                        image_h = img.height;
                        make_arrow();
                    };
                    img.src = back_image_url;
                } else {
                    make_arrow();
                }
                function make_arrow() {
                    if (back_image_url) {
                        paper_back = Raphael(map_outer, image_w, image_h);
                        var back_arrow_arrow = paper_back.image(back_image_url, 0, 0, image_w, image_h);
                        back_height = image_h;
                        back_arrow_arrow.attr({
                            cursor: "pointer"
                        });
                        back_arrow.push(back_arrow_arrow);
                        back_arrow.click(back_click_handler);
                    } else {
                        paper_back = Raphael(map_outer, w, h);
                        var fill_opacity = 1;
                        var arrow_box = paper_back.path(shared_paths.rounded_box).attr({
                            fill: arrow_color,
                            'stroke-width': 1,
                            stroke: arrow_border_color,
                            'stroke-opacity': arrow_border_opacity,
                            'fill-opacity': 0,
                            cursor: "pointer"
                        });
                        var arrow_attrs = {
                            stroke: arrow_border_color,
                            'stroke-width': 1.5,
                            'stroke-opacity': 1,
                            fill: arrow_color,
                            'fill-opacity': fill_opacity,
                            cursor: "pointer"
                        };
                        var arrow_vector = paper_back.path(shared_paths.arrow).attr(arrow_attrs);
                        back_arrow = paper.set();
                        back_arrow.push(arrow_box, arrow_vector);
                        var t = "S" + s + "," + s + ",0,0 T0,0";
                        back_arrow.transform(t);
                    }
                    if (!initial_back) {
                        back_arrow.hide();
                    }
                    map_outer.style.left = m + "px";
                    map_outer.style.top = m + "px";
                    if (manual_zoom) {
                        create_zoom_buttons();
                    }
                }
            }
            function create_zoom_buttons() {
                var w = navw;
                var h = navw;
                zoom_back = Raphael(map_zoom, navw, navw * 2 + m);
                var zoom_in_path = "m 64,13.787 0,100.426 m -50.213,-50.212001 100.426,0";
                var plus_path = shared_paths.plus;
                var minus_path = shared_paths.minus;
                var box_path = shared_paths.rounded_box;
                var zoom_in_box = zoom_back.path(box_path).attr({
                    fill: navigation_color,
                    'stroke-width': 1,
                    stroke: navigation_border_color,
                    'stroke-opacity': 1,
                    'fill-opacity': navigation_opacity,
                    cursor: "pointer"
                });
                var zoom_in_vector = zoom_back.path(plus_path).attr({
                    'stroke-width': 0,
                    'stroke-opacity': 0,
                    fill: navigation_border_color,
                    'fill-opacity': 1,
                    opacity: 1,
                    cursor: "pointer"
                });
                zoom_in = paper.set();
                zoom_in.push(zoom_in_box, zoom_in_vector);
                var t = "S" + s + "," + s + ",0,0 T0,0";
                zoom_in.transform(t);
                var zoom_out_box = zoom_back.path(box_path).attr({
                    fill: navigation_color,
                    'stroke-width': 1,
                    stroke: navigation_border_color,
                    'stroke-opacity': 1,
                    'fill-opacity': navigation_opacity,
                    cursor: "pointer"
                });
                var zoom_out_vector = zoom_back.path(minus_path).attr({
                    'stroke-width': 0,
                    'stroke-opacity': 0,
                    fill: navigation_border_color,
                    'fill-opacity': 1,
                    opacity: 1,
                    cursor: "pointer"
                });
                zoom_out = paper.set();
                zoom_out.push(zoom_out_box, zoom_out_vector);
                var t = "S" + s + "," + s + ",0,0 T0," + (navw + m);
                zoom_out.transform(t);
                map_zoom.style.top = back_height + m * 2 + "px";
                map_zoom.style.left = m + "px";
                zoom_out = paper.set();
                zoom_out.push(zoom_out_box, zoom_out_vector);

                function move_zooming_dimensions(direction) {
                    var w = last_destination.sm.zooming_dimensions.w / direction;
                    var h = last_destination.sm.zooming_dimensions.h / direction;
                    var x = last_destination.sm.zooming_dimensions.x + (last_destination.sm.zooming_dimensions.w - w) / 2;
                    var y = last_destination.sm.zooming_dimensions.y + (last_destination.sm.zooming_dimensions.h - h) / 2;
                    var r = w / (original_width * scale);
                    return {
                        x: x,
                        y: y,
                        w: w,
                        h: h,
                        r: r
                    };
                }
                function zooming_allowed(direction) {
                    var w = last_destination.sm.zooming_dimensions.w / direction;
                    var zooming_out = direction < 1 ? true : false;
                    if (initial_zoom != -1 && (last_destination.sm.type == "manual" || initial_zoom_solo)) {
                        var initial_width = region_array[initial_zoom].sm.zooming_dimensions.w;
                        var outside_initial = w > initial_width - 1;
                        if (zooming_out && outside_initial) {
                            var inside_initial = is_inside(last_destination, region_array[initial_zoom]);
                            if (inside_initial || initial_zoom_solo) {
                                zoom_to(region_array[initial_zoom]);
                                return false;
                            }
                        }
                    }
                    if (zooming_out && w > region_array[-1].sm.zooming_dimensions.w - 1) {
                        if (!initial_zoom_solo) {
                            zoom_to(region_array[-1]);
                        }
                        return false;
                    }
                    return true;
                }
                function zoom_about(direction) {
                    if (!zooming_allowed(direction)) {
                        return;
                    }
                    var destination = {
                        sm: {
                            type: "manual",
                            zp: 1
                        }
                    };
                    if (zoom_tween) {
                        last_destination = {
                            sm: {
                                type: "manual",
                                zp: 1
                            }
                        };
                        last_destination.sm.zooming_dimensions = current_viewbox;
                        last_destination.sm.bbox = {
                            x: current_viewbox.x / scale,
                            y: current_viewbox.y / scale,
                            width: current_viewbox.w / scale,
                            height: current_viewbox.h / scale
                        };
                    }
                    var new_dimensions = move_zooming_dimensions(direction);
                    if (!new_dimensions) {
                        return;
                    }
                    destination.sm.zooming_dimensions = new_dimensions;
                    zoom_to(destination);
                }
                zoom_in_click = function() {
                    zoom_about(zoom_increment);
                };
                zoom_out_click = function() {
                    zoom_about(1 / zoom_increment);
                };
                api_object.zoom_in = zoom_in_click;
                api_object.zoom_out = zoom_out_click;
                zoom_in.click(zoom_in_click);
                zoom_out.click(zoom_out_click);
                zoom_in.touchend(zoom_in_click);
                zoom_out.touchend(zoom_out_click);
            }
        }
        var cattr, lattr, rattr, region_map, label_attributes, locations, set_state, set_label, ela;

        function set_attributes() {
            locations = mapdata.locations;
            cattr = [];
            lattr = [];
            region_map = [];
            label_attributes = [];
            rattr = [];
            ela = [];
            var set_region_attributes = function() {
                    var default_region = {};
                    default_region.color = false;
                    default_region.hover_color = false;
                    default_region.opacity = main_settings.region_opacity ? main_settings.region_opacity : 1;
                    default_region.hover_opacity = main_settings.region_hover_opacity ? main_settings.region_hover_opacity : 0.6;
                    default_region.url = false;
                    default_region.description = false;
                    default_region.description_mobile = false;
                    default_region.inactive = false;
                    default_region.zoomable = true;
                    default_region.popup = main_settings.region_popups ? main_settings.region_popups : popups;
                    default_region.cascade = main_settings.region_cascade_all == "yes" ? true : false;
                    default_region.zoom_percentage = zoom_percentage;
                    default_region.x = false;
                    default_region.y = false;
                    default_region.x2 = false;
                    default_region.y2 = false;
                    if (regions) {
                        for (var region in regions) {
                            for (var i = 0; i < regions[region].states.length; i++) {
                                var state = regions[region].states[i];
                                region_map[state] = region;
                            }
                        }
                    }
                    for (var id in regions) {
                        rattr[id] = Object.create(default_region);
                        if (regions[id].url) {
                            rattr[id].zoomable = false;
                        }
                        for (var prop in regions[id]) {
                            if (regions[id][prop] != "default") {
                                rattr[id][prop] = regions[id][prop];
                            }
                            if (regions[id][prop] == "yes") {
                                rattr[id][prop] = true;
                            }
                            if (regions[id][prop] == "no") {
                                rattr[id][prop] = false;
                            }
                        }
                    }
                };
            var set_state_attributes = function() {
                    set_state = function(id) {
                        var default_state = {};
                        default_state.color = main_settings.state_color;
                        default_state.image_url = main_settings.state_image_url ? main_settings.state_image_url : false;
                        default_state.image_size = main_settings.state_image_size ? main_settings.state_image_size : "auto";
                        default_state.image_position = main_settings.state_image_position ? main_settings.state_image_position : "center";
                        default_state.image_x = main_settings.state_image_x ? main_settings.state_image_x : "0";
                        default_state.image_y = main_settings.state_image_y ? main_settings.state_image_y : "0";
                        default_state.image_color = main_settings.state_image_color ? main_settings.state_image_color : false;
                        default_state.image_hover_url = main_settings.state_image_hover_url ? main_settings.state_image_hover_url : false;
                        default_state.image_hover_size = main_settings.state_image_hover_size ? main_settings.state_image_hover_size : "auto";
                        default_state.image_hover_position = main_settings.state_image_hover_position ? main_settings.state_image_hover_position : "center";
                        default_state.image_hover_x = main_settings.state_image_hover_x ? main_settings.state_image_hover_x : "0";
                        default_state.image_hover_y = main_settings.state_image_hover_y ? main_settings.state_image_hover_y : "0";
                        default_state.image_hover_color = main_settings.state_image_hover_color ? main_settings.state_image_hover_color : false;
                        default_state.hover_color = main_settings.state_hover_color;
                        default_state.image_source = false;
                        default_state.description = main_settings.state_description;
                        default_state.url = main_settings.state_url;
                        default_state.inactive = main_settings.all_states_inactive == "yes" ? true : false;
                        default_state.hide = main_settings.all_states_hidden == "yes" ? true : false;
                        default_state.hide_label = false;
                        default_state.border_color = main_settings.border_color ? main_settings.border_color : "#ffffff";
                        default_state.border_hover_color = main_settings.border_hover_color ? main_settings.border_hover_color : false;
                        default_state.border_hover_size = main_settings.border_hover_size ? main_settings.border_hover_size : false;
                        default_state.emphasize = "yes";
                        default_state.zoom_percentage = zoom_percentage;
                        default_state.zoomable = main_settings.all_states_zoomable == "yes" ? true : false;
                        default_state.popup = main_settings.state_popups ? main_settings.state_popups : popups;
                        default_state.opacity = main_settings.state_opacity ? main_settings.state_opacity : 1;
                        default_state.hover_opacity = main_settings.state_hover_opacity ? main_settings.state_hover_opacity : 1;
                        default_state.description_mobile = main_settings.state_description_mobile ? state_description_mobile : false;
                        var region_id = region_map[id] ? region_map[id] : false;
                        if (region_id && rattr[region_id].cascade) {
                            if (rattr[region_id].color) {
                                default_state.color = rattr[region_id].color;
                            }
                            if (rattr[region_id].hover_color) {
                                default_state.hover_color = rattr[region_id].hover_color;
                            }
                            if (rattr[region_id].description) {
                                default_state.description = rattr[region_id].description;
                            }
                            if (rattr[region_id].url) {
                                default_state.url = rattr[region_id].url;
                            }
                            if (rattr[region_id].inactive) {
                                default_state.inactive = rattr[region_id].inactive;
                            }
                            if (rattr[region_id].hide) {
                                default_state.hide = rattr[region_id].hide;
                            }
                        }
                        cattr[id] = Object.create(default_state);
                        if (mapname == "us" && (id == "GU" || id == "PR" || id == "VI" || id == "MP" || id == "AS")) {
                            cattr[id].hide = "yes";
                        }
                        if ((mapname == "us" && hide_eastern_labels) && (id == "VT" || id == "NJ" || id == "DE" || id == "DC" || id == "NH" || id == "MA" || id == "CT" || id == "RI" || id == "MD")) {
                            cattr[id].hide_label = "yes";
                        }
                        for (var prop in state_specific[id]) {
                            if (state_specific[id][prop] != "default") {
                                cattr[id][prop] = state_specific[id][prop];
                            }
                            if (state_specific[id][prop] == "yes") {
                                cattr[id][prop] = true;
                            }
                            if (state_specific[id][prop] == "no") {
                                cattr[id][prop] = false;
                            }
                        }
                        if (main_settings.state_hover_color == "off") {
                            cattr[id].hover_color = cattr[id].color;
                        }
                    };
                    for (var id in mapinfo.paths) {
                        set_state(id);
                    }
                };
            var set_label_attributes = function() {
                    var default_label = {};
                    default_label.font_family = main_settings.label_font ? main_settings.label_font : "arial,sans-serif";
                    default_label.color = main_settings.label_color ? main_settings.label_color : "white";
                    default_label.hover_color = main_settings.label_hover_color ? main_settings.label_hover_color : default_label.color;
                    default_label.opacity = main_settings.label_opacity || main_settings.label_opacity == "0" ? main_settings.label_opacity : 1;
                    default_label.hover_opacity = main_settings.label_hover_opacity ? main_settings.label_hover_opacity : default_label.opacity;
                    default_label.size = label_size;
                    default_label.hide = main_settings.hide_labels == "yes" ? true : false;
                    default_label.line = false;
                    default_label.scale = main_settings.label_scale ? main_settings.label_scale : false;
                    default_label.scale_limit = main_settings.scale_limit ? main_settings.scale_limit : 0.125;
                    default_label.rotate = main_settings.label_rotate ? main_settings.label_rotate : 0;
                    default_label.line_color = main_settings.label_line_color ? main_settings.label_line_color : "#000000";
                    default_label.line_size = main_settings.label_line_size ? main_settings.label_line_size : "1";
                    default_label.line_x = false;
                    default_label.line_y = false;
                    default_label.parent_type = "state";
                    default_label.parent_id = false;
                    default_label.anchor = main_settings.label_anchor ? main_settings.label_anchor : "middle";
                    default_label.pill = false;
                    default_label.width = main_settings.pill_width ? main_settings.pill_width : false;
                    default_label.x = false;
                    default_label.y = false;
                    default_label.name = "Not Named";
                    default_label.display = false;
                    default_label.display_ids = false;
                    default_label.id = false;
                    var default_labels = main_settings.import_labels == "no" ? {} : mapinfo.default_labels;
                    var apply_default_label = function(id) {
                            label_attributes[id] = Object.create(default_label);
                            for (var prop in default_labels[id]) {
                                if (default_labels[id][prop] != "default") {
                                    label_attributes[id][prop] = default_labels[id][prop];
                                }
                                if (default_labels[id][prop] == "yes") {
                                    label_attributes[id][prop] = true;
                                }
                                if (default_labels[id][prop] == "no") {
                                    label_attributes[id][prop] = false;
                                }
                            }
                        };
                    var apply_mapdata_label = function(id) {
                            if (!label_attributes[id]) {
                                label_attributes[id] = Object.create(default_label);
                            }
                            for (var prop in labels[id]) {
                                if (labels[id][prop] != "default") {
                                    label_attributes[id][prop] = labels[id][prop];
                                }
                                if (labels[id][prop] == "yes") {
                                    label_attributes[id][prop] = true;
                                }
                                if (labels[id][prop] == "no") {
                                    label_attributes[id][prop] = false;
                                }
                            }
                        };
                    for (var id in default_labels) {
                        apply_default_label(id);
                    }
                    for (var id in labels) {
                        apply_mapdata_label(id);
                    }
                    set_label = function(id) {
                        apply_default_label(id);
                        apply_mapdata_label(id);
                    };
                };
            var set_location_attributes = function() {
                    var default_location = {};
                    default_location.scale_limit = main_settings.scale_limit ? main_settings.scale_limit : 0.0625;
                    default_location.color = main_settings.location_color ? main_settings.location_color : "#FF0067";
                    default_location.hover_color = main_settings.location_hover_color ? main_settings.location_hover_color : false;
                    default_location.border = main_settings.location_border ? main_settings.location_border : 1.5;
                    default_location.border_color = main_settings.location_border_color ? main_settings.location_border_color : "#FFFFFF";
                    default_location.hover_border = main_settings.location_hover_border ? main_settings.location_hover_border : 2;
                    default_location.size = main_settings.location_size;
                    default_location.description = main_settings.location_description;
                    default_location.description_mobile = main_settings.location_description_mobile ? location_description_mobile : false;
                    default_location.url = main_settings.location_url;
                    default_location.inactive = main_settings.all_locations_inactive == "yes" ? true : false;
                    default_location.type = main_settings.location_type;
                    default_location.position = "top";
                    default_location.pulse = main_settings.location_pulse == "yes" ? true : false;
                    default_location.pulse_size = main_settings.location_pulse_size ? main_settings.location_pulse_size : 4;
                    default_location.pulse_speed = main_settings.location_pulse_speed ? main_settings.location_pulse_speed : 0.5;
                    var pulse_color = main_settings.location_pulse_color;
                    default_location.pulse_color = pulse_color && pulse_color != "auto" ? pulse_color : false;
                    default_location.image_source = main_settings.location_image_source ? main_settings.location_image_source : "";
                    default_location.hide = main_settings.all_locations_hide ? main_settings.all_locations_hide : "no", default_location.opacity = default_location_opacity;
                    default_location.scale = true;
                    default_location.hover_opacity = main_settings.location_hover_opacity ? main_settings.location_hover_opacity : false;
                    default_location.image_source = main_settings.location_image_source ? main_settings.location_image_source : "";
                    default_location.image_url = main_settings.location_image_url ? main_settings.location_image_url : false;
                    default_location.image_position = main_settings.location_image_position ? main_settings.location_image_position : "center";
                    default_location.image_hover_source = main_settings.location_image_hover_source ? main_settings.location_image_hover_source : "";
                    default_location.image_hover_url = main_settings.location_image_hover_url ? main_settings.location_image_hover_url : false;
                    default_location.image_hover_position = main_settings.location_image_hover_position ? main_settings.location_image_hover_position : "center";
                    default_location.popup = main_settings.location_popups ? main_settings.location_popups : popups;
                    default_location.x = false;
                    default_location.y = false;
                    default_location.display = main_settings.location_display ? main_settings.location_display : "all";
                    default_location.display_ids = false;
                    default_location.hide = main_settings.all_locations_hidden == "yes" ? true : false;
                    if (default_location.type == undefined) {
                        default_location.type = "square";
                    }
                    for (var id in locations) {
                        lattr[id] = Object.create(default_location);
                        for (var prop in locations[id]) {
                            if (prop == "overwrite_image_location") {
                                lattr[id].image_url = locations[id][prop];
                                continue;
                            }
                            if (prop == "region") {
                                lattr[id].display = "region";
                            }
                            if (locations[id][prop] != "default") {
                                lattr[id][prop] = locations[id][prop];
                            }
                            if (locations[id][prop] == "yes") {
                                lattr[id][prop] = true;
                            }
                            if (locations[id][prop] == "no") {
                                lattr[id][prop] = false;
                            }
                        }
                        if (!lattr[id].hover_opacity) {
                            lattr[id].hover_opacity = lattr[id].opacity;
                        }
                        if (!lattr[id].hover_color) {
                            lattr[id].hover_color = lattr[id].color;
                        }
                    }
                };
            var set_line_attributes = function() {
                    var default_line = {};
                    default_line.color = main_settings.line_color ? main_settings.line_color : "#cecece";
                    default_line.size = main_settings.line_size ? main_settings.line_size : 1;
                    default_line.dash = main_settings.line_dash ? main_settings.line_dash : "";
                    var lines = mapdata.lines ? mapdata.lines : mapdata.borders;
                    for (var id in lines) {
                        ela[id] = Object.create(default_line);
                        for (var prop in lines[id]) {
                            if (lines[id][prop] != "default") {
                                ela[id][prop] = lines[id][prop];
                            }
                            if (lines[id][prop] == "yes") {
                                ela[id][prop] = true;
                            }
                            if (lines[id][prop] == "no") {
                                ela[id][prop] = false;
                            }
                        }
                    }
                };
            set_region_attributes();
            set_state_attributes();
            set_label_attributes();
            set_location_attributes();
            set_line_attributes();
        }
        var currently_zooming = false;
        var max_width;
        var currently_panning = false;
        var currently_pinching = false;

        function create_tooltip() {
            var find_pos = helper.findPos(map_inner);
            var x0_page = find_pos[0];
            var y0_page = find_pos[1];
            var x0 = 0;
            var y0 = 0;
            var h = 0;
            var w = 0;
            var u;
            var l;
            var x_mid;
            var y_mid;
            var left = 5;
            var tt, h;
            return {
                create: function() {
                    tt = document.createElement("div");
                    tt.setAttribute("id", "tt_sm_" + div);
                    tt.style.position = "absolute";
                    tt.style.display = "none";
                    map_inner.appendChild(tt);
                    map_inner.onmousemove = this.pos;
                    tt.onmousemove = this.pos;
                },
                show: function(element) {
                    if (popup_off) {
                        return;
                    }
                    ignore_pos = false;
                    if (tt == null) {
                        tooltip.create();
                    }
                    tt.style.display = "block";
                    tt.style.zIndex = 2;
                    tt.style.maxWidth = max_width + "px";
                    tt.innerHTML = element.sm.content;
                    tooltip.update_pos(element);
                },
                reset_pos: function(x, y, element) {
                    if (tt == undefined) {
                        tooltip.create();
                    }
                    tooltip.set_pos(y0 + y, x0 + x, element);
                },
                update_pos: function(element) {
                    tooltip.set_pos(u, l, element);
                },
                pos: function(e, manual) {
                    if (manual) {
                        u = manual.u;
                        l = manual.l;
                    } else {
                        u = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
                        l = ie ? event.clientX + document.documentElement.scrollLeft : e.pageX;
                    }
                    u = u - y0_page;
                    l = l - x0_page;
                    if (popup_off || tooltip_manual || ignore_pos || tooltip_up && on_click) {
                        return;
                    }
                    tooltip.set_pos(u, l);
                },
                set_pos: function(u, l, element) {
                    if (!tt || !u || !l) {
                        return;
                    }
                    x_mid = x0 + 0.5 * width;
                    y_mid = y0 + 0.5 * height;
                    if (l > x_mid && u > y_mid) {
                        quad = 4;
                    } else if (l < x_mid && u > y_mid) {
                        quad = 3;
                    } else if (l > x_mid && u < y_mid) {
                        quad = 2;
                    } else {
                        var quad = 1;
                    }
                    var centered = element && element.sm.on_click && (popup_centered == "yes" || popup_centered == "auto" && width < 401) ? true : false;
                    if (centered) {
                        tt.style.top = "-100px";
                        tt.style.left = "-100px";
                        tt.style.bottom = "auto";
                        tt.style.right = "auto";
                        h = parseInt(tt.offsetHeight, 10);
                        w = parseInt(tt.offsetWidth, 10);
                        var side = width - w > 0 ? 0.5 * (width - w) : 0;
                        var bar = height - h > 0 ? 0.5 * (height - h) : 0;
                        tt.style.top = bar + "px";
                        tt.style.left = side + "px";
                        tt.style.right = "auto";
                        tt.style.bottom = "auto";
                    } else {
                        if (popup_orientation == "below") {
                            if (quad == 3) {
                                quad = 1;
                            }
                            if (quad == 4) {
                                quad = 2;
                            }
                        } else if (popup_orientation == "above") {
                            if (quad == 1) {
                                quad = 3;
                            }
                            if (quad == 2) {
                                quad = 4;
                            }
                        }
                        if (quad == 1) {
                            tt.style.bottom = "auto";
                            tt.style.top = u + 5 + "px";
                            tt.style.left = l + left + 5 + "px";
                            tt.style.right = "auto";
                        } else if (quad == 2) {
                            tt.style.bottom = "auto";
                            tt.style.top = u + 5 + "px";
                            tt.style.right = width - l + 5 + "px";
                            tt.style.left = "auto";
                        } else if (quad == 3) {
                            tt.style.bottom = height - u + 5 + "px";
                            tt.style.top = "auto";
                            tt.style.left = l + left + 3 + "px";
                            tt.style.right = "auto";
                        } else {
                            tt.style.bottom = height - u + 5 + "px";
                            tt.style.top = "auto";
                            tt.style.right = width - l + 5 + "px";
                            tt.style.left = "auto";
                        }
                    }
                },
                hide: function() {
                    if (tt != undefined) {
                        tt.style.display = "none";
                    }
                    find_pos = helper.findPos(map_inner);
                    if (find_pos) {
                        x0_page = find_pos[0];
                        y0_page = find_pos[1];
                    }
                }
            };
        }
        function getxy(lat, lng) {
            if (mapinfo.proj == "lambert") {
                var proj = lambert;
            } else if (mapinfo.proj == "xy") {
                var proj = xy;
            } else if (mapinfo.proj == "robinson_pacific") {
                var proj = robinson_pacific;
            } else if (mapinfo.proj == "mercator") {
                var proj = mercator;
            } else {
                var proj = robinson;
            }
            var initial = {
                lat: lat,
                lng: lng
            };

            function intersection(x0, y0, r0, x1, y1, r1) {
                var a, dx, dy, d, h, rx, ry;
                var x2, y2;
                var dx = x1 - x0;
                var dy = y1 - y0;
                var d = Math.sqrt(dy * dy + dx * dx);
                var a = (r0 * r0 - r1 * r1 + d * d) / (2 * d);
                var x2 = x0 + dx * a / d;
                var y2 = y0 + dy * a / d;
                var h = Math.sqrt(r0 * r0 - a * a);
                var rx = -dy * (h / d);
                var ry = dx * (h / d);
                var xi = x2 + rx;
                var xi_prime = x2 - rx;
                var yi = y2 + ry;
                var yi_prime = y2 - ry;
                return {
                    opt1: {
                        x: xi,
                        y: yi
                    },
                    opt2: {
                        x: xi_prime,
                        y: yi_prime
                    }
                };
            }
            function xy(latlng) {
                return {
                    x: latlng.lng,
                    y: latlng.lat
                };
            }
            function lambert(latlng) {
                var radian = 0.017453293;
                var pi = Math.PI;
                var phi = latlng.lat * radian;
                var lam = latlng.lng * radian;
                var phi0 = 45 * radian;
                var lam0 = 90 * radian;
                var phi1 = 33 * radian;
                var phi2 = 45 * radian;
                var n = Math.log(Math.cos(phi1) * (1 / Math.cos(phi2))) / Math.log(Math.tan(0.25 * pi + 0.5 * phi2) * (1 / Math.tan(0.25 * pi + 0.5 * phi1)));
                var F = Math.cos(phi1) * Math.pow(Math.tan(0.25 * pi + 0.5 * phi1), n) / n;
                var rho = F * Math.pow(1 / Math.tan(0.25 * pi + 0.5 * phi), n);
                var rho0 = F * Math.pow(1 / Math.tan(0.25 * pi + 0.5 * phi0), n);
                return {
                    x: rho * Math.sin(n * (lam - lam0)),
                    y: rho0 - rho * Math.cos(n * (lam - lam0))
                };
            }
            function robinson(latlng) {
                var earthRadius = 1;
                var radian = 0.017453293;
                var roundToNearest = function(roundTo, value) {
                        return Math.floor(value / roundTo) * roundTo;
                    };
                var getSign = function(value) {
                        return value < 0 ? -1 : 1;
                    };
                var lngSign = getSign(latlng.lng);
                var latSign = getSign(latlng.lat);
                var lng = Math.abs(latlng.lng);
                var lat = Math.abs(latlng.lat);
                var low = roundToNearest(5, lat - 1e-10);
                low = lat == 0 ? 0 : low;
                var high = low + 5;
                var lowIndex = low / 5;
                var highIndex = high / 5;
                var ratio = (lat - low) / 5;
                var AA = [0.8487, 0.84751182, 0.84479598, 0.840213, 0.83359314, 0.8257851, 0.814752, 0.80006949, 0.78216192, 0.76060494, 0.73658673, 0.7086645, 0.67777182, 0.64475739, 0.60987582, 0.57134484, 0.52729731, 0.48562614, 0.45167814];
                var BB = [0, 0.0838426, 0.1676852, 0.2515278, 0.3353704, 0.419213, 0.5030556, 0.5868982, 0.67182264, 0.75336633, 0.83518048, 0.91537187, 0.99339958, 1.06872269, 1.14066505, 1.20841528, 1.27035062, 1.31998003, 1.3523];
                var adjAA = (AA[highIndex] - AA[lowIndex]) * ratio + AA[lowIndex];
                var adjBB = (BB[highIndex] - BB[lowIndex]) * ratio + BB[lowIndex];
                return {
                    x: adjAA * lng * radian * lngSign * earthRadius,
                    y: adjBB * latSign * earthRadius
                };
            }
            function robinson_pacific(latlng) {
                var lng = latlng.lng - 150;
                if (lng < -180) {
                    lng = lng + 360;
                }
                return robinson({
                    lat: latlng.lat,
                    lng: lng
                });
            }
            function mercator(latlng) {
                var y = Math.log(Math.tan((latlng.lat / 90 + 1) * (Math.PI / 4))) * (180 / Math.PI);
                return {
                    x: latlng.lng,
                    y: y
                };
            }
            var calibrate = mapinfo.proj_coordinates;

            function find_point(initial, pt1, pt2, pt3) {
                var proj_initial = proj(initial);
                var pt1_proj = proj(pt1);
                var pt2_proj = proj(pt2);
                var pt3_proj = proj(pt3);
                var proj_r_pt1 = helper.distance(proj_initial, pt1_proj);
                var proj_r_pt2 = helper.distance(proj_initial, pt2_proj);
                var dist_proj = helper.distance(pt1_proj, pt2_proj);
                var dist_act = helper.distance(pt1, pt2);
                var scale = dist_proj / dist_act;
                var r_pt1 = proj_r_pt1 / scale;
                var r_pt2 = proj_r_pt2 / scale;
                var opts = intersection(pt1.x, pt1.y, r_pt1, pt2.x, pt2.y, r_pt2);
                var dist_third = helper.distance(proj_initial, pt3_proj) / scale;
                var remnant1 = Math.abs(helper.distance(opts.opt1, pt3) - dist_third);
                var remnant2 = Math.abs(helper.distance(opts.opt2, pt3) - dist_third);
                if (remnant1 < remnant2) {
                    return {
                        x: opts.opt1.x,
                        y: opts.opt1.y
                    };
                } else {
                    return {
                        x: opts.opt2.x,
                        y: opts.opt2.y
                    };
                }
            }
            var rules = mapinfo.proj_rules;
            if (rules) {
                for (var i in rules) {
                    var rule = rules[i];
                    var condition_string = rule.condition;
                    try {
                        var condition = eval(rule.condition);
                    } catch (e) {
                        console.log("The condition " + condition_string + " is not valid JavaScript");
                    }
                    if (condition) {
                        var points = rule.points;
                        return find_point(initial, calibrate[points[0]], calibrate[points[1]], calibrate[points[2]]);
                    }
                }
            }
            return find_point(initial, calibrate[0], calibrate[1], calibrate[2]);
        }
        var tt_css_set = false;

        function set_tt_css() {
            if (tt_css_set) {
                return;
            }
            function newStyle(str) {
                var pa = document.getElementsByTagName("head")[0];
                var el = document.createElement("style");
                el.type = "text/css";
                el.media = "screen";
                if (el.styleSheet) {
                    el.styleSheet.cssText = str;
                } else {
                    el.appendChild(document.createTextNode(str));
                }
                pa.appendChild(el);
                return el;
            }
            function getsupportedprop(proparray) {
                var root = document.documentElement;
                for (var i = 0; i < proparray.length; i++) {
                    if (proparray[i] in root.style) {
                        var answer = proparray[i];
                        answer = answer.replace("borderRadius", "border-radius");
                        answer = answer.replace("MozBorderRadius", "-moz-border-radius");
                        answer = answer.replace("WebkitBorderRadius", "-webkit-border-radius");
                        answer = answer.replace("boxShadow", "box-shadow");
                        answer = answer.replace("MozBoxShadow", "-moz-box-shadow");
                        answer = answer.replace("WebkitBoxShadow", "-webkit-box-shadow");
                        return answer;
                    }
                }
            }
            var roundborderprop = getsupportedprop(["borderRadius", "MozBorderRadius", "WebkitBorderRadius"]);
            var rcss = roundborderprop ? roundborderprop + ": " + popup_corners + "px;" : "";
            var min = width / 2 > 250 ? width / 2 : 250;
            max_width = popup_maxwidth ? popup_maxwidth : min;
            var shadowprop = getsupportedprop(["boxShadow", "MozBoxShadow", "WebkitBoxShadow"]);
            var scss = shadowprop ? shadowprop + ": " + 3 * popup_shadow + "px " + 3 * popup_shadow + "px " + 4 * popup_shadow + "px rgba(0,0,0,.5);" : "";
            if (popup_shadow < 0.01) {
                scss = "";
            }
            var mcss = ".tt_mobile_sm{margin-top: 5px;} .tt_sm{" + rcss + scss + "z-index: 1000000; background-color: " + popup_color + "; padding: 7px; opacity:" + popup_opacity + "; font: " + popup_font + "; color: black;} .tt_name_sm{float: left; font-weight: bold} .tt_custom_sm{overflow: hidden;}";
            mcss += ".btn_simplemaps{color: black;text-decoration: none;background: #ffffff;display: inline-block;padding: 5px 5px;margin: 0; width: 100%; -webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; line-height: 1.43;text-align: center;white-space: nowrap;vertical-align: middle;-ms-touch-action: manipulation;touch-action: manipulation;cursor: pointer;-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;border: 1px solid;border-radius: 4px;}    .btn_simplemaps:hover{  text-decoration: underline;}";
            var xml_float = vml ? "left" : "right";
            mcss += ".xmark_sm{float: " + xml_float + "; margin-left: 5px; cursor: pointer; line-height: 0px;}";
            newStyle(mcss);
            tt_css_set = true;
        }
        function get_zooming_dimensions(element) {
            if (element.sm.zooming_dimensions) {
                return element.sm.zooming_dimensions;
            }
            var bbox = helper.rotate_bbox(element.sm.bbox, transform);
            var gotoX = bbox.x;
            var gotoY = bbox.y;
            var gotoW = bbox.width;
            var gotoH = bbox.height;
            var ratio;
            var zp = element.sm.zp;
            var paperWidth = original_width * scale;
            var paperHeight = original_height * scale;
            gotoX = gotoX - (gotoW / zp - gotoW) * 0.5;
            gotoY = gotoY - (gotoH / zp - gotoH) * 0.5;
            gotoW = gotoW / zp;
            gotoH = gotoH / zp;
            if (gotoW / gotoH > width_to_height) {
                ratio = gotoW / paperWidth;
                gotoY -= (paperHeight * ratio - gotoH) / 2;
                gotoH = gotoW / width_to_height;
            } else {
                ratio = gotoH / paperHeight;
                gotoX -= (paperWidth * ratio - gotoW) / 2;
                gotoW = gotoH * width_to_height;
            }
            return {
                x: gotoX,
                y: gotoY,
                w: gotoW,
                h: gotoH,
                r: ratio
            };
        }
        function reset_state_attributes(region) {
            if (!region) {
                return;
            }
            all_states.stop();
            for (var i = 0; i < region.sm.states.length; ++i) {
                var state = state_array[region.sm.states[i]];
                state.attr(state.sm.attributes);
                highlight_labels(state, "reset", false, "state");
            }
        }
        function reset_last_state() {
            if (last_destination && last_destination.sm.type == "state" && last_destination.sm.attributes) {
                if (!last_destination.sm.ignore_hover) {
                    last_destination.attr(last_destination.sm.attributes);
                }
                highlight_labels(last_destination, "out");
            }
        }
        function reset_region_attributes(region) {
            if (!region) {
                return;
            }
            region.stop();
            region.attr(region.sm.attributes);
            for (var i = 0; i < region.sm.states.length; ++i) {
                var state = state_array[region.sm.states[i]];
                highlight_labels(state, "reset", false, "region");
            }
        }
        function region_or_state_by_ratio() {
            all_regions.forEach(function(region) {
                if (region.sm.id == -1) {
                    return;
                }
                if (region.sm.zooming_dimensions.r > ratio) {
                    reset_state_attributes(region);
                } else {
                    reset_region_attributes(region);
                }
            });
        }
        function reset_all_region_attributes() {
            all_regions.forEach(function(region) {
                if (region.sm.id != -1) {
                    reset_region_attributes(region);
                }
            });
        }
        function show_point(l, destination) {
            var display = l.sm.display;
            var type = destination.sm.type;
            if (display == "all") {
                return true;
            } else if (display == "out" && type == "out") {
                return true;
            } else if (display == "region" && type == "region") {
                return in_region(l, destination);
            } else if (display == "state" && type == "state") {
                return in_state(l, destination);
            } else {
                var threshold = helper.to_float(display);
                if (threshold && ratio < threshold) {
                    return true;
                }
            }
            return false;

            function in_region(l, region) {
                var pt = l.sm.point0;
                if (l.sm.display_ids) {
                    var show_manually = l.sm.display_ids.indexOf(region.sm.id) > -1 ? true : false;
                    return show_manually;
                }
                if (Raphael.isPointInsideBBox(region.sm.bbox, pt.x, pt.y)) {
                    return true;
                }
                return false;
            }
            function in_state(l, state) {
                var pt = l.sm.point0;
                if (l.sm.display_ids) {
                    var show_manually = l.sm.display_ids.indexOf(state.sm.id) > -1 ? true : false;
                    return show_manually;
                }
                var in_state_bbox = Raphael.isPointInsideBBox(state.sm.bbox, pt.x, pt.y);
                if (in_state_bbox) {
                    var path = mapinfo.paths[state.sm.id];
                    if (Raphael.isPointInsidePath(path, pt.x, pt.y)) {
                        return true;
                    }
                }
                return false;
            }
        }
        function animate_transform(e, t, i) {
            var a = {
                transform: t
            };
            if (!vml && !touch && !i) {
                e.animate(a, zoom_time * 1000);
            } else {
                e.attr(a);
            }
        }
        function label_correction(destination, initial) {
            all_labels.hide();
            for (var i in label_array) {
                var lbl = label_array[i];
                if (lbl.sm.hide) {
                    continue;
                }
                if (show_point(lbl, destination)) {
                    var lbl_set = label_set_array[lbl.sm.id];
                    lbl_set.show();
                }
                if (lbl.sm.line) {
                    var line_path = get_line_path(lbl);
                    lbl.sm.line.attr({
                        path: line_path,
                        transform: transform
                    });
                }
                if (lbl.sm.scale) {
                    var factor = ratio > lbl.sm.scale_limit ? ratio : lbl.sm.scale_limit;
                    var t = scale_t(lbl, factor * scale);
                    animate_transform(lbl, t, initial);
                    if (lbl.sm.pill) {
                        var pill = pill_array[lbl.sm.id];
                        animate_transform(pill, t, initial);
                    }
                }
            }
        }
        function location_correction(destination, initial) {
            all_locations.hide();
            all_locations.forEach(function(lct) {
                if (lct.sm.hide) {
                    return;
                }
                if (show_point(lct, destination)) {
                    lct.show();
                }
                if (lct.sm.scale) {
                    var factor = ratio > lct.sm.scale_limit ? ratio : lct.sm.scale_limit;
                    var t = scale_t(lct, factor * scale);
                    animate_transform(lct, t, initial);
                }
            });
        }
        function hide_and_show_before(destination, initial) {
            var type = destination.sm.type;
            back_arrow.hide();
            location_correction(destination, initial);
            label_correction(destination, initial);
            (function update_regions() {
                if (helper.x_in_array(type, ["state", "region", "out"])) {
                    reset_all_region_attributes();
                }
                if (type == "region") {
                    reset_state_attributes(destination);
                } else if (type == "state") {
                    reset_state_attributes(region_array[destination.sm.region]);
                } else if (type == "manual") {
                    region_or_state_by_ratio();
                }
            })();
            (function update_opacity() {
                if (type != "out" && type != "manual") {
                    all_states.stop();
                    all_pills.stop();
                    all_states.attr({
                        'fill-opacity': adjacent_opacity
                    });
                    all_pills.attr({
                        'fill-opacity': adjacent_opacity
                    });
                    destination.stop();
                    destination.attr({
                        'fill-opacity': 1
                    });
                    destination.sm.labels.forEach(function(label) {
                        if (label.sm && label.sm.pill) {
                            label.sm.pill.stop();
                            label.sm.pill.attr({
                                'fill-opacity': 1
                            });
                        }
                    });
                    destination.animate({
                        'stroke-width': destination.sm.border_hover_size * (width / original_width) * normalizing_factor * 1.25
                    }, zoom_time * 1000);
                } else {
                    all_states.attr({
                        'fill-opacity': 1
                    });
                    all_pills.attr({
                        'fill-opacity': 1
                    });
                }
            })();
            all_states.animate({
                'stroke-width': border_size * (width / original_width) * normalizing_factor * 1.25
            }, zoom_time * 1000);
        }
        function hide_and_show_after(destination) {
            if (initial_zoom_solo && initial_zoom != "-1" && destination.sm.type == "region") {
                if (initial_back) {
                    back_arrow.show();
                } else {
                    return;
                }
            } else if (destination.sm.type == "state" || destination.sm.type == "region" || initial_back) {
                back_arrow.show();
            } else if (manual_zoom && destination.sm.type != "out") {
                back_arrow.show();
            }
        }
        function zd_to_tween(bb) {
            return {
                x: bb.x,
                y: bb.y,
                w: bb.w,
                h: bb.h
            };
        }
        var end_destination;
        var zoom_tween;
        var current_viewbox;

        function zoom_to(destination, initial, callback) {
            if (last_animated) {
                last_animated.stop();
                last_animated = false;
            }
            if (currently_over && !(destination == currently_over)) {
                out.call(currently_over);
            }
            last_clicked = false;
            end_destination = destination;
            tooltip.hide();
            tooltip_up = false;
            currently_zooming = true;
            destination.sm.zooming_dimensions = get_zooming_dimensions(destination);
            var to = zd_to_tween(destination.sm.zooming_dimensions);
            var from = zd_to_tween(last_destination.sm.zooming_dimensions);
            ratio = destination.sm.zooming_dimensions.r;
            hide_and_show_before(destination, initial);

            function updateZoom(current_state) {
                current_viewbox = current_state;
                paper.setViewBox(current_state.x, current_state.y, current_state.w, current_state.h, false);
            }
            function whenDone() {
                hide_and_show_after(destination, initial);
                last_destination = destination;
                currently_zooming = false;
                on_click = false;
                update_zoom_level();
                trigger_hook("zooming_complete", []);
                if (helper.isFunction(callback)) {
                    callback();
                }
            }
            if (!vml && (!touch || zoom_mobile) && !initial) {
                tweenable = dependencies.Tweenable ? new dependencies.Tweenable : new Tweenable;
                zoom_tween = tweenable.tween({
                    from: from,
                    to: to,
                    duration: zoom_time * 1000,
                    easing: "easeOutQuad",
                    step: function(current_state) {
                        updateZoom(current_state);
                    },
                    finish: function() {
                        whenDone(to);
                    }
                });
            } else {
                current_viewbox = to;
                paper.setViewBox(to.x, to.y, to.w, to.h, false);
                whenDone();
            }
        }
        function create_bbox_state(auto) {
            var print_string = "";
            var state_bbox_array = {};
            for (var state in mapinfo.paths) {
                var path_to_add = mapinfo.paths[state];
                path_to_add = Raphael._pathToAbsolute(path_to_add);
                var bt = Raphael.pathBBox(path_to_add);
                var w = bt.x2 - bt.x;
                var r;
                if (w < 10) {
                    r = 10;
                } else {
                    r = 1;
                }
                var x = Math.round(bt.x * r) / r;
                var y = Math.round(bt.y * r) / r;
                var y2 = Math.round(bt.y2 * r) / r;
                var x2 = Math.round(bt.x2 * r) / r;
                print_string += "'" + state + "'" + ":{x: " + x + ",y:" + y + ",x2:" + x2 + ",y2:" + y2 + "},";
                state_bbox_array[state] = bt;
            }
            print_string = print_string.substring(0, print_string.length - 1);
            print_string += "}";
            if (!auto) {
                console.log("The new state_bbox_array is: \n\n{" + print_string);
            }
            return state_bbox_array;
        }
        function create_content(element) {
            var content = element.sm.description;
            var embedded_img = "data:image/svg+xml,%3Csvg%20enable-background%3D%22new%200%200%20256%20256%22%20height%3D%22256px%22%20id%3D%22Layer_1%22%20version%3D%221.1%22%20viewBox%3D%220%200%20256%20256%22%20width%3D%22256px%22%20xml%3Aspace%3D%22preserve%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%3Cpath%20d%3D%22M137.051%2C128l75.475-75.475c2.5-2.5%2C2.5-6.551%2C0-9.051s-6.551-2.5-9.051%2C0L128%2C118.949L52.525%2C43.475%20%20c-2.5-2.5-6.551-2.5-9.051%2C0s-2.5%2C6.551%2C0%2C9.051L118.949%2C128l-75.475%2C75.475c-2.5%2C2.5-2.5%2C6.551%2C0%2C9.051%20%20c1.25%2C1.25%2C2.888%2C1.875%2C4.525%2C1.875s3.275-0.625%2C4.525-1.875L128%2C137.051l75.475%2C75.475c1.25%2C1.25%2C2.888%2C1.875%2C4.525%2C1.875%20%20s3.275-0.625%2C4.525-1.875c2.5-2.5%2C2.5-6.551%2C0-9.051L137.051%2C128z%22%2F%3E%3C%2Fsvg%3E";
            var xmark_modern = "<img id=\"xpic_sm" + "_" + div + "\"src=\"" + embedded_img + "\" style=\"width: 18px;\" alt=\"Close\" border=\"0\" />";
            var xmark_vml = "<a style=\"line-height: 1.5\" id=\"xpic_sm" + "_" + div + "\">X</a>";
            var xmark = vml ? xmark_vml : xmark_modern;
            var url = element.sm.url ? element.sm.url : "";
            var url_sub = url;
            var js_url = url_sub.substring(0, 11) == "javascript:" ? true : false;
            var tab_click = "(function(){window.open(\"" + url + "\",\"_blank\")})()";
            var reg_click = js_url ? "(function(){window.location.href=\"" + url + "\"})()" : "(function(){window.top.location.href=\"" + url + "\"})()";
            var js_url_clean = helper.replaceAll(url_sub, "'", "\"");
            var js_click = "(function(){" + js_url_clean + "})()";
            var upon_click = new_tab ? tab_click : reg_click;
            if (js_url) {
                upon_click = js_click;
            }
            var mobile_part = element.sm.description_mobile ? element.sm.description_mobile : "<div class=\"tt_mobile_sm\"><a class=\"btn_simplemaps\" onClick='" + upon_click + "'>" + link_text + "</a></div>";
            if (!element.sm.on_click) {
                xmark = "";
                mobile_part = "";
            }
            if (element.sm.url == "" && !element.sm.description_mobile) {
                mobile_part = "";
            }
            var content_part = content == "" ? (content_part = "") : "<div class=\"tt_custom_sm\"; />" + content + "</div>";
            return "<div class=\"tt_sm\"><div><div class=\"tt_name_sm\">" + element.sm.name + "</div><div class=\"xmark_sm\">" + xmark + "</div><div style=\"clear: both;\"></div></div>" + content_part + mobile_part + "</div></div>";
        }
        function is_forgery() {
            if (mapname != "continent") {
                return false;
            }
            var i = 0;
            for (var id in mapinfo.paths) {
                i++;
            }
            if (i > 8) {
                return true;
            } else {
                return false;
            }
        }
        function is_inside(small_element, big_element) {
            var small = small_element.sm.zooming_dimensions;
            if (small.w > big_element.sm.zooming_dimensions.w) {
                return false;
            }
            var bb = big_element.sm.bbox;
            var big = {
                x: bb.x * scale,
                y: bb.y * scale,
                x2: bb.x2 * scale,
                y2: bb.y2 * scale
            };
            small_xbar = small.x + small.w / 2;
            small_ybar = small.y + small.h / 2;
            if (small_xbar > big.x && small_ybar > big.y) {
                if (small_xbar < big.x2 && small_ybar < big.y2) {
                    return true;
                }
            }
            return false;
        }
        function create_pattern(e, par) {
            var hovering = par.hover ? "_hover" : "";
            var pattern_id = div + "_pattern_" + e.sm.id + hovering;
            var existing = document.getElementById(pattern_id);
            if (existing) {
                helper.delete_element(existing);
            }
            var svg = map_inner.firstChild;
            var SVG_NS = svg.namespaceURI;
            var defs = svg.querySelector("defs");
            var pattern = document.createElementNS(SVG_NS, "pattern");
            var id = e.sm.id;
            pattern.id = pattern_id;
            pattern.setAttribute("patternUnits", "objectBoundingBox");
            var image = document.createElementNS(SVG_NS, "image");
            var rect = document.createElementNS(SVG_NS, "rect");
            var bg_color = par.image_color ? par.image_color : par.color;
            rect.setAttribute("fill", "#ffffff");
            rect.setAttribute("opacity", "0");
            image.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", par.image_url);
            pattern.appendChild(rect);
            pattern.appendChild(image);
            defs.appendChild(pattern);
            svg.appendChild(defs);
            var image_position = par.image_position;
            var auto = par.image_size == "auto" ? true : false;
            var repeat = image_position == "repeat" ? true : false;
            var manual = image_position == "manual" ? true : false;
            var center = image_position == "center" ? true : false;
            var fill = repeat || manual || center ? false : true;
            var bbox = Raphael.pathBBox(mapinfo.paths[id]);
            var bbox_width = bbox.x2 - bbox.x;
            var bbox_height = bbox.y2 - bbox.y;
            var bbox_w2h = bbox_width / bbox_height;
            Raphael._preload(par.image_url, function() {
                var image_width = this.offsetWidth;
                var image_height = this.offsetHeight;
                var w2h = image_width / image_height;

                function get_per() {
                    var per = par.image_size;
                    if (auto) {
                        if (repeat || manual) {
                            if (w2h > 1) {
                                if (image_width > bbox_width) {
                                    per = 1;
                                } else {
                                    per = image_width / bbox_width;
                                }
                            } else {
                                if (image_height > bbox_height) {
                                    per = 1 / bbox_w2h;
                                } else {
                                    per = image_height / bbox_height / bbox_w2h;
                                }
                            }
                        } else if (center) {
                            per = w2h / bbox_w2h;
                            if (w2h > bbox_w2h) {
                                per = per;
                            } else {
                                per = 1 / per;
                            }
                        }
                    } else {
                        if (per > 1) {
                            per = par.image_size * normalizing_factor / bbox_width;
                        }
                    }
                    return per;
                }
                var per = get_per();
                var new_image_width = bbox_width * per;
                var new_image_height = new_image_width / w2h;
                var pattern_x = 0;
                var pattern_y = 0;
                var pattern_width, pattern_height;
                var image_x = 0;
                var image_y = 0;
                if (repeat) {
                    pattern_width = per;
                    pattern_height = per * bbox_w2h / w2h;
                } else if (manual) {
                    pattern_width = 1;
                    pattern_height = 1;
                    image_x = par.image_x * bbox_width;
                    image_y = par.image_y * bbox_height;
                } else if (center) {
                    pattern_width = 1;
                    pattern_height = 1;
                    image_x = 0.5 * (bbox_width - new_image_width);
                    image_y = 0.5 * (bbox_height - new_image_height);
                }
                rect.setAttribute("x", 0);
                rect.setAttribute("y", 0);
                rect.setAttribute("width", bbox_width);
                rect.setAttribute("height", bbox_height);
                rect.setAttribute("fill", bg_color);
                pattern.setAttribute("y", pattern_y);
                pattern.setAttribute("x", pattern_x);
                pattern.setAttribute("y", pattern_y);
                pattern.setAttribute("width", pattern_width);
                pattern.setAttribute("height", pattern_height);
                image.setAttribute("x", image_x);
                image.setAttribute("y", image_y);
                image.setAttribute("width", new_image_width);
                if (rotate) {
                    var cx = image_x + new_image_width * 0.5;
                    var cy = image_y + new_image_height * 0.5;
                    image.setAttribute("transform", "rotate(-" + rotate + "," + cx + "," + cy + ")");
                }
                image.setAttribute("height", new_image_height);
            });
            return "url(\"#" + pattern.id + "\")";
        }
        var state_bbox_array = false;
        var make_state, bbox_storage, state_array;

        function create_states(refresh) {
            if (!refresh) {
                bbox_storage = {};
                state_array = {};
            }
            state_bbox_array = mapinfo.state_bbox_array;
            var scaled_border_size = border_size * scale * normalizing_factor * 1.25;
            make_state = function(id) {
                var brand_new = state_array[id] ? false : true;
                var state = brand_new ? paper.path(mapinfo.paths[id]) : state_array[id];
                var attrs = cattr[id];
                if (brand_new) {
                    state.sm = {
                        id: id
                    };
                }
                if (!vml) {
                    state.node.setAttribute("class", "sm_state_" + id);
                }
                var attributes = {
                    fill: attrs.color,
                    opacity: attrs.opacity,
                    stroke: attrs.border_color,
                    cursor: "pointer",
                    'stroke-opacity': 1,
                    'stroke-width': scaled_border_size,
                    'stroke-linejoin': "round"
                };
                var border_hover_color = attrs.border_hover_color ? attrs.border_hover_color : main_settings.border_color;
                var border_hover_size = attrs.border_hover_size ? attrs.border_hover_size : border_size;
                var scaled_border_hover_size = border_hover_size * scale * normalizing_factor * 1.25;
                var over_attributes = {
                    opacity: attrs.hover_opacity,
                    fill: attrs.hover_color,
                    stroke: border_hover_color,
                    'stroke-width': scaled_border_hover_size
                };
                state.sm.image = false;
                if (attrs.image_url && !vml) {
                    var image_parameters = {
                        hover: false,
                        image_url: attrs.image_url,
                        image_size: attrs.image_size,
                        image_position: attrs.image_position,
                        image_x: attrs.image_x,
                        image_y: attrs.image_y,
                        image_color: attrs.image_color
                    };
                    var pattern_url = create_pattern(state, image_parameters);
                    state.sm.image = true;
                    attributes.fill = pattern_url;
                    if (attrs.image_hover_url) {
                        var image_parameters = {
                            hover: true,
                            image_url: attrs.image_hover_url,
                            image_size: attrs.image_hover_size,
                            image_position: attrs.image_hover_position,
                            image_x: attrs.image_hover_x,
                            image_y: attrs.image_hover_y,
                            image_color: attrs.image_hover_color
                        };
                        var pattern_url = create_pattern(state, image_parameters);
                        over_attributes.fill = pattern_url;
                    } else {
                        over_attributes.fill = pattern_url;
                    }
                }
                if (attrs.inactive) {
                    attributes.cursor = "default";
                }
                if (attrs.image_source) {
                    state.sm.ignore_hover = true;
                    attributes.fill = "url(" + directory + attrs.image_source + ")";
                }
                if ((attrs.border_hover_color || attrs.border_hover_size) && attrs.emphasize) {
                    state.sm.emphasizable = true;
                } else {
                    state.sm.emphasizable = false;
                }
                state.sm.border_hover_size = border_hover_size;
                state.attr(attributes);
                state.transform(transform);
                state.sm.attributes = attributes;
                state.sm.over_attributes = over_attributes;
                state.sm.description = attrs.description;
                state.sm.adjacent_attributes = {
                    'fill-opacity': adjacent_opacity
                };
                state.sm.hide = attrs.hide;
                state.sm.hide_label = attrs.hide_label;
                if (brand_new) {
                    state.sm.region = false;
                }
                state.sm.name = attrs.name ? attrs.name : mapinfo.names[id];
                if (!state.sm.name) {
                    state.sm.name = id;
                }
                state.sm.url = attrs.url;
                state.sm.inactive = attrs.inactive;
                state.sm.on_click = is_onclick(attrs.popup);
                state.sm.popup_off = is_off(attrs.popup);
                state.sm.labels = [];
                state.sm.zp = attrs.zoom_percentage;
                state.sm.zoomable = attrs.zoomable;
                state.sm.description_mobile = attrs.description_mobile;
                state.sm.type = "state";
                state.sm.hide_labels = attrs.hide_label;
                state.sm.content = create_content(state);
                var sba = state_bbox_array[id];
                if (!sba) {
                    sba = Raphael.pathBBox(mapinfo.paths[id]);
                }
                var bbox = {
                    x: sba.x,
                    x2: sba.x2,
                    y: sba.y,
                    y2: sba.y2
                };
                state.sm.bbox = bbox;
                state.sm.bbox.width = bbox.x2 - bbox.x;
                state.sm.bbox.height = bbox.y2 - bbox.y;
                if (state.sm.hide) {
                    state.hide();
                } else {
                    if (brand_new) {
                        all_visible_states.push(state);
                    }
                }
                if (brand_new) {
                    state_array[id] = state;
                    all_states.push(state);
                }
            };
            for (var id in mapinfo.paths) {
                make_state(id);
            }
            make_state[-1];
            all_states.hide();
        }
        function style_background() {
            background_color.attr({
                fill: main_settings.background_color,
                'fill-opacity': opacity,
                stroke: "none"
            });
        }
        var region_array, last_destination, destination;
        var initial_zoom_state = false;
        var initial_zoom_manual;

        function create_regions(refresh) {
            if (!refresh) {
                region_array = {};
            }
            if (regions) {
                for (var id in regions) {
                    var attrs = rattr[id];
                    var region_object = regions[id];
                    var region = refresh ? region_array[id] : paper.set();
                    if (!refresh) {
                        region.sm = {};
                        region.sm.states = [];
                        if (region_array[id]) {
                            console.log("Duplicate Regions");
                            continue;
                        }
                        var all_bb = [];
                        for (var i = 0; i < region_object.states.length; i++) {
                            var state_id = region_object.states[i];
                            var state = state_array[state_id];
                            if (!state) {
                                console.log(state_id + " does not exist");
                                continue;
                            }
                            if (state.sm.region) {
                                console.log(state.sm.name + " already assigned to a region");
                                continue;
                            }
                            state.sm.region = id;
                            region.sm.states.push(state_id);
                            if (!(vml && state.sm.ignore_hover && (attrs.color || attrs.hover_color))) {
                                region.push(state);
                            }
                            all_bb.push(state.sm.bbox);
                        }
                        if (attrs.x && attrs.y && attrs.x2 && attrs.y2) {
                            all_bb = [{
                                x: attrs.x,
                                y: attrs.y,
                                x2: attrs.x2,
                                y2: attrs.y2
                            }];
                        }
                        region.sm.bbox = helper.bbox_union(all_bb);
                    }
                    var attributes = {
                        'fill-opacity': attrs.opacity,
                        cursor: "pointer"
                    };
                    var over_attributes = {
                        'fill-opacity': attrs.hover_opacity
                    };
                    if (attrs.color) {
                        attributes.fill = attrs.color;
                    }
                    if (attrs.hover_color) {
                        over_attributes.fill = attrs.hover_color;
                    }
                    if (attrs.inactive) {
                        attributes.cursor = "default";
                    }
                    region.sm.attributes = attributes;
                    region.sm.name = region_object.name;
                    region.sm.description = attrs.description;
                    region.sm.description_mobile = attrs.description_mobile;
                    region.sm.url = attrs.url;
                    region.sm.labels = paper.set();
                    region.sm.on_click = is_onclick(attrs.popup);
                    region.sm.content = create_content(region);
                    region.sm.over_attributes = over_attributes;
                    region.sm.adjacent_attributes = {
                        'fill-opacity': adjacent_opacity
                    };
                    region.sm.zoomable = attrs.zoomable;
                    region.sm.popup_off = is_off(attrs.popup);
                    region.sm.zp = attrs.zoom_percentage;
                    region.sm.inactive = attrs.inactive;
                    region.sm.type = "region";
                    region.sm.id = id;
                    if (!refresh) {
                        all_regions.push(region);
                        region_array[id] = region;
                    }
                    region.sm.zooming_dimensions = get_zooming_dimensions(region);
                }
            }
            if (!refresh) {
                region_array[-1] = {};
                var out = region_array[-1];
                out.sm = {};
                out.sm.type = "out";
                out.sm.zp = 1;
                var bbox = helper.clone(initial_view);
                bbox.width = bbox.x2 - bbox.x;
                bbox.height = bbox.y2 - bbox.y;
                out.sm.bbox = bbox;
                out.sm.zooming_dimensions = get_zooming_dimensions(out);
                last_destination = out;
                if (typeof initial_zoom === "object") {
                    initial_zoom_manual = {};
                    initial_zoom_manual.sm = {
                        type: "manual",
                        zp: 1,
                        bbox: initial_zoom
                    };
                    initial_zoom_manual.sm.zooming_dimensions = get_zooming_dimensions(initial_zoom_manual);
                    initial_zoom = -1;
                    initial_zoom_solo = false;
                } else if (initial_zoom != -1 && !(initial_zoom in region_array)) {
                    if (initial_zoom in state_array) {
                        initial_zoom_state = state_array[initial_zoom];
                        initial_zoom_solo = false;
                    } else {
                        console.log("The initial_zoom is not the id of a region or state");
                    }
                    initial_zoom = -1;
                }
                if (fly_in) {
                    region_array[-2] = {};
                    var destination = region_array[-2];
                    destination.sm = {
                        type: "manual",
                        zp: 1
                    };
                    var ivd = get_zooming_dimensions(region_array[initial_zoom]);
                    var w = ivd.w;
                    var h = ivd.h;
                    var xinc = ivd.w * (fly_in - 1) * 0.5;
                    var yinc = ivd.h * (fly_in - 1) * 0.5;
                    destination.sm.zooming_dimensions = {
                        x: ivd.x - xinc,
                        y: ivd.y - yinc,
                        w: w * fly_in,
                        h: h * fly_in,
                        r: fly_in
                    };
                }
            }
        }
        function create_lines() {
            var lines = mapdata.lines ? mapdata.lines : mapdata.borders;
            if (!lines) {
                return;
            }
            for (i in lines) {
                var line = lines[i];
                var attrs = ela[i];
                attrs.size = attrs.size * (width / original_width) * normalizing_factor * 1.25;
                var b = paper.path(line.path);
                b.transform(transform);
                b.attr({
                    stroke: attrs.color,
                    fill: "none",
                    cursor: "pointer",
                    'stroke-dasharray': [attrs.dash],
                    'stroke-width': attrs.size,
                    'stroke-linejoin': "round",
                    'stroke-miterlimit': 4
                });
                b.sm = {};
                b.sm.size = attrs.size / normalizing_factor;
                b.sm.bbox = b.getBBox(true);
                all_external_lines.push(b);
            }
            all_external_lines.hide();
        }
        function get_label_bbox(e) {
            var bb = e.getBBox(true);
            if (vml) {
                var bb2 = e._getBBox(true);
                bb.height = bb2.height;
            }
            var xa = 0.5 * bb.width;
            var ya = 0.5 * bb.height;
            var pt = e.sm.point0;
            var new_bb = {
                x: pt.x - xa,
                y: pt.y - ya,
                x2: pt.x + xa,
                y2: pt.y + ya,
                width: bb.width,
                height: bb.height
            };
            return new_bb;
        }
        var label_array;
        var label_set_array;
        var make_label;
        var pill_array;

        function create_labels() {
            helper.clear_sets([all_labels, all_lines, all_pills]);
            label_array = {};
            pill_array = {};
            label_set_array = {};
            label_attributes = label_attributes.reverse();
            make_label = function(id) {
                var attrs = label_attributes[id];
                var force_scale = false;
                var already_rotated = false;
                if (!label_attributes.hasOwnProperty(id)) {
                    return;
                }
                var brand_new = label_array[id] ? false : true;
                var label_set = paper.set();
                var point0 = {
                    x: attrs.x * 1,
                    y: attrs.y * 1
                };
                var point = {};
                var parent = false;
                var resize_parent = false;
                if (attrs.parent_type == "state") {
                    parent = state_array[attrs.parent_id];
                } else if (attrs.parent_type == "region") {
                    parent = region_array[attrs.parent_id];
                } else if (attrs.parent_type == "location") {
                    parent = location_array[attrs.parent_id];
                }
                if (!attrs.x && !attrs.y && parent) {
                    if (parent.sm.type == "location") {
                        already_rotated = true;
                        point.x = parent.sm.x;
                        point.y = parent.sm.y;
                        point0 = parent.sm.point0;
                        force_scale = true;
                        if (parent.sm.auto_size) {
                            resize_parent = true;
                        }
                    }
                }
                if (attrs.parent_type == "none") {}
                if (!parent) {
                    console.log("The following object does not exist: " + id);
                    return;
                }
                if (attrs.name == "Not Named" && parent) {
                    attrs.name = parent.sm.id;
                }
                if (brand_new) {
                    if (!already_rotated) {
                        var rotated = helper.rotate([attrs.x, attrs.y], transform);
                        point = {
                            x: rotated[0],
                            y: rotated[1]
                        };
                    }
                    var label = paper.text(point.x, point.y, attrs.name);
                    label_array[id] = label;
                } else {
                    var label = label_array[id];
                }
                label.sm = {};
                label.sm.hide = attrs.hide;
                if (parent && (parent.sm.hide_label || parent.sm.hide)) {
                    label.sm.hide = true;
                }
                label.sm.parent = parent;
                parent.sm.labels.push(label);
                if (parent.sm.region) {
                    region_array[parent.sm.region].sm.labels.push(label);
                }
                var attributes = {
                    'stroke-width': 0,
                    fill: attrs.color,
                    'font-size': attrs.size,
                    'font-weight': "bold",
                    cursor: "pointer",
                    'font-family': attrs.font_family,
                    'text-anchor': attrs.anchor,
                    opacity: attrs.opacity
                };
                var over_attributes = {
                    fill: attrs.hover_color,
                    opacity: attrs.hover_opacity
                };
                var out_attributes = {
                    fill: attrs.color,
                    opacity: attrs.opacity
                };
                if (parent.sm.inactive) {
                    attributes.cursor = "default";
                }
                label.attr(attributes);
                label.sm.attributes = attributes;
                label.sm.over_attributes = over_attributes;
                label.sm.out_attributes = out_attributes;
                label.sm.type = "label";
                label.sm.id = id;
                label.sm.scale = force_scale ? force_scale : attrs.scale;
                label.sm.scale_limit = attrs.scale_limit;
                label.sm.x = point.x;
                label.sm.y = point.y;
                label.sm.point0 = point0;
                label.sm.line_x = attrs.line_x;
                label.sm.line_y = attrs.line_y;
                label.sm.line = false;
                label.sm.rotate = attrs.rotate;
                label.transform(scale_t(label, scale));
                if (!attrs.display) {
                    if (attrs.parent_type == "region") {
                        label.sm.display = "out";
                    } else if (attrs.parent_type == "location") {
                        label.sm.display = parent.sm.display;
                    } else {
                        label.sm.display = main_settings.labels_display ? main_settings.labels_display : "all";
                    }
                } else {
                    label.sm.display = attrs.display;
                }
                label.sm.display_ids = attrs.display_ids ? attrs.display_ids : false;
                if (attrs.line || attrs.pill || resize_parent) {
                    label.sm.bbox = get_label_bbox(label);
                }
                if (attrs.line) {
                    var line_path = get_line_path(label);
                    var line = paper.path(line_path);
                    var line_size = attrs.line_size * normalizing_factor * scale * 1.25;
                    var line_attrs = {
                        stroke: attrs.line_color,
                        cursor: "pointer",
                        'stroke-width': line_size
                    };
                    line.attr(line_attrs);
                    line.sm = {};
                    line.sm.type = "label";
                    label.sm.pill = false;
                    line.sm.size = attrs.line_size;
                    line.sm.id = id;
                    label.sm.line = line;
                    all_lines.push(line);
                    label_set.push(line);
                }
                if (parent.sm.type == "state" && attrs.pill) {
                    var label_bbox = label.sm.bbox;
                    var p = 0.15;
                    var calculated_width = label_bbox.width * (1 + p * 3);
                    var pill_width = attrs.width ? attrs.width : calculated_width;
                    var pill_height = label_bbox.height * (1 + p);
                    var x = label.sm.x - 0.5 * pill_width;
                    var y = label.sm.y - 0.5 * pill_height;
                    var r = pill_height / 5;
                    if (pill_array[id]) {
                        var pill = pill_array[id];
                    } else {
                        var pill = paper.rect(x, y, pill_width, pill_height, r);
                        pill_array[id] = pill;
                    }
                    pill.transform(scale_t(label, scale));
                    pill.sm = {};
                    pill.sm.parent = parent;
                    pill.sm.attributes = helper.clone(parent.sm.attributes);
                    if (parent.sm.image) {
                        pill.sm.attributes.fill = cattr[parent.sm.id].color;
                    }
                    pill.sm.over_attributes = helper.clone(parent.sm.over_attributes);
                    if (parent.sm.image) {
                        pill.sm.over_attributes.fill = cattr[parent.sm.id].hover_color;
                    }
                    pill.sm.adjacent_attributes = helper.clone(parent.sm.adjacent_attributes);
                    pill.attr(pill.sm.attributes);
                    if (helper.x_in_array(label.sm.display, ["state", "all"])) {
                        parent.sm.bbox = helper.bbox_union([parent.sm.bbox, label.sm.bbox]);
                    }
                    if (helper.x_in_array(label.sm.display, ["region", "all"]) && parent.sm.region) {
                        var region = region_array[parent.sm.region];
                        region.sm.bbox = helper.bbox_union([region.sm.bbox, label.sm.bbox]);
                        region.sm.zooming_dimensions = false;
                        region.sm.zooming_dimensions = get_zooming_dimensions(region);
                    }
                    label.sm.pill = pill;
                    all_pills.push(pill);
                    label_set.push(pill);
                    label_set.push(label);
                } else {
                    label_set.push(label);
                }
                if (label.sm.display != "out" && label.sm.display != "all" || label.sm.hide) {
                    label_set.hide();
                } else {
                    all_visible_labels.push(label_set);
                }
                if (label.sm.parent.sm.type == "location" && !label.sm.line) {
                    location_labels.push(label_set);
                }
                all_labels.push(label_set);
                label_set_array[id] = label_set;
                if (!vml) {
                    label.node.setAttribute("class", "sm_label_" + id);
                }
                if (resize_parent) {
                    var padding = main_settings.location_auto_padding ? 1 + main_settings.location_auto_padding * 2 : 1.3;
                    var size = padding * label.sm.bbox.width / normalizing_factor;
                    var lct = label.sm.parent;
                    var old_labels = lct.sm.labels;
                    var shape = lct.sm.shape_type;
                    if (shape == "triangle") {
                        size = size * 1.3;
                    } else if (shape == "star") {
                        size = size * 2;
                    }
                    var lct_id = lct.sm.id;
                    lattr[lct_id].size = size;
                    make_location(lct_id);
                    var lct = location_array[lct_id];
                    label.sm.parent = lct;
                    lct.sm.labels = old_labels;
                    lct.sm.labels.push(label);
                    lct.sm.auto_size = true;
                }
            };
            for (var id in label_attributes) {
                make_label(id);
            }
            all_labels.hide();
        }
        function get_line_path(label) {
            var bb = label.sm.bbox;
            var w = bb.x2 - bb.x;
            var h = bb.y2 - bb.y;
            var r = label.sm.scale ? ratio : 1;
            var x_adj = 0.5 * (1 - r) * w;
            var y_adj = 0.5 * (1 - r) * h;
            var x = label.sm.line_x;
            var y = label.sm.line_y;
            var missing = !x || !y;
            var parent_type = label.sm.parent.sm.type;
            if (parent_type == "location" && missing) {
                x = label.sm.parent.sm.point0.x;
                y = label.sm.parent.sm.point0.y;
            } else if (parent_type == "state" && missing) {
                var pbb = label.sm.parent.sm.bbox;
                x = 0.5 * (pbb.x2 + pbb.x);
                y = 0.5 * (pbb.y2 + pbb.y);
            }
            var current_location = {
                x: x,
                y: y
            };
            var pts = [];
            pts.push({
                x: bb.x2 - x_adj,
                y: 0.5 * (bb.y + bb.y2)
            });
            pts.push({
                x: bb.x + x_adj,
                y: 0.5 * (bb.y + bb.y2)
            });
            pts.push({
                x: 0.5 * (bb.x + bb.x2),
                y: bb.y + y_adj
            });
            pts.push({
                x: 0.5 * (bb.x + bb.x2),
                y: bb.y2 - y_adj
            });
            var winner = {};
            for (var k in pts) {
                var current_label = pts[k];
                var distance_between = helper.distance(current_label, current_location);
                if (k == 0 || distance_between < winner.distance) {
                    winner.label = current_label;
                    winner.location = current_location;
                    winner.distance = distance_between;
                }
            }
            return helper.linePath(winner.label.x, winner.label.y, winner.location.x, winner.location.y);
        }
        function scale_t(e, s, t, x, y, r) {
            var cx = x === undefined ? e.sm.x : x;
            var cy = y === undefined ? e.sm.y : y;
            if (t === undefined) {
                t = "0,0";
            }
            if (r === undefined) {
                r = e.sm.rotate;
            }
            return "t " + t + " s" + s + "," + s + "," + cx + "," + cy + "r" + r;
        }
        var location_array;
        var make_location;

        function create_locations(refresh) {
            var shape_paths = {
                triangle: "M -0.57735,.3333 .57735,.3333 0,-.6666 Z",
                diamond: "M 0,-0.5 -0.4,0 0,0.5 0.4,0 Z",
                marker: "m-.015-.997c-.067 0-.13.033-.18.076-.061.054-.099.136-.092.219-.0001.073.034.139.068.201.058.104.122.206.158.32.021.058.039.117.058.175.006.009.011-.004.011-.009.037-.125.079-.249.144-.362.043-.08.095-.157.124-.244.022-.075.016-.161-.026-.229-.048-.08-.134-.136-.227-.146-.013-.0001-.027-.0001-.04-.0001z",
                heart: "m-.275-.5c-.137.003-.257.089-.3.235-.073.379.348.539.58.765.202-.262.596-.33.576-.718-.017-.086-.065-.157-.13-.206-.087-.066-.208-.089-.311-.05-.055.02-.106.053-.143.098-.065-.081-.169-.127-.272-.125",
                star: "m0-.549c-.044.126-.084.252-.125.379-.135.0001-.271.0001-.405.002.108.078.216.155.323.233-.002.029-.016.057-.023.085-.032.099-.066.199-.097.298.049-.031.095-.068.143-.101.062-.044.124-.089.185-.133.109.077.216.158.326.233-.04-.127-.082-.253-.123-.379.109-.079.219-.156.327-.236-.135-.0001-.27-.002-.405-.003-.042-.126-.081-.252-.125-.377"
            };
            for (var id in custom_shapes) {
                shape_paths[id] = custom_shapes[id];
            }
            var supported_shapes = [];
            for (var id in shape_paths) {
                supported_shapes.push(id);
            }
            helper.clear_sets([all_locations]);
            location_array = {};
            make_location = function(id) {
                var position = "center";
                var attrs = lattr[id];
                if (attrs.type != "image") {
                    var attributes = {
                        'stroke-width': attrs.border * scale * normalizing_factor,
                        stroke: attrs.border_color,
                        fill: attrs.color,
                        opacity: attrs.opacity,
                        cursor: "pointer"
                    };
                    var over_attributes = {
                        'stroke-width': attrs.hover_border * scale * normalizing_factor,
                        stroke: attrs.border_color,
                        fill: attrs.hover_color,
                        opacity: attrs.hover_opacity,
                        cursor: "pointer"
                    };
                } else {
                    position = attrs.image_position;
                    var attributes = {
                        cursor: "pointer"
                    };
                    var over_attributes = {
                        cursor: "pointer"
                    };
                }
                if (attrs.inactive) {
                    attributes.cursor = "default";
                }
                var shape_type = lattr[id].type;
                var size = attrs.size * normalizing_factor;
                if (attrs.x && attrs.y) {
                    var point0 = {};
                    point0.x = attrs.x, point0.y = attrs.y;
                } else {
                    var point0 = getxy(attrs.lat, attrs.lng);
                }
                var rotated = helper.rotate([point0.x, point0.y], transform);
                var point = {
                    x: rotated[0],
                    y: rotated[1]
                };
                if (attrs.size == "auto") {
                    var l = {
                        sm: {}
                    };
                    l.sm.display = attrs.display;
                    l.sm.auto_size = true;
                    l.sm.type = "location";
                    l.sm.hide_label = false;
                    l.sm.labels = [];
                    l.sm.point0 = point0;
                    l.sm.x = point.x;
                    l.sm.y = point.y;
                    l.sm.shape_type = shape_type;
                    l.sm.id = id;
                    location_array[id] = l;
                    return;
                }
                if (shape_type == "circle") {
                    var location = paper.circle(point.x, point.y, size * 0.5);
                    var bbox = {
                        x: point.x - size * 0.5 * ratio,
                        y: point.y - size * 0.5 * ratio,
                        x2: point.x + size * 0.5 * ratio,
                        y2: point.y + size * 0.5 * ratio
                    };
                } else if (helper.x_in_array(shape_type, supported_shapes)) {
                    var cs = size;
                    var transformation = "S" + cs + "," + cs + ",0,0 T" + point.x + "," + point.y;
                    var path = Raphael.transformPath(shape_paths[shape_type], transformation).toString() + "Z";
                    if (shape_type == "marker") {
                        position = "bottom-center";
                    }
                    var bbox = Raphael.pathBBox(path);
                    var location = paper.path(path);
                } else if (shape_type == "image") {
                    var image_location = attrs.image_url ? attrs.image_url : directory + attrs.image_source;
                    var location = paper.image(image_location, 0, 0);
                    attributes.src = image_location;
                    location.sm = {};
                    var bbox = false;
                    Raphael._preload(image_location, function() {
                        var iwh = this.width / this.height;
                        var new_height = size;
                        var new_width = new_height * iwh;
                        var new_x = point.x - new_width / 2;
                        var new_y = position == "bottom-center" ? point.y - new_height : point.y - new_height / 2;
                        location.attr({
                            height: new_height,
                            width: new_width,
                            x: new_x,
                            y: new_y
                        });
                        location.sm.bbox = {
                            x: new_x,
                            y: new_y,
                            x2: new_x + new_width,
                            y2: new_y + new_height
                        };
                    });
                    if (attrs.image_hover_url || attrs.image_hover_source) {
                        var image_hover_location = attrs.image_hover_url ? attrs.image_hover_url : directory + attrs.image_hover_source;
                        over_attributes.src = image_hover_location;
                    }
                } else {
                    var new_height = size;
                    var new_width = new_height;
                    var new_x = point.x - new_width / 2;
                    var new_y = point.y - new_height / 2;
                    var location = paper.rect(new_x, new_y, new_width, new_height);
                    var bbox = {
                        x: new_x,
                        y: new_y,
                        x2: new_x + new_width,
                        y2: new_y + height
                    };
                }
                location.sm = {};
                location.sm.image = shape_type == "image" ? true : false;
                location.sm.attributes = attributes;
                location.attr(attributes);
                location.sm.original_transform = transform;
                location.sm.over_attributes = over_attributes;
                location.sm.id = id;
                location.sm.name = attrs.name;
                location.sm.scale = attrs.scale;
                location.sm.scale_limit = attrs.scale_limit;
                location.sm.position = position;
                location.sm.url = attrs.url;
                location.sm.type = "location";
                location.sm.shape_type = shape_type;
                location.sm.description = attrs.description;
                location.sm.description_mobile = attrs.description_mobile;
                location.sm.inactive = attrs.inactive;
                location.sm.on_click = is_onclick(attrs.popup);
                location.sm.popup_off = is_off(attrs.popup);
                location.sm.pulse = attrs.pulse;
                var underlay = attrs.position == "bottom" ? true : false;
                location.sm.underlay = underlay;
                location.sm.pulse_speed = attrs.pulse_speed;
                location.sm.pulse_size = attrs.pulse_size;
                location.sm.pulse_color = attrs.pulse_color ? attrs.pulse_color : attrs.color;
                location.sm.x = point.x;
                location.sm.y = point.y;
                location.sm.point0 = point0;
                location.sm.bbox = bbox;
                location.sm.labels = [];
                location.sm.size = size;
                location.sm.hide = attrs.hide;
                location.sm.display = attrs.display;
                location.sm.display_ids = attrs.display_ids ? attrs.display_ids : false;
                location.transform(scale_t(location, ratio * scale));
                if (location.sm.display == "region" || location.sm.display == "state" || attrs.hide) {
                    location.hide();
                }
                location.sm.content = create_content(location);
                if (underlay) {
                    bottom_locations.push(location);
                } else {
                    top_locations.push(location);
                }
                all_locations.push(location);
                location_array[id] = location;
                if (!vml) {
                    location.node.setAttribute("class", "sm_location_" + id);
                }
            };
            for (var id in locations) {
                make_location(id);
            }
        }
        function state_or_region(state) {
            var level = api_object.zoom_level;
            var level_id = api_object.zoom_level_id;
            var region = state.sm.region ? region_array[state.sm.region] : false;
            if (region) {
                if (level == "out") {
                    return region;
                } else if (level == "region") {
                    if (level_id == region.sm.id) {
                        return state;
                    } else {
                        return region;
                    }
                } else if (level == "state") {
                    var current_state = state_array[level_id];
                    if (current_state.sm.region === region.sm.id) {
                        return state;
                    } else {
                        return region;
                    }
                } else if (level == "manual") {
                    if (ratio > region.sm.zooming_dimensions.r) {
                        return region;
                    } else {
                        return state;
                    }
                }
            } else {
                return state;
            }
        }
        function is_adjacent(element) {
            var level = api_object.zoom_level;
            var level_id = api_object.zoom_level_id;
            if (level == "state") {
                if (level_id != element.sm.id) {
                    return true;
                } else {
                    return false;
                }
            } else if (level == "region") {
                var region = element.sm.region ? region_array[element.sm.region] : false;
                if (region) {
                    if (level_id == region.sm.id) {
                        return false;
                    }
                } else {
                    return true;
                }
            } else {
                return false;
            }
        }
        var update_attr = function(e, pos, anim, attrs) {
                if (anim == undefined) {
                    anim = false;
                }
                if (attrs == undefined) {
                    attrs = false;
                }
                if (!attrs) {
                    if (pos == "over") {
                        attrs = e.sm.over_attributes;
                    } else if (pos == "adjacent") {
                        attrs = e.sm.adjacent_attributes;
                    } else {
                        attrs = e.sm.attributes;
                    }
                }
                if (!anim || e.sm.image) {
                    e.attr(attrs);
                } else {
                    e.animate(attrs, fade_time);
                }
            };
        var update_pill_attr = function(pill, pos, override) {
                if (override == undefined) {
                    override = false;
                }
                if (override == "state") {
                    var parent = pill.sm.parent;
                } else if (override == "region") {
                    var parent = region_array[pill.sm.parent.sm.region];
                } else {
                    var parent = state_or_region(pill.sm.parent);
                }
                var attrs;
                if (pos == "over") {
                    attrs = helper.clone(parent.sm.over_attributes);
                } else if (pos == "adjacent") {
                    attrs = helper.clone(parent.sm.adjacent_attributes);
                } else {
                    attrs = helper.clone(parent.sm.attributes);
                }
                if (parent.sm.image && parent.sm.type == "state") {
                    var state_attrs = cattr[parent.sm.id];
                    if (pos == "over") {
                        attrs.fill = state_attrs.hover_color;
                    } else {
                        attrs.fill = state_attrs.color;
                    }
                }
                update_attr(pill, pos, false, attrs);
            };

        function highlight_labels(element, type, adjacent, override) {
            if (!element.sm.labels) {
                return;
            } else {
                var labels = element.sm.labels;
            }
            labels.forEach(function(label) {
                if (!label.sm) {
                    return;
                }
                var pill = label.sm.pill;
                if (type == "over") {
                    label.stop();
                    update_attr(label, "over");
                    if (pill) {
                        update_pill_attr(pill, "over");
                    }
                } else if (type == "reset" || type == "out") {
                    update_attr(label, "out");
                    if (pill) {
                        update_pill_attr(pill, "out", override);
                        if (adjacent) {
                            update_pill_attr(pill, "adjacent", override);
                        }
                    }
                }
            });
        }
        function labels_inactive(element) {
            if (!element.sm.labels) {
                return;
            } else {
                var labels = element.sm.labels;
            }
            labels.forEach(function(label) {
                if (element.sm.inactive) {
                    label.attr({
                        cursor: "default"
                    });
                } else {
                    label.attr({
                        cursor: "pointer"
                    });
                }
            });
        }
        var inserting = false;

        function emphasize(element) {
            if (element.sm.type != "state") {
                return;
            }
            if (!element.sm.emphasizable) {
                return;
            }
            inserting = true;
            element.insertBefore(all_visible_states);
            setTimeout(function() {
                inserting = false;
            }, 1);
        }
        var currently_over = false;
        var pulse;
        var last_animated = false;
        var region_click;
        var label_click;
        var click;
        var over;
        var out;
        var background_click;
        var label_over;
        var label_out;
        var back_click;
        var back_click_handler;

        function create_event_handlers() {
            label_over = function() {
                if (this.sm.parent) {
                    over.call(this.sm.parent);
                }
            };
            label_out = function() {
                if (this.sm.parent) {
                    out.call(this.sm.parent);
                }
            };
            label_click = function(e) {
                if (this.sm.parent) {
                    click.call(this.sm.parent, e);
                }
            };
            pulse = function(e, manual) {
                if (!e.sm.pulse && !manual) {
                    return;
                }
                var type = e.sm.shape_type;
                if (e.sm.type != "location" || type == "image" || ratio < 0.05) {
                    return;
                }
                var pulse = e.clone();
                top_locations.toFront();
                location_labels.toFront();
                var mag = 1 * e.sm.pulse_size;
                var stroke_width = e.attrs['stroke-width'];
                var anim_to = {
                    'stroke-width': stroke_width * 4,
                    'stroke-opacity': 0
                };
                pulse.attr({
                    'fill-opacity': 0,
                    stroke: e.sm.pulse_color
                });
                var callback = function() {
                        pulse.remove();
                    };
                var r = e.sm.scale ? ratio : 1;
                var ty = (mag - 1) * 0.5 * e.sm.size * r * scale;
                var pulse_t = e.sm.position == "bottom-center" ? scale_t(e, r * scale * mag, "0," + ty) : scale_t(e, r * scale * mag);
                anim_to.transform = pulse_t;
                pulse.animate(anim_to, e.sm.pulse_speed * 1000, "ease-out", callback);
            };
            over = function() {
                xy_hook_check();
                if (!this.id && !this.type == "set") {
                    return;
                }
                if (inserting || no_tooltips) {
                    return;
                }
                var element = state_or_region(this);
                if (element.sm.on_click) {
                    on_click = true;
                }
                popup_off = element.sm.popup_off;
                if (currently_panning || currently_pinching || currently_zooming || tooltip_up && on_click) {
                    return;
                }
                if (currently_over && !tooltip_manual) {
                    return false;
                }
                currently_over = this;
                if (!element) {
                    return;
                }
                labels_inactive(element);
                if (element.sm.inactive) {
                    return;
                }
                emphasize(element);
                over_hook(element);
                if (!on_click) {
                    tooltip.show(element);
                    element.stop();
                    if (vml && element.sm.type == "location" && element.sm.shape_type == "image") {
                        return;
                    }
                    if (!element.sm.ignore_hover) {
                        update_attr(element, "over");
                        highlight_labels(element, "over");
                        pulse(element);
                    }
                } else {
                    if (!tooltip_up) {
                        element.stop();
                        if (vml && element.sm.type == "location" && element.sm.shape_type == "image") {
                            return;
                        }
                        if (!element.sm.ignore_hover) {
                            update_attr(element, "over");
                            pulse(element);
                        }
                        highlight_labels(element, "over");
                    }
                }
            };
            var reset_appearance = function(element, callback) {
                    tooltip.hide();
                    if (is_adjacent(element)) {
                        if (!element.sm.ignore_hover) {
                            element.animate(element.sm.attributes, fade_time, whenDone);
                        }
                        element.animate(element.sm.adjacent_attributes, fade_time, whenDone);
                        highlight_labels(element, "out", true);
                    } else {
                        if (vml && element.sm.type == "location" && element.sm.shape_type == "image") {
                            return;
                        }
                        if (!element || !element.sm) {
                            return;
                        }
                        if (!element.sm.ignore_hover) {
                            if (element.sm.image) {
                                element.attr(element.sm.attributes);
                                whenDone();
                            } else {
                                element.animate(element.sm.attributes, fade_time, whenDone);
                            }
                        }
                        highlight_labels(element, "out");
                    }
                    function whenDone() {
                        if (helper.isFunction(callback)) {
                            callback();
                        }
                    }
                };
            out = function(force, callback) {
                if (!callback || typeof callback != "function") {
                    callback = false;
                }
                if (currently_zooming || no_tooltips) {
                    return;
                }
                if (!tooltip_up) {
                    on_click = false;
                }
                currently_over = false;
                if (!this.id && !this.type == "set") {
                    return;
                }
                var element = state_or_region(this);
                if (!element || element.sm.inactive) {
                    return;
                }
                out_hook(element);
                if (last_clicked) {
                    on_click = last_clicked.sm.on_click;
                }
                if (!on_click) {
                    tooltip.hide();
                    if (is_adjacent(element)) {
                        if (currently_zooming) {
                            return false;
                        }
                        if (!element.sm.ignore_hover) {
                            update_attr(element, "out", true);
                        }
                        update_attr(element, "adjacent", true);
                        highlight_labels(element, "out", true);
                    } else {
                        if (vml && element.sm.type == "location" && element.sm.shape_type == "image") {
                            return;
                        }
                        if (!element.sm.ignore_hover) {
                            update_attr(element, "out", true);
                        }
                        highlight_labels(element, "out");
                    }
                    if (callback) {
                        callback();
                    }
                } else {
                    if (!tooltip_up || force === true) {
                        reset_appearance(element, callback);
                        last_animated = element;
                    }
                }
            };
            click = function(e) {
                if (currently_zooming || currently_panning || currently_pinching) {
                    return;
                }
                var element = state_or_region(this);
                if (element.sm.inactive) {
                    return;
                }
                preclick_hook(element, e);
                if (api_object.ignore_clicks) {
                    return;
                }
                on_click = element.sm.on_click;
                if (e) {
                    if (tooltip_up && e.type == "touchend") {
                        return;
                    }
                    if (!tooltip_up && e.type == "touchstart") {
                        return;
                    }
                }
                if (on_click) {
                    tooltip.update_pos();
                }
                popup_off = element.sm.popup_off;
                if (element.sm.zoomable && (element.sm.type == "region" || last_destination != element || element.sm.type == "out")) {
                    zoomable_click_hook(element, e);
                    tooltip.hide();
                    tooltip_up = false;
                    if (last_clicked) {
                        out.call(last_clicked, true, function() {
                            zoom_to(element);
                        });
                    } else {
                        zoom_to(element);
                    }
                    last_clicked = element;
                } else if (!on_click) {
                    click_hook(element, e);
                    var link = element.sm.url;
                    if (link != "" && !no_urls) {
                        var js_url = link.substring(0, 10) == "javascript" ? true : false;
                        if (!new_tab || js_url) {
                            if (js_url) {
                                window.location.href = link;
                            } else {
                                window.top.location.href = link;
                            }
                            return;
                        } else {
                            window.open(link, "_blank");
                            tooltip.hide();
                            return;
                        }
                    }
                } else {
                    if (last_clicked != element && last_clicked) {
                        reset_appearance(last_clicked);
                    }
                    click_hook(element, e);
                    if (e) {
                        var coords = get_coordinates(e);
                        tooltip.pos(e, {
                            l: coords.x,
                            u: coords.y
                        });
                    }
                    tooltip.show(element);
                    tooltip_up = true;
                    highlight_labels(element, "over");
                    pulse(element);
                    if (vml && element.sm.type == "location" && element.sm.shape_type == "image") {} else {
                        if (!element.sm.ignore_hover) {
                            element.attr(element.sm.over_attributes);
                        }
                    }
                    last_clicked = element;
                    var close_image = document.getElementById("xpic_sm" + "_" + div);
                    if (close_image) {
                        close_image.onclick = function() {
                            tooltip.hide();
                            tooltip_up = false;
                            if (last_clicked.sm) {
                                out.call(last_clicked);
                            }
                            on_click = false;
                            trigger_hook("close_popup", []);
                        };
                    }
                }
            };
            back_click = function(callback) {
                if (typeof callback === "undefined") {
                    callback = false;
                }
                trigger_hook("back", []);
                if ((last_destination.sm.type == "out" || last_destination.sm.type == "region" && initial_zoom_solo) && initial_back) {
                    window.location.href = "javascript:" + initial_back;
                } else if (incremental && last_destination.sm.type == "state" && last_destination.sm.region) {
                    if (last_clicked) {
                        out.call(last_clicked, true, function() {
                            zoom_to(region_array[last_destination.sm.region]);
                        });
                    } else {
                        zoom_to(region_array[last_destination.sm.region], false, callback);
                    }
                } else {
                    var inside = is_inside(last_destination, region_array[initial_zoom]);
                    var region = last_destination.sm.type == "manual" && inside ? region_array[initial_zoom] : region_array[-1];
                    if (last_clicked) {
                        out.call(last_clicked, true, function() {
                            zoom_to(region);
                        });
                    } else {
                        zoom_to(region, false, callback);
                    }
                }
            };
            back_click_handler = function() {
                back_click();
            };
        }
        function get_coordinates(e) {
            if (e.touches) {
                var touch_obj = e.changedTouches ? e.changedTouches[0] : e.touches[0];
                return {
                    x: touch_obj.clientX,
                    y: touch_obj.clientY
                };
            } else {
                var y = ie ? e.clientY + document.documentElement.scrollTop : e.pageY;
                var x = ie ? e.clientX + document.documentElement.scrollLeft : e.pageX;
                return {
                    x: x,
                    y: y
                };
            }
        }
        function setup_panning() {
            background_click = function() {
                if (on_click) {
                    tooltip.hide();
                    if (last_clicked) {
                        reset_appearance(last_clicked);
                    }
                    tooltip_up = false;
                    on_click = false;
                }
            };

            function get_new_viewbox(e) {
                var coords = get_coordinates(e);
                var newX = coords.x;
                var newY = coords.y;
                dX = (startX - newX) * start.r;
                dY = (startY - newY) * start.r;
                var pan_threshold = 5 * start.r;
                if (Math.abs(dX) > pan_threshold || Math.abs(dY) > pan_threshold) {
                    currently_panning = true;
                }
                return {
                    x: start.x + dX,
                    y: start.y + dY,
                    w: start.w,
                    h: start.h,
                    r: start.r
                };
            }
            var mousedown = false;
            var start;
            var startX;
            var startY;

            function start_pan(e) {
                if (tooltip_up) {
                    return false;
                }
                e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                start = {
                    x: current_viewbox.x,
                    y: current_viewbox.y,
                    w: current_viewbox.w,
                    h: current_viewbox.h,
                    r: current_viewbox.w / original_width / scale
                };
                mousedown = true;
                var coords = get_coordinates(e);
                startX = coords.x;
                startY = coords.y;
                tooltip.hide();
                tooltip.pos(e, {
                    l: startX,
                    u: startY
                });
            }
            function during_pan(e) {
                if (!mousedown) {
                    return;
                }
                if (e.touches && e.touches.length > 1) {
                    return;
                }
                var v = get_new_viewbox(e);
                paper.setViewBox(v.x, v.y, v.w, v.h);
            }
            function finish_pan(e) {
                if (!mousedown || !currently_panning) {
                    currently_panning = false;
                    mousedown = false;
                    return;
                }
                var v = get_new_viewbox(e);
                paper.setViewBox(v.x, v.y, v.w, v.h);
                current_viewbox = v;
                last_destination = {
                    sm: {}
                };
                last_destination.sm.zooming_dimensions = current_viewbox;
                last_destination.sm.type = "manual";
                mousedown = false;
                setTimeout(function() {
                    currently_panning = false;
                }, 1);
                back_arrow.show();
            }
            helper.addEvent(mapdiv, "mousedown", start_pan);
            helper.addEvent(mapdiv, "mousemove", during_pan);
            helper.addEvent(mapdiv, "mouseup", finish_pan);
            helper.addEvent(mapdiv, "mouseleave", finish_pan);
            helper.addEvent(mapdiv, "touchstart", start_pan);
            helper.addEvent(mapdiv, "touchmove", during_pan);
            helper.addEvent(mapdiv, "touchend", finish_pan);
        }
        function setup_pinching() {
            var last_distance = false;

            function get_pinch_distance(e) {
                var xy0 = {
                    x: e.touches[0].pageX,
                    y: e.touches[0].pageY
                };
                var xy1 = {
                    x: e.touches[1].pageX,
                    y: e.touches[1].pageY
                };
                return helper.distance(xy0, xy1);
            }
            function move_pinch(e) {
                if (currently_zooming) {
                    return;
                }
                if (e.touches && e.touches.length > 1) {
                    currently_pinching = true;
                    var distance = get_pinch_distance(e);
                    if (last_distance) {
                        var diff = distance - last_distance;
                        var magnitude = Math.abs(diff);
                        if (magnitude > 10) {
                            if (diff > 0) {
                                zoom_in_click();
                            } else {
                                zoom_out_click();
                            }
                            last_distance = distance;
                        }
                    } else {
                        last_distance = distance;
                    }
                }
            }
            function finish_pinch(e) {
                last_distance = false;
                setTimeout(function() {
                    currently_pinching = false;
                }, 100);
            }
            helper.addEvent(mapdiv, "touchstart", move_pinch);
            helper.addEvent(mapdiv, "touchmove", move_pinch);
            helper.addEvent(mapdiv, "touchend", finish_pinch);
        }
        function order() {
            all_states.toBack();
            bottom_locations.toBack();
            background.toBack();
            if (all_external_lines) {
                all_external_lines.toFront();
            }
            all_labels.toFront();
            top_locations.toFront();
            location_labels.toFront();
        }
        function set_events(refresh) {
            if (!refresh) {
                all_states.hover(over, out);
                all_states.click(click);
                background.click(background_click);
                background.hover(reset_tooltip, reset_tooltip);
                back_arrow.click(back_click_handler);
                if (responsive) {
                    set_responsive_handler();
                }
                if (manual_zoom) {
                    all_states.touchstart(click);
                    all_states.touchend(click);
                    back_arrow.touchend(back_click);
                    setup_panning();
                    setup_pinching();
                }
            }
            all_locations.hover(over, out);
            all_locations.click(click);
            all_labels.hover(label_over, label_out);
            all_labels.click(label_click);
            if (manual_zoom) {
                all_locations.touchend(click);
                all_locations.touchstart(click);
                all_labels.touchend(label_click);
            }
        }
        var detect_resize;

        function set_responsive_handler() {
            function resize() {
                resize_paper();
            }
            var resizeTimer;
            detect_resize = function() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(resize, 300);
            };
            if (window.addEventListener) {
                window.addEventListener("resize", detect_resize, false);
                window.addEventListener("orientationchange", detect_resize, false);
            } else {
                window.attachEvent("resize", detect_resize, false);
                window.attachEvent("orientationchange", detect_resize, false);
            }
            if (vml) {
                document.body.onresize = function() {
                    resize();
                };
            }
        }
        function resize_paper() {
            if (mapdiv.offsetWidth < 1) {
                return;
            }
            create_dimensions(true);
            paper.setSize(width, height);
            var scaled_border_size = border_size * (width / original_width) * normalizing_factor * 1.25;
            if (all_states && all_locations) {
                all_states.forEach(function(state) {
                    state.attr({
                        'stroke-width': scaled_border_size
                    });
                    state.sm.attributes['stroke-width'] = scaled_border_size;
                    state.sm.over_attributes['stroke-width'] = state.sm.border_hover_size * (width / original_width) * normalizing_factor * 1.25;
                });
                all_locations.forEach(function(location) {
                    if (lattr[location.sm.id].type != "image") {
                        location.sm.attributes['stroke-width'] = lattr[location.sm.id].border * (width / original_width) * normalizing_factor * 1.25;
                        location.sm.over_attributes['stroke-width'] = lattr[location.sm.id].hover_border * (width / original_width) * normalizing_factor * 1.25;
                        location.attr({
                            'stroke-width': location.sm.attributes['stroke-width']
                        });
                    }
                });
                all_lines.forEach(function(line) {
                    var adj_line_size = line.sm.size * (width / original_width) * normalizing_factor * 1.25;
                    line.attr({
                        'stroke-width': adj_line_size
                    });
                });
                all_external_lines.forEach(function(line) {
                    var adj_line_size = line.sm.size * (width / original_width) * normalizing_factor * 1.25;
                    line.attr({
                        'stroke-width': adj_line_size
                    });
                });
            }
            create_trial_text();
            var min = width / 2 > 250 ? width / 2 : 250;
            max_width = popup_maxwidth ? popup_maxwidth : min;
        }
        function reveal_map(refresh) {
            var region_out = fly_in ? region_array[-2] : region_array[initial_zoom];
            var region = region_array[initial_zoom];
            if (!initial_back) {
                back_arrow.hide();
            }
            if (!refresh) {
                if (initial_zoom_state) {
                    var destination = initial_zoom_state;
                } else if (initial_zoom_manual) {
                    var destination = initial_zoom_manual;
                } else {
                    var destination = region_out;
                }
                var zoom_slowly = (initial_zoom_state || initial_zoom_manual) && fly_in ? false : true;
                zoom_to(destination, zoom_slowly);
            }
            if (initial_zoom_solo && initial_zoom != -1) {
                background.show();
                if (!initial_back) {
                    back_arrow.hide();
                }
                for (var i = 0; i < region.sm.states.length; i++) {
                    var id = region.sm.states[i];
                    var state = state_array[id];
                    if (!state.sm.hide) {
                        state.show();
                    }
                }
                for (var i in label_array) {
                    var label = label_array[i];
                    var label_set = label_set_array[i];
                    if (label.sm.parent) {
                        if (label.sm.parent.sm.type == "state") {
                            if (label.sm.parent.sm.region != region.sm.id || !label.sm.parent.sm.region) {
                                label.sm.hide = true;
                                label_set.hide();
                            }
                        }
                    }
                }
                all_external_lines.forEach(function(border) {
                    if (Raphael.isPointInsideBBox(region.sm.bbox, border.sm.bbox.x, border.sm.bbox.y)) {
                        border.show();
                    }
                });
                if (!refresh && fly_in) {
                    zoom_to(region_array[initial_zoom]);
                }
                return;
            }
            background.show();
            all_visible_states.show();
            all_visible_labels.show();
            all_external_lines.show();
            if (!refresh && fly_in && !(initial_zoom_state || initial_zoom_manual)) {
                zoom_to(region_array[initial_zoom]);
            }
        }
        function refresh_map(callback) {
            get_refreshable_info();
            set_attributes();
            create_states(true);
            create_regions(true);
            create_locations(true);
            create_labels();
            style_background();
            hide_and_show_before(last_destination, true);
            order();
            set_events(true);
            resize_paper();
            reveal_map(true);
            hide_and_show_after(last_destination);
            update_api();
            trigger_hook("refresh_complete", []);
            if (helper.isFunction(callback)) {
                callback();
            }
        }
        var tooltip;

        function load_map(callback) {
            mapdata = api_object.mapdata;
            mapinfo = api_object.mapinfo;
            if (map_inner) {
                delete window.paper;
            }
            expand_api();
            preload();
            get_client_info();
            get_map_info();
            if (is_forgery()) {
                alert("The continent map can't be used with other data.");
                return;
            }
            get_refreshable_info();
            create_dom_structure();
            create_dimensions();
            create_canvas();
            create_trial_text();
            if (!popup_nocss) {
                set_tt_css();
            }
            tooltip = create_tooltip();
            create_nav_buttons();
            set_attributes();
            style_background();
            create_states();
            create_regions();
            create_lines();
            setTimeout(function() {
                create_locations();
                create_labels();
                reset_all_region_attributes();
                order();
                create_event_handlers();
                set_events();
                reveal_map();
                tooltip.create();
                update_api();
                trigger_hook("complete", []);
                if (helper.isFunction(callback)) {
                    callback();
                }
                xy_hook_check();
            }, 1);
        }
        var getting_xy = false;
        var get_xy_from_map = function(log) {
                if (!getting_xy || log) {
                    getting_xy = true;
                } else {
                    return;
                }
                everything.mousedown(function(e, a, b) {
                    var l = ie ? event.clientX + document.documentElement.scrollLeft : e.pageX;
                    var u = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
                    var find_pos = helper.findPos(map_inner);
                    var x0 = find_pos[0];
                    var y0 = find_pos[1];
                    var go = last_destination.sm.zooming_dimensions;
                    var this_width = go.r * width / scale;
                    var this_height = go.r * height / scale;
                    var x = go.x / scale + this_width * (l - x0) / width;
                    var y = go.y / scale + this_height * (u - y0) / height;
                    x = Math.round(x * 100000) / 100000;
                    y = Math.round(y * 100000) / 100000;
                    var print_string = "You clicked on\nx: " + x + "," + "\ny: " + y + ",";
                    if (log) {
                        console.log(print_string);
                    }
                    trigger_hook("click_xy", [{
                        x: x,
                        y: y
                    }]);
                });
            };
        var log_xy = function() {
                get_xy_from_map(true);
            };
        var xy_hook_check = function() {
                if (hooks_object.click_xy || plugin_hooks.click_xy.length > 0) {
                    get_xy_from_map(false);
                }
            };
        var over_hook = function(element) {
                var type = element.sm.type;
                if (type == "state") {
                    trigger_hook("over_state", [element.sm.id]);
                }
                if (type == "location") {
                    trigger_hook("over_location", [element.sm.id]);
                }
                if (type == "region") {
                    trigger_hook("over_region", [element.sm.id]);
                }
            };
        var out_hook = function(element) {
                var type = element.sm.type;
                if (type == "state") {
                    trigger_hook("out_state", [element.sm.id]);
                }
                if (type == "location") {
                    trigger_hook("out_location", [element.sm.id]);
                }
                if (type == "region") {
                    trigger_hook("out_region", [element.sm.id]);
                }
            };
        var click_hook = function(element, e) {
                var type = element.sm.type;
                if (type == "state") {
                    trigger_hook("click_state", [element.sm.id, e]);
                }
                if (type == "region") {
                    trigger_hook("click_region", [element.sm.id, e]);
                }
                if (type == "location") {
                    trigger_hook("click_location", [element.sm.id, e]);
                }
            };
        var preclick_hook = function(element, e) {
                var type = element.sm.type;
                if (type == "state") {
                    trigger_hook("preclick_state", [element.sm.id, e]);
                }
                if (type == "region") {
                    trigger_hook("preclick_region", [element.sm.id, e]);
                }
                if (type == "location") {
                    trigger_hook("preclick_location", [element.sm.id, e]);
                }
            };
        var zoomable_click_hook = function(element, e) {
                var type = element.sm.type;
                if (type == "state") {
                    trigger_hook("zoomable_click_state", [element.sm.id, e]);
                }
                if (type == "region") {
                    trigger_hook("zoomable_click_region", [element.sm.id, e]);
                }
            };

        function region_zoom(id, callback) {
            var region = region_array[id];
            zoom_to(region, false, callback);
        }
        function state_zoom(id, callback) {
            var state = state_array[id];
            zoom_to(state, false, callback);
        }
        function location_zoom(id, zp, callback) {
            if (!manual_zoom) {
                console.log("Location zoom only works when the map is in manual_zoom mode.");
                return;
            }
            if (typeof zp === "undefined") {
                zp = 4;
            }
            if (typeof callback === "undefined") {
                callback = false;
            }
            var destination = {
                sm: {
                    type: "manual",
                    zp: zp
                }
            };
            var location = location_array[id];
            var w = location.sm.size * scale * zp;
            var h = w * original_height / original_width;
            var x = location.sm.x - w * 0.5;
            var y = location.sm.y - h * 0.5;
            var r = w / (original_width * scale);
            destination.sm.zooming_dimensions = {
                x: x,
                y: y,
                w: w,
                h: h,
                r: r
            };
            zoom_to(destination, false, callback);
        }
        function reset_tooltip() {
            if (currently_over) {
                out.call(currently_over);
            }
            if (!tooltip_manual) {
                return;
            } else {
                tooltip_manual = false;
            }
            if (on_click) {
                return;
            }
            tooltip.hide();
            setTimeout(function() {}, 100);
        }
        function popup(type, id) {
            if (type == "state") {
                var element = state_array[id];
            } else if (type == "region") {
                var element = region_array[id];
            } else {
                var element = location_array[id];
            }
            if (!element) {
                console.log(type + " " + id + " does not exist");
                return false;
            }
            var on_click = element.sm.on_click;
            var box = last_destination.sm.zooming_dimensions;
            if (type != "location") {
                var bb = element.sm.bbox;
                var x = (bb.x + bb.x2) * 0.5;
                var y = (bb.y + bb.y2) * 0.5;
                x = x * scale;
                y = y * scale;
            } else {
                var x = element.sm.x;
                var y = element.sm.y;
            }
            var current_x = (x - box.x) / ratio;
            var current_y = (y - box.y) / ratio;
            if (current_x > width * 1.1 || current_y > height * 1.1) {
                console.log("Not in this region");
                return false;
            }
            tooltip_manual = true;
            if (on_click) {
                click.call(element);
            } else {
                over.call(element);
            }
            tooltip.reset_pos(current_x, current_y, element);
            ignore_pos = true;
            tooltip_manual = false;
            return true;
        }
        function manual_pulse(id) {
            var el = location_array[id];
            if (!el) {
                return;
            }
            pulse(el, true);
        }
        function popup_hide() {
            tooltip.hide();
            tooltip_up = false;
            if (on_click) {
                out.call(last_clicked);
            } else {
                if (currently_over) {
                    out.call(currently_over);
                }
            }
        }
        function refresh_state(id, callback) {
            set_state(id);
            var state = state_array[id];
            var labels = state.sm.labels;
            make_state(id);
            for (var i = 0; i < labels.length; i++) {
                var label_id = labels[i].sm.id;
                set_label(label_id);
                make_label(label_id);
            }
            if (helper.isFunction(callback)) {
                callback();
            }
        }
        var no_tooltips = false;

        function disable_popups() {
            no_tooltips = true;
            tooltip.hide();
        }
        var no_tooltips = false;

        function enable_popups() {
            no_tooltips = false;
        }
        var no_urls = false;

        function disable_urls() {
            no_urls = true;
        }
        var no_urls = false;

        function enable_urls() {
            no_urls = false;
        }
        function go_back(callback) {
            back_click(callback);
        }
        function expand_api() {
            api_object.calibrate = create_bbox_state;
            api_object.get_xy = log_xy;
            api_object.proj = getxy;
            api_object.load = load_map;
            api_object.region_zoom = region_zoom;
            api_object.state_zoom = state_zoom;
            api_object.zoom_in = false;
            api_object.zoom_out = false;
            api_object.location_zoom = location_zoom;
            api_object.back = go_back;
            api_object.popup = popup;
            api_object.pulse = manual_pulse;
            api_object.popup_hide = popup_hide;
            api_object.zoom_level = "out";
            api_object.ignore_clicks = false;
            api_object.zoom_level_id = false;
            api_object.disable_urls = disable_urls;
            api_object.enable_urls = enable_urls;
            api_object.disable_popups = disable_popups;
            api_object.enable_popups = enable_popups;
            api_object.refresh = refresh_map;
            api_object.refresh_state = refresh_state;
            api_object.loaded = true;
        }
        function update_zoom_level() {
            api_object.zoom_level = last_destination.sm.type;
            api_object.zoom_level_id = last_destination.sm.id ? last_destination.sm.id : false;
        }
        function update_api() {
            api_object.states = state_array;
            api_object.regions = region_array;
            api_object.locations = location_array;
            api_object.labels = label_array;
            api_object.tooltip = tooltip;
        }
        expand_api();
        load_map();
    }
    window[plugin_name] = (function() {
        return api_object;
    })();
    dependencies.docReady(function() {
        trigger_hook("ready");
        if (window[plugin_name].loaded) {
            return;
        }
        for (var i = 0; i < autoload_array.length; i++) {
            var plugin = autoload_array[i];
            var ready_to_load = plugin && plugin.mapdata && plugin.mapdata.main_settings.auto_load != "no" ? true : false;
            if (ready_to_load) {
                (function(plugin) {
                    setTimeout(function() {
                        plugin.load();
                    }, 1);
                })(plugin);
            }
        }
    });
    autoload_array.push(api_object);
}) ("simplemaps_countrymap");