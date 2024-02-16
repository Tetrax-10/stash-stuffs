export default async () => {
    while (!window.stash) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    async function selectUpdatableItems() {
        await stash.waitForElement(".package-update-available .form-check > input", 10000, document.body, true)

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

    stash.addEventListeners(["stash:page:settings:metadata-providers", "stash:page:settings:plugins"], async () => {
        const checkForUpdatesButton = await stash.waitForElement(".installed-packages .btn.btn-primary", 3000, document.body, true)
        if (checkForUpdatesButton) {
            checkForUpdatesButton.addEventListener("click", () => {
                selectUpdatableItems()
            })
        }
    })
}
