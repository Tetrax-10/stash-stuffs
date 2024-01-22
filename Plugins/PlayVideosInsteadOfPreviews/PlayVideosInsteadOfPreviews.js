;(async () => {
    while (!window.TetraxUSL?.stash) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const Stash = window.TetraxUSL.stash

    async function injectVideosAsPreview(timeOut) {
        await Stash.waitForElement(".scene-card-preview-video", timeOut, document.body, true)

        const allPreviewElement = document.querySelectorAll(".scene-card-preview-video")
        allPreviewElement.forEach((element) => {
            element.src = element.src.replace("/preview", "/stream")
        })
    }

    Stash.addPageListener({
        event: "tetrax:page:any:scenes:grid",
        regex: /\/[^\/]+\/\d+\?(?!.*disp=)/,
    })

    Stash.addEventListeners(["stash:page:scenes", "tetrax:page:any:scenes:grid"], (e) => {
        injectVideosAsPreview(5000)
    })
})()
