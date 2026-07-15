import type { FileSystemItem } from "./types"

/**
 * @class FileSystemClass
 * @description Manages a simulated in-memory file system for the OS.
 * Provides asynchronous methods for file and directory operations.
 */
class FileSystemClass {
  private files: Record<string, FileSystemItem> = {
    "C:": {
      name: "C:",
      type: "folder",
      modified: new Date(),
      children: {
        WINDOWS: {
          name: "WINDOWS",
          type: "folder",
          modified: new Date(),
          children: {
            SYSTEM: {
              name: "SYSTEM",
              type: "folder",
              modified: new Date(),
              children: {},
            },
            TEMP: {
              name: "TEMP",
              type: "folder",
              modified: new Date(),
              children: {},
            },
          },
        },
        "Program Files": {
          name: "Program Files",
          type: "folder",
          modified: new Date(),
          children: {},
        },
        "My Documents": {
          name: "My Documents",
          type: "folder",
          modified: new Date(),
          children: {
            "readme.txt": {
              name: "readme.txt",
              type: "file",
              content: "Welcome to Windows 98!\n\nThis is a sample text file.",
              size: 45,
              modified: new Date(),
            },
            "index.html": {
              name: "index.html",
              type: "file",
              content: "<h1>Hello from Windows 98 Browser!</h1><p>This is a local HTML file.</p>",
              size: 60,
              modified: new Date(),
            },
            "my_drawing.png": {
              name: "my_drawing.png",
              type: "file",
              content: "", // This will be a base64 string
              size: 0,
              modified: new Date(),
            },
          },
        },
      },
    },
  }

