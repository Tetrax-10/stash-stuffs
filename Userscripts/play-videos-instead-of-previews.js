;(async () => {
    let observer

    async function waitForElement(selector, timeout = null, location = document.body) {
        return new Promise((resolve) => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector))
            }

            observer = new MutationObserver(async () => {
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
        observer?.disconnect()
        await waitForElement(".scene-card-preview-video", timeOut)

        const allPreviewElement = document.querySelectorAll(".scene-card-preview-video")
        allPreviewElement.forEach((element) => {
            element.src = element.src.replace("/preview", "/stream")
        })
    }

    let previousUrl = window.location.href
    new MutationObserver(async () => {
        if (window.location.href !== previousUrl) {
            previousUrl = window.location.href
            injectVideosAsPreview(5000)
        }
    }).observe(document.body, { subtree: true, childList: true })

    injectVideosAsPreview(60000)
})()
