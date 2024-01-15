import { WebSocketServer } from "ws"
import chokidar from "chokidar"
import { exec } from "child_process"
import path from "path"

const server = new WebSocketServer({ port: 8082 })
const [type, mode] = process.argv.pop().slice(2).split(":")

let socket

const config = {
    reloadDelay: 0,
    logUpdatedFile: true,
}

const state = {
    connected: false,
    reconnected: false,
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

async function buildAndReload() {
    if (type === "Plugins") {
        await runCommand("npm run build-plugin-local")
        log("Plugin built successfully", "green")
    } else if (type === "Themes") {
        if (mode === "personal") {
            await runCommand("npm run build-personal-theme-local")
        } else {
            await runCommand("npm run build-theme-local")
        }
        log("Theme built successfully", "green")
    }
}

buildAndReload()

const itemsToIgnore = []

if (type === "Plugins") {
    itemsToIgnore.push("**/*.yml", "**/reloadServer.js")
} else if (type === "Themes" && mode !== "personal") {
    itemsToIgnore.push("**/personal/**", "**/main-personal.scss")
}

server.on("connection", (soc) => {
    socket = soc

    if (state.reconnected) {
        soc.send("reconnected")
        state.reconnected = false
    }
    if (!state.connected) log("Stash connected to Hot Reload server", "green")
    state.connected = true
    soc.send("connected")
})

chokidar
    .watch(type, {
        ignored: itemsToIgnore,
    })
    .on("change", (filePath) => {
        setTimeout(async () => {
            try {
                if (config.logUpdatedFile) log(`${path.basename(filePath)} updated`, "blue")

                await buildAndReload()
                socket.send("reload")
            } catch (err) {
                log("Hot Reload server connection lost!", "red")
                state.connected = false
                state.reconnected = true
            }
        }, config.reloadDelay)
    })
