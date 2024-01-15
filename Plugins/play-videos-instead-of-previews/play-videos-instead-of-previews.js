;(async () => {
    while (!window.TetraxUSL.stash) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const Stash = window.TetraxUSL.stash
    const Utils = window.TetraxUSL.utils

    async function injectVideosAsPreview(timeOut) {
        await Utils.ui.waitForElement(".scene-card-preview-video", timeOut)

        const allPreviewElement = document.querySelectorAll(".scene-card-preview-video")
        allPreviewElement.forEach((element) => {
            element.src = element.src.replace("/preview", "/stream")
        })
    }

    /////////////////////////////// Main ///////////////////////////////

    if (await Utils.ui.waitForElement(".main > div", 5000)) {
        let previousUrl = window.location.href
        setInterval(() => {
            if (!document.querySelector(".main > div[playVideosInsteadOfPreviews]") || window.location.href !== previousUrl) {
                document.querySelector(".main > div").setAttribute("playVideosInsteadOfPreviews", "")
                previousUrl = window.location.href

                if (
                    Stash.matchUrl(window.location, /\/scenes\?/) ||
                    Stash.matchUrl(window.location, /\/performers\/\d+\?/) ||
                    Stash.matchUrl(window.location, /\/studios\/\d+\?/) ||
                    Stash.matchUrl(window.location, /\/tags\/\d+\?/) ||
                    Stash.matchUrl(window.location, /\/$/)
                ) {
                    injectVideosAsPreview(5000)
                }
            }
        }, 100)
    }
})()
