export default async () => {
    while (!window.tetraxUSL?.utils) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    function isDateLater(dateString1, dateString2) {
        const date1 = new Date(dateString1)
        const date2 = new Date(dateString2)
        return date2 > date1
    }

    async function getUpdateablePlugins() {
        try {
            const pluginsStatus = await tetraxUSL.utils.callGQL({
                operationName: "InstalledPluginPackagesStatus",
                variables: {},
                query: `
                query InstalledPluginPackagesStatus {
                    installedPackages(type: Plugin) {
                      ...PackageData
                      source_package {
                        ...PackageData
                        __typename
                      }
                      __typename
                    }
                  }
                  
                  fragment PackageData on Package {
                    package_id
                    name
                    version
                    date
                    metadata
                    sourceURL
                    __typename
                  }`,
            })

            return pluginsStatus.data.installedPackages
                .filter((plugin) => isDateLater(plugin.date, plugin.source_package?.date))
                .map((plugin) => {
                    return { id: plugin.package_id, sourceURL: plugin.sourceURL }
                })
        } catch (err) {
            console.error(err)
        }
    }

    async function updatePlugins(packages) {
        try {
            await tetraxUSL.utils.callGQL({
                operationName: "UpdatePluginPackages",
                variables: {
                    packages: packages,
                },
                query: `
                mutation UpdatePluginPackages($packages: [PackageSpecInput!]!) {
                    updatePackages(type: Plugin, packages: $packages)
                  }`,
            })
        } catch (err) {
            console.error(err)
        }
    }

    async function getUpdateableScrapers() {
        try {
            const scraperStatus = await tetraxUSL.utils.callGQL({
                operationName: "InstalledScraperPackagesStatus",
                variables: {},
                query: `
                query InstalledScraperPackagesStatus {
                    installedPackages(type: Scraper) {
                      ...PackageData
                      source_package {
                        ...PackageData
                        __typename
                      }
                      __typename
                    }
                  }
                  
                  fragment PackageData on Package {
                    package_id
                    name
                    version
                    date
                    metadata
                    sourceURL
                    __typename
                  }`,
            })

            return scraperStatus.data.installedPackages
                .filter((scraper) => isDateLater(scraper.date, scraper.source_package?.date))
                .map((scraper) => {
                    return { id: scraper.package_id, sourceURL: scraper.sourceURL }
                })
        } catch (err) {
            console.error(err)
        }
    }

    async function updateScrapers(packages) {
        try {
            await tetraxUSL.utils.callGQL({
                operationName: "UpdateScraperPackages",
                variables: {
                    packages: packages,
                },
                query: `
                mutation UpdateScraperPackages($packages: [PackageSpecInput!]!) {
                    updatePackages(type: Scraper, packages: $packages)
                  }`,
            })
        } catch (err) {
            console.error(err)
        }
    }

    const updateablePlugins = await getUpdateablePlugins()
    if (updateablePlugins.length) await updatePlugins(updateablePlugins)

    const updateableScrapers = await getUpdateableScrapers()
    if (updateableScrapers.length) await updateScrapers(updateableScrapers)
}