  /**
   * @private
   * @function normalizePath
   * @description Converts a path to a consistent format (e.g., replaces / with \ and removes leading \).
   * @param {string} path - The path to normalize.
   * @returns {string} The normalized path.
   */
  private normalizePath(path: string): string {
    return path.replace(/\//g, "\\").replace(/^\\/, "")
  }

  /**
   * @private
   * @function getItemRecursive
   * @description Recursively finds a file system item given a current item and remaining path parts.
   * @param {FileSystemItem} current - The current item in the traversal.
   * @param {string[]} parts - Remaining parts of the path.
   * @returns {FileSystemItem | null} The found item or null if not found.
   */
  private getItemRecursive(current: FileSystemItem, parts: string[]): FileSystemItem | null {
    if (parts.length === 0) {
      return current
    }

    const [head, ...tail] = parts
    if (current.type !== "folder" || !current.children || !current.children[head]) {
      return null
    }
    return this.getItemRecursive(current.children[head], tail)
  }

  /**
   * @private
   * @function getItem
   * @description Retrieves a file system item by its full path.
   * @param {string} path - The full path to the item (e.g., "C:\My Documents\file.txt").
   * @returns {FileSystemItem | null} The found item or null if not found.
   */
  private getItem(path: string): FileSystemItem | null {
    const normalizedPath = this.normalizePath(path)
    const parts = normalizedPath.split("\\").filter((p) => p)

    if (parts[0].toUpperCase() !== "C:") {
      return null // Only support C: drive for now
    }
    parts.shift() // Remove "C:"

    return this.getItemRecursive(this.files["C:"], parts)
  }

  /**
   * @private
   * @function setItemRecursive
   * @description Recursively sets a file system item at a given path. Creates intermediate folders if they don't exist.
   * @param {FileSystemItem} current - The current item in the traversal.
   * @param {string[]} parts - Remaining parts of the path.
   * @param {FileSystemItem} item - The item to set.
   */
  private setItemRecursive(current: FileSystemItem, parts: string[], item: FileSystemItem): void {
    if (parts.length === 1) {
      if (current.type === "folder" && current.children) {
        current.children[parts[0]] = item
      }
      return
    }

    const [head, ...tail] = parts
    if (current.type !== "folder" || !current.children) {
      return
    }
    if (!current.children[head]) {
      current.children[head] = {
        name: head,
        type: "folder",
        modified: new Date(),
        children: {},
      }
    }
    this.setItemRecursive(current.children[head], tail, item)
  }

  /**
   * @private
   * @function setItem
   * @description Sets a file system item at a given path.
   * @param {string} path - The full path where the item should be set.
   * @param {FileSystemItem} item - The item to set.
   */
  private setItem(path: string, item: FileSystemItem): void {
    const normalizedPath = this.normalizePath(path)
    const parts = normalizedPath.split("\\").filter((p) => p)

    if (parts[0].toUpperCase() !== "C:") return

    parts.shift() // Remove "C:"
    this.setItemRecursive(this.files["C:"], parts, item)
  }

  /**
   * @function readFile
   * @description Reads the content of a file.
   * @param {string} path - The full path to the file.
   * @returns {Promise<string>} A promise that resolves with the file content.
   * @throws {Error} If the file is not found or is not a file.
   */
  async readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const item = this.getItem(path)
        if (item && item.type === "file" && item.content !== undefined) {
          resolve(item.content)
        } else {
          reject(new Error(`File not found: ${path}`))
        }
      }, 100)
    })
  }

  /**
   * @function writeFile
   * @description Writes content to a file. Creates the file if it doesn't exist.
   * @param {string} path - The full path to the file.
   * @param {string} content - The content to write.
   * @returns {Promise<void>} A promise that resolves when the write operation is complete.
   */
  async writeFile(path: string, content: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const item: FileSystemItem = {
          name: path.split("\\").pop() || path.split("/").pop() || "untitled",
          type: "file",
          content,
          size: content.length,
          modified: new Date(),
        }
        this.setItem(path, item)
        resolve()
      }, 100)
    })
  }

  /**
   * @function listDirectory
   * @description Lists the contents of a directory.
   * @param {string} path - The full path to the directory.
   * @returns {Promise<FileSystemItem[]>} A promise that resolves with an array of items in the directory.
   * @throws {Error} If the directory is not found or is not a folder.
   */
  async listDirectory(path: string): Promise<FileSystemItem[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const item = this.getItem(path)
        if (item && item.type === "folder" && item.children) {
          resolve(Object.values(item.children))
        } else {
          reject(new Error(`Directory not found: ${path}`))
        }
      }, 50)
    })
  }

  /**
   * @function createDirectory
   * @description Creates a new directory.
   * @param {string} path - The full path for the new directory.
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   * @throws {Error} If a directory or file already exists at the path.
   */
  async createDirectory(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingItem = this.getItem(path)
        if (existingItem) {
          reject(new Error(`A file or folder named '${existingItem.name}' already exists.`))
          return
        }
        const item: FileSystemItem = {
          name: path.split("\\").pop() || path.split("/").pop() || "New Folder",
          type: "folder",
          modified: new Date(),
          children: {},
        }
        this.setItem(path, item)
        resolve()
      }, 100)
    })
  }

  /**
   * @function deleteItem
   * @description Deletes a file or directory.
   * @param {string} path - The full path to the item to delete.
   * @returns {Promise<void>} A promise that resolves when the item is deleted.
   * @throws {Error} If the item is not found, the path is invalid, or the folder is not empty.
   */
  async deleteItem(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedPath = this.normalizePath(path)
        const parts = normalizedPath.split("\\").filter((p) => p)
        const itemName = parts.pop()

        if (!itemName || parts[0].toUpperCase() !== "C:") {
          reject(new Error("Invalid path"))
          return
        }
        parts.shift() // Remove "C:"

        let current = this.files["C:"]

        for (const part of parts) {
          if (current.type !== "folder" || !current.children || !current.children[part]) {
            reject(new Error(`Path not found: ${path}`))
            return
          }
          current = current.children[part]
        }

        if (current.type === "folder" && current.children && current.children[itemName]) {
          const itemToDelete = current.children[itemName]
          if (itemToDelete.type === "folder" && Object.keys(itemToDelete.children || {}).length > 0) {
            reject(new Error(`Directory is not empty: ${itemName}`))
            return
          }
          delete current.children[itemName]
          resolve()
        } else {
          reject(new Error(`Item not found: ${path}`))
        }
      }, 100)
    })
  }

  /**
   * @function renameItem
   * @description Renames a file system item within the same directory.
   * @param {string} oldPath - The current full path of the item.
   * @param {string} newName - The new name for the item (not a full path).
   * @returns {Promise<void>} A promise that resolves when the item is renamed.
   * @throws {Error} If the item is not found, or a file/folder with the new name already exists.
   */
  async renameItem(oldPath: string, newName: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const item = this.getItem(oldPath)
        if (!item) {
          reject(new Error(`Item not found: ${oldPath}`))
          return
        }

        const parentPath = oldPath.substring(0, oldPath.lastIndexOf("\\")) || "C:"
        const newFullPath = `${parentPath}\\${newName}`

        const existingItemAtNewPath = this.getItem(newFullPath)
        if (existingItemAtNewPath) {
          reject(new Error(`A file or folder named '${newName}' already exists in this location.`))
          return
        }

        await this.deleteItem(oldPath) // Temporarily remove
        const newItem = { ...item, name: newName, modified: new Date() }
        this.setItem(newFullPath, newItem) // Add with new name
        resolve()
      } catch (error: any) {
        reject(new Error(`Failed to rename item: ${error.message}`))
      }
    })
  }

  /**
   * @function copyItem
   * @description Copies a file or folder from a source path to a destination path.
   * @param {string} sourcePath - The full path of the item to copy.
   * @param {string} destinationPath - The full path where the item should be copied (including new name if different).
   * @returns {Promise<void>} A promise that resolves when the copy operation is complete.
   * @throws {Error} If the source item is not found, or a file/folder already exists at the destination.
   */
  async copyItem(sourcePath: string, destinationPath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const sourceItem = this.getItem(sourcePath)
        if (!sourceItem) {
          reject(new Error(`Source item not found: ${sourcePath}`))
          return
        }

        const existingItemAtDestination = this.getItem(destinationPath)
        if (existingItemAtDestination) {
          reject(new Error(`A file or folder already exists at: ${destinationPath}`))
          return
        }

        const copyRecursive = (src: FileSystemItem, destPath: string): FileSystemItem => {
          const newName = destPath.split("\\").pop() || src.name
          const newItem: FileSystemItem = {
            ...src,
            name: newName,
            modified: new Date(),
          }

          if (src.type === "folder" && src.children) {
            newItem.children = {}
            for (const childName in src.children) {
              const childSrcPath = `${sourcePath}\\${childName}`
              const childDestPath = `${destPath}\\${childName}`
              newItem.children[childName] = copyRecursive(this.getItem(childSrcPath)!, childDestPath)
            }
          }
          return newItem
        }

        const copiedItem = copyRecursive(sourceItem, destinationPath)
        this.setItem(destinationPath, copiedItem)
        resolve()
      } catch (error: any) {
        reject(new Error(`Failed to copy item: ${error.message}`))
      }
    })
  }

  /**
   * @function moveItem
   * @description Moves a file or folder from a source path to a destination path.
   * This is essentially a copy followed by a delete of the source.
   * @param {string} sourcePath - The full path of the item to move.
   * @param {string} destinationPath - The full path where the item should be moved (including new name if different).
   * @returns {Promise<void>} A promise that resolves when the move operation is complete.
   * @throws {Error} If the source item is not found, or a file/folder already exists at the destination.
   */
  async moveItem(sourcePath: string, destinationPath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.copyItem(sourcePath, destinationPath)
        await this.deleteItem(sourcePath)
        resolve()
      } catch (error: any) {
        reject(new Error(`Failed to move item: ${error.message}`))
      }
    })
  }
}

export const FileSystem = new FileSystemClass()
