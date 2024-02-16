export default async () => {
    while (!window.stash) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    async function injectVideosAsPreview(timeOut) {
        await stash.waitForElement(".scene-card-preview-video", timeOut, document.body, true)

        const allPreviewElement = document.querySelectorAll(".scene-card-preview-video")
        allPreviewElement.forEach((element) => {
            fetch(element.src).then((res) => {
                if (res.status !== 200) {
                    element.src = element.src.replace("/preview", "/stream")
                }
            })
        })
    }

    stash.addEventListeners(["stash:page:scenes:grid", "stash:page:any:scenes:grid"], () => {
        injectVideosAsPreview(5000)
    })
}
