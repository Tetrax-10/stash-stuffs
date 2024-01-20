;(async () => {
    while (!window.TetraxUSL?.stash) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const Stash = window.TetraxUSL.stash
    const Utils = window.TetraxUSL.utils

    async function selectUpdatableItems() {
        await Utils.ui.waitForElement(".package-update-available .form-check > input", 10000)

        const updatableItems = document.querySelectorAll(".package-update-available .form-check > input")
        const tableBody = document.querySelector(".installed-packages tbody")
        const updatableElements = []

        updatableItems.forEach((element) => {
            const tr = element.closest("tr")
            updatableElements.push(tr)
            element.click()
        })

        updatableElements.reverse().forEach((updatableElement) => {
            tableBody.insertBefore(updatableElement, tableBody.firstChild)
        })
    }

    /////////////////////////////// Main ///////////////////////////////

    if (await Utils.ui.waitForElement(".main > div", 5000)) {
        let previousUrl = window.location.href
        setInterval(async () => {
            if (!document.querySelector(".main > div[AutoSelectUpdatablePlugins]") || window.location.href !== previousUrl) {
                document.querySelector(".main > div").setAttribute("AutoSelectUpdatablePlugins", "")
                previousUrl = window.location.href

                if (Stash.matchUrl(window.location, /\/settings\?tab=metadata-providers/) || Stash.matchUrl(window.location, /\/settings\?tab=plugins/)) {
                    const checkForUpdatesButton = await Utils.ui.waitForElement(".installed-packages .btn.btn-primary", 3000)
                    if (checkForUpdatesButton) {
                        checkForUpdatesButton.addEventListener("click", () => {
                            selectUpdatableItems()
                        })
                    }
                }
            }
        }, 100)
    }
})()
