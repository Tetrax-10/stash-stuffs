;(async function installStashUserscriptLibrary() {
    const LocalTetraxUSL = (() => {
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

        async function installPlugin(plugin, src = "https://stashapp.github.io/CommunityScripts/stable/index.yml") {
            try {
                await callGQL({
                    operationName: "InstallPluginPackages",
                    variables: {
                        packages: [
                            {
                                id: plugin,
                                sourceURL: src,
                            },
                        ],
                    },
                    query: "mutation InstallPluginPackages($packages: [PackageSpecInput!]!) {installPackages(type: Plugin, packages: $packages)}",
                })
            } catch (err) {
                console.error(err)
            }
        }

        return {
            utils: {
                plugins: {
                    getInstalled: getInstalledPlugins,
                    isInstalled: isPluginInstalled,
                    install: installPlugin,
                },
            },
        }
    })()

    const isStashUSLInstalled = await LocalTetraxUSL.utils.plugins.isInstalled("StashUserscriptLibrary")

    if (!isStashUSLInstalled) {
        await LocalTetraxUSL.utils.plugins.install("StashUserscriptLibrary")

        setTimeout(() => {
            window.location.reload()
        }, 3000)
    } else {
        while (!window.stash) {
            await new Promise((resolve) => setTimeout(resolve, 100))
        }

        window.TetraxUSL = LocalTetraxUSL
        window.TetraxUSL.stash = new Stash({ detectReRenders: true })
    }
})()
