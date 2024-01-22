;(async () => {
    while (!window.TetraxUSL?.stash) {
        await new Promise((resolve) => setTimeout(resolve, 100))
    }

    const Stash = window.TetraxUSL.stash

    async function replaceThumbnailsWithImages(timeOut, className) {
        await Stash.waitForElement(className, timeOut, document.body, true)

        const allThumbnailElement = document.querySelectorAll(className)
        allThumbnailElement.forEach((element) => {
            element.src = element.src.replace("/thumbnail", "/image")
        })
    }

    Stash.addPageListener({
        event: "tetrax:page:any:images:grid",
        regex: /\/[^\/]+\/\d+\/images(?!.*disp=)/,
    })
    Stash.addPageListener({
        event: "tetrax:page:any:galleries:grid",
        regex: /\/[^\/]+\/\d+\/galleries(?!.*disp=)/,
    })
    Stash.addPageListener({
        // disp=1
        event: "tetrax:page:any:galleries:list",
        regex: /\/[^\/]+\/\d+\/galleries.*disp=1/,
    })

    Stash.addEventListeners(["stash:page:images", "stash:page:gallery", "stash:page:gallery:add", "stash:page:home", "tetrax:page:any:images:grid"], (e) => {
        replaceThumbnailsWithImages(5000, ".image-card-preview-image")
    })
    Stash.addEventListeners(["stash:page:galleries", "stash:page:home", "tetrax:page:any:galleries:grid"], () => {
        replaceThumbnailsWithImages(5000, ".gallery-card-image")
    })
    Stash.addEventListeners(["stash:page:galleries:list", "tetrax:page:any:galleries:list"], () => {
        replaceThumbnailsWithImages(5000, ".w-100.w-sm-auto")
    })
})()
