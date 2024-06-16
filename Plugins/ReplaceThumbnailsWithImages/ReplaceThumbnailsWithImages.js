export default async () => {
    while (!window.tetraxUSL?.page) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    async function replaceThumbnailsWithImages(timeOut, className) {
        await tetraxUSL.page.waitForElement(className, timeOut, document.body, true)

        const allThumbnailElement = document.querySelectorAll(className)
        allThumbnailElement.forEach((element) => {
            element.src = element.src.replace("/thumbnail", "/image")
        })
    }

    tetraxUSL.page.addEventListeners(["stash:page:images:grid", "stash:page:any:images:grid", "stash:page:gallery", "stash:page:gallery:add", "stash:page:home"], () => {
        replaceThumbnailsWithImages(5000, ".image-card-preview-image")
    })
    tetraxUSL.page.addEventListeners(["stash:page:galleries:grid", "stash:page:any:galleries:grid", "stash:page:home"], () => {
        replaceThumbnailsWithImages(5000, ".gallery-card-image")
    })
    tetraxUSL.page.addEventListeners(["stash:page:galleries:list", "stash:page:any:galleries:list"], () => {
        replaceThumbnailsWithImages(5000, ".w-100.w-sm-auto")
    })
}
