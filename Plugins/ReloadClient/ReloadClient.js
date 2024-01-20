;(() => {
    let socket

    const state = {
        connected: false,
    }

    function log(text, color) {
        const colors = {
            blue: "#61AFEF",
            green: "#59CE8F",
            red: "#D21312",
        }

        if (colors[color]) {
            console.log(`%c${text}`, `color: ${colors[color]}`)
        } else {
            console.log(text)
        }
    }

    socket = new WebSocket(`ws://${window.location.hostname}:8082`)

    socket.onerror = () => {
        log("Reload Server offline", "blue")
    }

    socket.addEventListener("open", () => {
        state.connected = true
    })

    socket.addEventListener("close", () => {
        if (state.connected) {
            log("Reload Client lost connection to the Reload Server!", "red")
            state.connected = false
        }
    })

    socket.onmessage = (event) => {
        switch (event.data) {
            case "reload":
                window.location.reload()
                break
            case "connected":
                log("Watching for changes...", "green")
                break
        }
    }
})()
