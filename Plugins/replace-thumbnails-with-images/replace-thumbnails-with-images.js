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

    async function replaceThumbnailsWithImages(timeOut, className) {
        await waitForElement(className, timeOut)

        const allThumbnailElement = document.querySelectorAll(className)
        allThumbnailElement.forEach((element) => {
            element.src = element.src.replace("/thumbnail", "/image")
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
                if (!document.querySelector(".main > div[replaceThumbnailsWithImages]") || window.location.href !== previousUrl) {
                    document.querySelector(".main > div").setAttribute("replaceThumbnailsWithImages", "")
                    previousUrl = window.location.href

                    if (
                        stash.matchUrl(window.location, /\/images\?/) ||
                        stash.matchUrl(window.location, /\/galleries\/\d+\?/) ||
                        stash.matchUrl(window.location, /\/galleries\/\d+\/add/) ||
                        stash.matchUrl(window.location, /\/performers\/\d+\/images/)
                    ) {
                        replaceThumbnailsWithImages(5000, ".image-card-preview-image")
                    } else if (stash.matchUrl(window.location, /\/galleries\?/) || stash.matchUrl(window.location, /\/performers\/\d+\/galleries/)) {
                        replaceThumbnailsWithImages(5000, ".gallery-card-image")
                    }
                }
            }, 100)
        }
    })()
})()
