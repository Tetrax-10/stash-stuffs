;(async () => {
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

    async function injectVideosAsPreview(timeOut) {
        await waitForElement(".scene-card-preview-video", timeOut)

        const allPreviewElement = document.querySelectorAll(".scene-card-preview-video")
        allPreviewElement.forEach((element) => {
            element.src = element.src.replace("/preview", "/stream")
        })
    }

    /////////////////////////////// Main ///////////////////////////////

    ;(async function main() {
        if (!window.stash) {
            setTimeout(main, 300)
            return
        }

        if (await waitForElement(".main > div", 5000)) {
            let previousUrl = window.location.href
            setInterval(() => {
                if (!document.querySelector(".main > div[playVideosInsteadOfPreviews]") || window.location.href !== previousUrl) {
                    document.querySelector(".main > div").setAttribute("playVideosInsteadOfPreviews", "")
                    previousUrl = window.location.href

                    if (
                        stash.matchUrl(window.location, /\/scenes\?/) ||
                        stash.matchUrl(window.location, /\/performers\/\d+\?/) ||
                        stash.matchUrl(window.location, /\/studios\/\d+\?/) ||
                        stash.matchUrl(window.location, /\/tags\/\d+\?/) ||
                        stash.matchUrl(window.location, /\/$/)
                    ) {
                        injectVideosAsPreview(5000)
                    }
                }
            }, 100)
        }
    })()
})()
