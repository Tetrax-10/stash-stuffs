import { WebSocketServer } from "ws"
import chokidar from "chokidar"
import { exec } from "child_process"
import path from "path"

const server = new WebSocketServer({ port: 8082 })
const [type, mode] = process.argv.pop().slice(2).split(":")
const itemsToWatch = []
const itemsToIgnore = []

let socket

const config = {
    reloadDelay: 0,
    logUpdatedFile: true,
}

const state = {
    connected: false,
}

function log(text, color) {
    const colors = {
        blue: "\x1b[94m",
        green: "\x1b[92m",
        red: "\x1b[91m",
        reset: "\x1b[0m",
    }

    if (colors[color]) {
        console.log(`${colors[color]}${text}${colors.reset}`)
    } else {
        console.log(text)
    }
}

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout) => {
            if (error) {
                reject(error)
                return
            }
            resolve(stdout.trim())
        })
    })
}

async function buildAndReload(buildType = type, filePath = "") {
    if (buildType === "Plugins" || buildType === "All") {
        await runCommand("npm run build-plugin-local")
        log(`Plugin built${config.logUpdatedFile && filePath ? ": " + filePath : " successfully"}`, "blue")
    }
    if (buildType === "Themes" || buildType === "All") {
        if (mode === "personal") {
            await runCommand("npm run build-personal-theme-local")
        } else {
            await runCommand("npm run build-theme-local")
        }
        log(`Theme built${config.logUpdatedFile && filePath ? ": " + filePath : " successfully"}`, "blue")
    }
}

await buildAndReload()

log("\nReload stash website to connect to the Reload Server\n", "blue")

if (type === "Plugins" || type === "All") {
    itemsToWatch.push("Plugins")
    itemsToIgnore.push("Plugins/ReloadClient/ReloadServer.js")
}
if (type === "Themes" || type === "All") {
    itemsToWatch.push("Themes")
    if (mode === "personal") {
        itemsToIgnore.push("Themes/**/main.scss")
    } else {
        itemsToIgnore.push("Themes/**/personal/**", "Themes/**/main-personal.scss")
    }
}

server.on("connection", (soc) => {
    socket = soc

    if (!state.connected) log("Reload Server connected to the Reload Client", "green")
    state.connected = true

    soc.send("connected")
})

chokidar
    .watch(itemsToWatch, {
        ignored: itemsToIgnore,
    })
    .on("change", (filePath) => {
        setTimeout(async () => {
            try {
                await buildAndReload(filePath.split("\\")[0], filePath)
                socket.send("reload")
            } catch (err) {
                log("Can't connect to the Reload Client!", "red")
                log("Reload stash website to connect to the Reload Server", "blue")
                state.connected = false
            }
        }, config.reloadDelay)
    })
