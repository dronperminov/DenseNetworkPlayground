class FileInput extends EventEmitter {
    constructor(id) {
        super()

        this.input = document.getElementById(id)
        this.button = document.getElementById(`${id}-btn`)
        this.label = document.getElementById(`${id}-label`)

        this.label.innerText = "файл не выбран"

        this.button.addEventListener("click", () => this.input.click())
        this.input.addEventListener("change", e => this.Change(e))
    }

    Change(e) {
        let file = this.input.files[0]
        this.label.innerText = file.name
        this.emit("change", file)
    }

    Reset() {
        this.input.value = ""
        this.label.innerText = "файл не выбран"
        this.emit("reset")
    }

    GetFile() {
        if (this.input.files.length == 0)
            return null

        return this.input.files[0]
    }
}
