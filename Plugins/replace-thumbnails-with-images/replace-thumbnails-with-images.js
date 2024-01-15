;(async () => {
    while (!window.TetraxUSL.stash) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const Stash = window.TetraxUSL.stash
    const Utils = window.TetraxUSL.utils

    async function replaceThumbnailsWithImages(timeOut, className) {
        await Utils.ui.waitForElement(className, timeOut)

        const allThumbnailElement = document.querySelectorAll(className)
        allThumbnailElement.forEach((element) => {
            element.src = element.src.replace("/thumbnail", "/image")
        })
    }

    /////////////////////////////// Main ///////////////////////////////

    if (await Utils.ui.waitForElement(".main > div", 5000)) {
        let previousUrl = window.location.href
        setInterval(() => {
            if (!document.querySelector(".main > div[replaceThumbnailsWithImages]") || window.location.href !== previousUrl) {
                document.querySelector(".main > div").setAttribute("replaceThumbnailsWithImages", "")
                previousUrl = window.location.href

                if (
                    Stash.matchUrl(window.location, /\/images\?/) ||
                    Stash.matchUrl(window.location, /\/galleries\/\d+\?/) ||
                    Stash.matchUrl(window.location, /\/galleries\/\d+\/add/) ||
                    Stash.matchUrl(window.location, /\/performers\/\d+\/images/) ||
                    Stash.matchUrl(window.location, /\/$/)
                ) {
                    replaceThumbnailsWithImages(5000, ".image-card-preview-image")
                } else if (Stash.matchUrl(window.location, /\/galleries\?/) || Stash.matchUrl(window.location, /\/performers\/\d+\/galleries/) || Stash.matchUrl(window.location, /\/$/)) {
                    replaceThumbnailsWithImages(5000, ".gallery-card-image")
                }
            }
        }, 100)
    }
})()
