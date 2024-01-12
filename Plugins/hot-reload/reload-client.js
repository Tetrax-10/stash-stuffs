;(() => {
    let socket

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

    socket = new WebSocket("ws://localhost:8082")

    socket.onerror = () => {
        log("Hot Reload server offline", "blue")
    }

    let isServerEstablished = false

    socket.addEventListener("open", () => {
        isServerEstablished = true
    })

    socket.addEventListener("close", () => {
        if (isServerEstablished) {
            log("Hot Reload server connection lost!", "red")
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
            case "reconnected":
                log("Reconnected to Hot Reload server", "green")
                break
        }
    }
})()
