export default () => {
    const baseURL = document.querySelector("base")?.getAttribute("href") ?? "/"

    class Logger {
        constructor(enabled) {
            this.enabled = enabled
        }
        debug() {
            if (!this.enabled) return
            console.debug(...arguments)
        }
    }

    async function callGQL(reqData) {
        const options = {
            method: "POST",
            body: JSON.stringify(reqData),
            headers: {
                "Content-Type": "application/json",
            },
        }

        try {
            const res = await window.fetch(baseURL + "graphql", options)
            return res.json()
        } catch (err) {
            console.error(err)
        }
    }

    function concatRegexp(reg, exp) {
        let flags = reg.flags + exp.flags
        flags = Array.from(new Set(flags.split(""))).join()
        return new RegExp(reg.source + exp.source, flags)
    }

    function matchUrl(href, fragment) {
        const regexp = concatRegexp(new RegExp(window.location.origin + baseURL), fragment)
        return href.match(regexp) != null
    }

    class Page extends EventTarget {
        constructor({ detectReRenders = true, logging = false } = {}) {
            super()
            this.log = new Logger(logging)
            this._detectReRenders = detectReRenders
            this._lastPathStr = ""
            this._lastQueryStr = ""
            this._lastHref = ""
            this._lastKey = ""
            this._lastStashPageEvent = ""
            this.waitForElement(this._detectReRenders ? ".main > div" : "html").then(() => {
                PluginApi.Event.addEventListener("stash:location", (event) => {
                    if (
                        this._lastPathStr !== location.pathname ||
                        this._lastHref !== location.href ||
                        this._lastKey !== event.detail?.data?.location?.key ||
                        this._lastQueryStr !== location.search ||
                        (!document.querySelector(".main > div[stashUserscriptLibrary]") && this._detectReRenders)
                    ) {
                        this._dispatchPageEvent("stash:page", false)

                        this._handlePageChange({
                            lastPathStr: this._lastPathStr,
                            lastQueryStr: this._lastQueryStr,
                            lastHref: this._lastHref,
                            lastKey: this._lastKey,
                            lastStashPageEvent: this._lastStashPageEvent,
                        })

                        this._lastPathStr = location.pathname
                        this._lastQueryStr = location.search
                        this._lastHref = location.href
                        this._lastKey = event.detail?.data?.location?.key

                        if (this._detectReRenders) {
                            this.waitForElement(".main > div", 10000).then((element) => {
                                if (element) element.setAttribute("stashUserscriptLibrary", "")
                            })
                        }
                    }
                })
            })
            this._pageListeners = {}
            this._initDefaultPageListeners()
        }
        async waitForElement(selector, timeout = null, location = document.body, disconnectOnPageChange = false) {
            return new Promise((resolve) => {
                if (document.querySelector(selector)) {
                    return resolve(document.querySelector(selector))
                }

                const observer = new MutationObserver(async () => {
                    if (document.querySelector(selector)) {
                        resolve(document.querySelector(selector))
                        observer.disconnect()
                    } else {
                        if (timeout) {
                            async function timeOver() {
                                return new Promise((resolve) => {
                                    setTimeout(() => {
                                        observer.disconnect()
                                        resolve(false)
                                    }, timeout)
                                })
                            }
                            resolve(await timeOver())
                        }
                    }
                })

                observer.observe(location, {
                    childList: true,
                    subtree: true,
                })

                if (disconnectOnPageChange) {
                    const tetraxUSL = this
                    function disconnect() {
                        resolve(false)
                        observer.disconnect()
                        tetraxUSL.removeEventListener("stash:page", disconnect)
                    }
                    tetraxUSL.addEventListener("stash:page", disconnect)
                }
            })
        }
        async waitForElementDeath(selector, location = document.body, disconnectOnPageChange = false) {
            return new Promise((resolve) => {
                const observer = new MutationObserver(async () => {
                    if (!document.querySelector(selector)) {
                        resolve(true)
                        observer.disconnect()
                    }
                })

                observer.observe(location, {
                    childList: true,
                    subtree: true,
                })

                if (disconnectOnPageChange) {
                    const tetraxUSL = this
                    function disconnect() {
                        resolve(false)
                        observer.disconnect()
                        tetraxUSL.removeEventListener("stash:page", disconnect)
                    }
                    tetraxUSL.addEventListener("stash:page", disconnect)
                }
            })
        }
        async _listenForNonPageChanges({
            selector = "",
            location = document.body,
            listenType = "",
            event = "",
            recursive = false,
            reRunHandlePageChange = false,
            listenDefaultTab = true,
            callback = () => {},
        } = {}) {
            if (recursive) return

            if (listenType === "tabs") {
                const tabsContainer = await this.waitForElement(selector, 10000, location, true)
                const tetraxUSL = this
                let previousEvent = ""

                function listenForTabClicks(domEvent) {
                    const clickedChild = domEvent.target ? domEvent.target : domEvent

                    if (!clickedChild.classList?.contains("nav-link")) return

                    const tagName = clickedChild.getAttribute("data-rb-event-key")
                    const parentEvent = tagName.split("-")[0]
                    const childEvent = tagName.split("-").slice(1, -1).join("-")

                    event = `stash:page:${parentEvent}:${childEvent}`

                    if (previousEvent === event) return
                    previousEvent = event

                    tetraxUSL._dispatchPageEvent(`stash:page:any:${childEvent}`, false)
                    tetraxUSL._dispatchPageEvent(event)
                }

                if (listenDefaultTab) listenForTabClicks(tabsContainer.querySelector(".nav-link.active"))

                tabsContainer.addEventListener("click", listenForTabClicks)

                function removeEventListenerOnPageChange() {
                    tabsContainer.removeEventListener("click", listenForTabClicks)
                    tetraxUSL.removeEventListener("stash:page", removeEventListenerOnPageChange)
                }
                tetraxUSL.addEventListener("stash:page", removeEventListenerOnPageChange)
            } else if (await this.waitForElement(selector, null, location, true)) {
                this._dispatchPageEvent(event)

                if (await this.waitForElementDeath(selector, location, true)) {
                    if (this._lastPathStr === window.location.pathname && reRunHandlePageChange) {
                        // triggered after home, performer, studio, tag's edit page close
                        this._handlePageChange({
                            recursive: true,
                            lastPathStr: this._lastPathStr,
                            lastQueryStr: this._lastQueryStr,
                            lastHref: this._lastHref,
                            lastKey: this._lastKey,
                            lastStashPageEvent: this._lastStashPageEvent,
                        })
                    }
                }
            }

            callback()
        }
        _dispatchPageEvent(event, addToHistory = true) {
            this.dispatchEvent(
                new CustomEvent(event, {
                    detail: {
                        event: event,
                        lastEventState: {
                            lastPathStr: this._lastPathStr,
                            lastQueryStr: this._lastQueryStr,
                            lastHref: this._lastHref,
                            lastKey: this._lastKey,
                            lastStashPageEvent: this._lastStashPageEvent,
                        },
                    },
                })
            )

            if (addToHistory) {
                this.log.debug(`[Navigation] ${event}`)
                if (event.startsWith("stash:")) {
                    this._lastStashPageEvent = event
                }
            }

            // if (event!=="stash:page" && !addToHistory) this.log.debug(`[Navigation] ${event}`); // log ":any:" events
        }
        addPageListener(eventData) {
            const { event, regex, callback = () => {}, manuallyHandleDispatchEvent = false } = eventData
            if (event && !event?.startsWith("stash:") && regex && this._pageListeners[event] === undefined) {
                this._pageListeners[event] = {
                    regex: regex,
                    callback: callback,
                    manuallyHandleDispatchEvent: manuallyHandleDispatchEvent,
                }

                return event
            } else {
                if (this._pageListeners[event] !== undefined) {
                    console.error(`Can't add page listener: Event ${event} already exists`)
                } else if (event?.startsWith("stash:")) {
                    console.error(`Can't add page listener: Event name can't start with "stash:"`)
                } else {
                    console.error(`Can't add page listener: Missing required argument(s) "event", "regex"`)
                }

                return false
            }
        }
        removePageListener(event) {
            if (event && !event?.startsWith("stash:") && this._pageListeners[event]) {
                delete this._pageListeners[event]
                return event
            } else {
                if (this._pageListeners[event] === undefined && event) {
                    console.error(`Can't remove page listener: Event ${event} doesn't exists`)
                } else if (event?.startsWith("stash:")) {
                    console.error(`Can't remove page listener: Event ${event} is a built in event`)
                } else {
                    console.error(`Can't remove page listener: Missing "event" argument`)
                }

                return false
            }
        }
        _initDefaultPageListeners() {
            this._pageListeners = {
                // scenes tab
                "stash:page:scenes": {
                    regex: /scenes\?/,
                    manuallyHandleDispatchEvent: true,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:scene:new": {
                    regex: /scenes\/new/,
                },
                "stash:page:scene": {
                    regex: /scenes\/\d+\?/,
                    callback: ({ recursive = false }) =>
                        this._listenForNonPageChanges({
                            selector: ".scene-tabs .nav-tabs",
                            listenType: "tabs",
                            recursive: recursive,
                        }),
                },

                // images tab
                "stash:page:images": {
                    regex: /images\?/,
                    handleDisplayView: true,
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:image": {
                    regex: /images\/\d+/,
                    callback: ({ recursive = false }) =>
                        this._listenForNonPageChanges({
                            selector: ".image-tabs .nav-tabs",
                            listenType: "tabs",
                            recursive: recursive,
                        }),
                },

                // movies tab
                "stash:page:movies": {
                    regex: /movies\?/,
                },
                "stash:page:movie": {
                    regex: /movies\/\d+/,
                },
                "stash:page:movie:scenes": {
                    regex: /movies\/\d+\?/,
                },

                // markers tab
                "stash:page:markers": {
                    regex: /scenes\/markers/,
                },

                // galleries tab
                "stash:page:galleries": {
                    regex: /galleries\?/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:gallery:new": {
                    regex: /galleries\/new/,
                },
                "stash:page:gallery:images": {
                    regex: /galleries\/\d+\?/,
                    manuallyHandleDispatchEvent: true,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    callback: ({ lastHref, lastPathStr, recursive = false, event }) => {
                        if (!matchUrl(lastHref, /\/galleries\/\d+\//) && lastPathStr !== window.location.pathname) {
                            this._dispatchPageEvent("stash:page:gallery")
                            this._listenForNonPageChanges({
                                selector: ".gallery-tabs .nav-tabs .nav-link.active",
                                event: "stash:page:gallery:details",
                                recursive: recursive,
                            })
                        }

                        this._dispatchPageEvent(event)

                        this._listenForNonPageChanges({
                            selector: ".gallery-tabs .nav-tabs",
                            listenType: "tabs",
                            recursive: recursive,
                            listenDefaultTab: false,
                        })
                    },
                },
                "stash:page:gallery:add": {
                    regex: /galleries\/\d+\/add/,
                    manuallyHandleDispatchEvent: true,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    callback: ({ lastHref, lastPathStr, recursive = false, event }) => {
                        if (!matchUrl(lastHref, /\/galleries\/\d+/) && lastPathStr !== window.location.pathname) {
                            this._dispatchPageEvent("stash:page:gallery")
                            this._listenForNonPageChanges({
                                selector: ".gallery-tabs .nav-tabs .nav-link.active",
                                event: "stash:page:gallery:details",
                                recursive: recursive,
                            })
                        }

                        this._dispatchPageEvent(event)

                        this._listenForNonPageChanges({
                            selector: ".gallery-tabs .nav-tabs",
                            listenType: "tabs",
                            recursive: recursive,
                            listenDefaultTab: false,
                        })
                    },
                },

                // performers tab
                "stash:page:performers": {
                    regex: /performers\?/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex) || this._detectReRenders) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:performer:new": {
                    regex: /performers\/new/,
                },
                "stash:page:performer": {
                    regex: /performers\/\d+/,
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }

                        this._listenForNonPageChanges({
                            selector: "#performer-edit",
                            event: "stash:page:performer:edit",
                            reRunHandlePageChange: true,
                            callback: () => (this._detectReRenders ? this._dispatchPageEvent(event) : null),
                        })
                    },
                },
                "stash:page:performer:scenes": {
                    regex: /performers\/\d+\?/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:performer:galleries": {
                    regex: /performers\/\d+\/galleries/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:performer:images": {
                    regex: /performers\/\d+\/images/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:performer:movies": {
                    regex: /performers\/\d+\/movies/,
                },
                "stash:page:performer:appearswith": {
                    regex: /performers\/\d+\/appearswith/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },

                // studios tab
                "stash:page:studios": {
                    regex: /studios\?/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:studio:new": {
                    regex: /studios\/new/,
                },
                "stash:page:studio": {
                    regex: /studios\/\d+/,
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }

                        this._listenForNonPageChanges({
                            selector: "#studio-edit",
                            event: "stash:page:studio:edit",
                            reRunHandlePageChange: true,
                            callback: () => (this._detectReRenders ? this._dispatchPageEvent(event) : null),
                        })
                    },
                },
                "stash:page:studio:scenes": {
                    regex: /studios\/\d+\?/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:studio:galleries": {
                    regex: /studios\/\d+\/galleries/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:studio:images": {
                    regex: /studios\/\d+\/images/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:studio:performers": {
                    regex: /studios\/\d+\/performers/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:studio:movies": {
                    regex: /studios\/\d+\/movies/,
                },
                "stash:page:studio:childstudios": {
                    regex: /studios\/\d+\/childstudios/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },

                // tags tab
                "stash:page:tags": {
                    regex: /tags\?/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:tag:new": {
                    regex: /tags\/new/,
                },
                "stash:page:tag": {
                    regex: /tags\/\d+/,
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }

                        this._listenForNonPageChanges({
                            selector: "#tag-edit",
                            event: "stash:page:tag:edit",
                            reRunHandlePageChange: true,
                            callback: () => (this._detectReRenders ? this._dispatchPageEvent(event) : null),
                        })
                    },
                },
                "stash:page:tag:scenes": {
                    regex: /tags\/\d+\?/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:tag:galleries": {
                    regex: /tags\/\d+\/galleries/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:tag:images": {
                    regex: /tags\/\d+\/images/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:tag:markers": {
                    regex: /tags\/\d+\/markers/,
                },
                "stash:page:tag:performers": {
                    regex: /tags\/\d+\/performers/,
                    handleDisplayView: "ignoreDisplayViewCondition",
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },

                // settings page
                "stash:page:settings": {
                    regex: /settings/,
                    manuallyHandleDispatchEvent: true,
                    callback: ({ lastHref, event, regex }) => {
                        if (!matchUrl(lastHref, regex)) {
                            this._dispatchPageEvent(event)
                        }
                    },
                },
                "stash:page:settings:tasks": {
                    regex: /settings\?tab=tasks/,
                },
                "stash:page:settings:library": {
                    regex: /settings\?tab=library/,
                },
                "stash:page:settings:interface": {
                    regex: /settings\?tab=interface/,
                },
                "stash:page:settings:security": {
                    regex: /settings\?tab=security/,
                },
                "stash:page:settings:metadata-providers": {
                    regex: /settings\?tab=metadata-providers/,
                },
                "stash:page:settings:services": {
                    regex: /settings\?tab=services/,
                },
                "stash:page:settings:system": {
                    regex: /settings\?tab=system/,
                },
                "stash:page:settings:plugins": {
                    regex: /settings\?tab=plugins/,
                },
                "stash:page:settings:logs": {
                    regex: /settings\?tab=logs/,
                },
                "stash:page:settings:tools": {
                    regex: /settings\?tab=tools/,
                },
                "stash:page:settings:changelog": {
                    regex: /settings\?tab=changelog/,
                },
                "stash:page:settings:about": {
                    regex: /settings\?tab=about/,
                },

                // stats page
                "stash:page:stats": {
                    regex: /stats/,
                },

                // home page
                "stash:page:home": {
                    regex: /$/,
                    callback: () =>
                        this._listenForNonPageChanges({
                            selector: ".recommendations-container-edit",
                            event: "stash:page:home:edit",
                            reRunHandlePageChange: true,
                        }),
                },
            }
        }
        _handlePageChange(args) {
            const events = Object.keys(this._pageListeners)

            for (const event of events) {
                const { regex, callback = () => {}, manuallyHandleDispatchEvent = false, handleDisplayView = false } = this._pageListeners[event]

                let isDisplayViewPage = false
                let isGridPage, isListPage, isWallPage, isTaggerPage

                const splitEvent = event.split(":")
                const tabPage = { page: "", tab: "" }
                let childAnyEventCondition = false

                if (splitEvent.length === 4) {
                    childAnyEventCondition = true
                    tabPage.page = splitEvent[2]
                    tabPage.tab = splitEvent[3]
                }

                splitEvent.pop()

                if (handleDisplayView) {
                    isGridPage = matchUrl(window.location.href, concatRegexp(regex, /(?!.*disp=)/))
                    isListPage = matchUrl(window.location.href, concatRegexp(regex, /.*disp=1/))
                    isWallPage = matchUrl(window.location.href, concatRegexp(regex, /.*disp=2/))
                    isTaggerPage = matchUrl(window.location.href, concatRegexp(regex, /.*disp=3/))

                    if (isListPage || isWallPage || isTaggerPage) isDisplayViewPage = true
                }

                function dispatchViewEvent(view, tetraxUSL) {
                    tetraxUSL._dispatchPageEvent(event + `:${view}`)
                    if (childAnyEventCondition) {
                        tetraxUSL._dispatchPageEvent("stash:page:" + tabPage.page + `:any:${view}`, false)
                        tetraxUSL._dispatchPageEvent("stash:page:any:" + tabPage.tab + `:${view}`, false)
                    } else {
                        tetraxUSL._dispatchPageEvent(`stash:page:any:${view}`, false)
                    }
                }

                const handleDisplayViewCondition = handleDisplayView !== true || (handleDisplayView && (!isDisplayViewPage || args.lastHref === ""))

                if (matchUrl(window.location.href, regex) && handleDisplayViewCondition) {
                    if (!manuallyHandleDispatchEvent) this._dispatchPageEvent(event)
                    callback({
                        ...args,
                        location: window.location,
                        event: event,
                        regex: regex,
                    })

                    if (isGridPage) dispatchViewEvent("grid", this)
                }

                if (handleDisplayView) {
                    let view = ""
                    switch (true) {
                        case isListPage:
                            view = "list"
                            break
                        case isWallPage:
                            view = "wall"
                            break
                        case isTaggerPage:
                            view = "tagger"
                            break
                    }
                    if (view) dispatchViewEvent(view, this)
                }
            }
        }
        addEventListeners(events, callback, ...options) {
            events.forEach((event) => {
                this.addEventListener(event, callback, ...options)
            })
        }
    }

    window.tetraxUSL = {
        page: new Page({ detectReRenders: true, logging: false }),
        utils: {
            callGQL: callGQL,
        },
    }
}
