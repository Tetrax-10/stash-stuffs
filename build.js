import fs from "fs"
import path from "path"
import { execSync } from "child_process"
import { parse as parseYml, stringify as stringifyYml } from "yaml"

import config from "./build-config.json" assert { type: "json" }

class GlobModules {
    getFileContents(filePath) {
        return fs.readFileSync(filePath, "utf-8")
    }

    writeFile(filePath, content, append) {
        if (!append) {
            fs.writeFileSync(filePath, content)
            return
        }

        fs.appendFileSync(filePath, content)
    }

    writeYml(filePath, content) {
        this.writeFile(filePath, stringifyYml(content))
    }

    createFolder(folderPath) {
        if (!this.fsExsists(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }
    }

    delete(filePath) {
        try {
            fs.rmSync(filePath, { recursive: true, force: true })
        } catch (err) {
            // do nothing
        }
    }

    copy(src, dest, contents = false) {
        if (!contents) dest = path.join(dest, path.basename(src))
        fs.cpSync(src, dest, { recursive: true })
    }

    fsExsists(paths) {
        if (typeof paths === "object") {
            const availablePaths = []
            for (const path of paths) {
                if (fs.existsSync(path)) availablePaths.push(path)
            }
            return availablePaths
        }
        return fs.existsSync(paths)
    }

    getYmlFiles(dirPath) {
        return fs
            .readdirSync(dirPath)
            .filter((file) => path.extname(file) === ".yml")
            .map((file) => path.join(dirPath, file))
    }

    getYml(filePath) {
        if (!this.fsExsists(filePath)) return null
        try {
            return parseYml(this.getFileContents(filePath))
        } catch (err) {
            console.error("Yml: parsing error", filePath)
            return null
        }
    }

    getChildDirs(source, relativePath = false) {
        return fs
            .readdirSync(source, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => {
                if (relativePath) {
                    return path.join(source, dirent.name)
                } else {
                    return dirent.name
                }
            })
    }
}

class UtilsModules {
    getAllPluginFolders(paths) {
        const pluginPaths = {
            normalPluginPaths: [],
            stashPluginBuilderPluginPaths: [],
        }

        for (let _path of paths) {
            let isParentDir = false

            if (_path.endsWith("/*")) {
                _path = _path.slice(0, -2)
                isParentDir = true
            }

            if (isParentDir && Glob.fsExsists(_path)) {
                const recursivePluginPaths = this.getAllPluginFolders(Glob.fsExsists(Glob.getChildDirs(_path, true)))

                pluginPaths.normalPluginPaths.push(...recursivePluginPaths.normalPluginPaths)
                pluginPaths.stashPluginBuilderPluginPaths.push(...recursivePluginPaths.stashPluginBuilderPluginPaths)
            } else if (Glob.fsExsists(_path)) {
                const isSettingsYmlPresent = Glob.fsExsists(path.join(_path, "settings.yml"))
                const isSettingsYmlIdPresent = isSettingsYmlPresent ? Glob.getYml(path.join(_path, "settings.yml"))?.id : false

                if (isSettingsYmlIdPresent) {
                    pluginPaths.stashPluginBuilderPluginPaths.push({
                        pluginPath: _path,
                        pluginDistPath: path.join(config.outDir, path.basename(_path)),
                    })
                } else {
                    pluginPaths.normalPluginPaths.push({
                        pluginPath: _path,
                        pluginDistPath: path.join(config.outDir, path.basename(_path)),
                    })
                }
            }
        }

        return pluginPaths
    }

    packPlugin(pluginPath, pluginDistPath) {
        const ymls = Glob.getYmlFiles(pluginDistPath)
        if (ymls.length) {
            const pluginYmlPath =
                ymls.length > 1
                    ? (() => {
                          const id = path.basename(pluginDistPath)
                          const yml = path.join(pluginDistPath, `${id}.yml`)
                          if (Glob.fsExsists(yml)) {
                              return yml
                          } else {
                              return ymls[0]
                          }
                      })()
                    : ymls[0]

            const pluginYmlData = Glob.getYml(pluginYmlPath)
            const pluginRawYml = Glob.getFileContents(pluginYmlPath)
            const indexYmlChunk = {}

            indexYmlChunk.id = path.basename(pluginYmlPath, path.extname(pluginYmlPath))

            indexYmlChunk.name = pluginYmlData.name

            if (pluginYmlData.description) {
                indexYmlChunk.metadata = {}
                indexYmlChunk.metadata.description = pluginYmlData.description
            }

            indexYmlChunk.version = `${pluginRawYml.match(/^version:\s*(['"]?)([0-9]+(?:\.[0-9]+)*)\1/m)?.[2]?.trim() ?? ""}-${Shell.run(`git log -n 1 --pretty=format:%h -- "${pluginPath}"/*`)}`

            indexYmlChunk.date = Shell.run(`TZ=UTC0 git log -n 1 --date="format-local:%F %T" --pretty=format:%ad -- "${pluginPath}"/*`)

            indexYmlChunk.path = `${indexYmlChunk.id}.zip`

            Shell.run(`cd ${pluginDistPath} && zip -r ../${indexYmlChunk.id}.zip . && cd .. && rm -r ${path.basename(pluginDistPath)}`)

            indexYmlChunk.sha256 = Shell.run(`sha256sum "${path.join(config.outDir, indexYmlChunk.path)}" | cut -d' ' -f1`)

            if (pluginYmlData.ui?.requires?.length) indexYmlChunk.requires = pluginYmlData.ui.requires

            return indexYmlChunk
        } else {
            Glob.delete(pluginDistPath)
        }
    }

    copyExternalFiles(paths, dest) {
        paths.forEach((_path) => {
            let isCopyContents = false

            if (_path.endsWith("/*")) {
                _path = _path.slice(0, -2)
                isCopyContents = true
            }

            if (Glob.fsExsists(_path)) Glob.copy(_path, dest, isCopyContents)
        })
    }
}

class ShellModules {
    run(command) {
        try {
            const stdout = execSync(command)
            return stdout.toString().trim()
        } catch (error) {
            throw error
        }
    }
}

////////////////////////////// MAIN //////////////////////////////

const Glob = new GlobModules()
const Utils = new UtilsModules()
const Shell = new ShellModules()

const allPluginFolders = Utils.getAllPluginFolders(config.plugins ?? ["./"])
const indexYml = []

if (config.excludePluginFolders?.length) {
    allPluginFolders.normalPluginPaths = allPluginFolders.normalPluginPaths.filter(({ pluginDistPath }) => !config.excludePluginFolders.includes(path.basename(pluginDistPath)))
    allPluginFolders.stashPluginBuilderPluginPaths = allPluginFolders.stashPluginBuilderPluginPaths.filter(({ pluginDistPath }) => !config.excludePluginFolders.includes(path.basename(pluginDistPath)))
}

allPluginFolders.normalPluginPaths.forEach(({ pluginPath, pluginDistPath }) => {
    Glob.copy(pluginPath, config.outDir)
    indexYml.push(Utils.packPlugin(pluginPath, pluginDistPath))
})
allPluginFolders.stashPluginBuilderPluginPaths.forEach(({ pluginPath, pluginDistPath }) => {
    Shell.run(`npx stash-plugin-builder --in=${pluginPath} --out=${config.outDir} --minify`)
    indexYml.push(Utils.packPlugin(pluginPath, pluginDistPath))
})

Glob.writeYml(path.join(config.outDir, "index.yml"), indexYml)

if (config.include?.length) Utils.copyExternalFiles(config.include, config.outDir)
