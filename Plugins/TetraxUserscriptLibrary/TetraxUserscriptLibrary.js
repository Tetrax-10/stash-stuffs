window.TetraxUSL = (() => {
    function concatRegexp(reg, exp) {
        let flags = reg.flags + exp.flags
        flags = Array.from(new Set(flags.split(""))).join()
        return new RegExp(reg.source + exp.source, flags)
    }

    function matchUrl(location, fragment) {
        const regexp = concatRegexp(new RegExp(location.origin), fragment)
        return location.href.match(regexp) != null
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
            const res = await window.fetch("/graphql", options)
            return res.json()
        } catch (err) {
            console.error(err)
        }
    }

    async function getInstalledPlugins() {
        try {
            const res = await callGQL({
                operationName: "Plugins",
                variables: {},
                query: `query Plugins{plugins{id}}`,
            })

            return res.data.plugins.map((plugin) => plugin.id)
        } catch (err) {
            console.error(err)
        }
    }

    async function isPluginInstalled(plugin) {
        const installedPlugins = await getInstalledPlugins()
        return installedPlugins.includes(plugin)
    }

    async function waitForElement(selector, timeout = null, location = document.body) {
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
        })
    }

    return {
        stash: {
            concatRegexp: concatRegexp,
            matchUrl: matchUrl,
            callGQL: callGQL,
            get: {
                plugins: {
                    installed: getInstalledPlugins,
                },
            },
        },
        utils: {
            ui: {
                waitForElement: waitForElement,
            },
            plugins: {
                isInstalled: isPluginInstalled,
            },
        },
    }
})()
