class Playground {
    constructor() {
        this.visualizer = new Visualizer()
        this.running = false

        this.InitMenu()
    }

    InitMenu() {
        this.menu = document.getElementById("menu")

        this.startBtn = document.getElementById("start-btn")
        this.stopBtn = document.getElementById("stop-btn")

    }

    Start() {
        this.startBtn.classList.add("hidden")
        this.stopBtn.classList.remove("hidden")
        this.running = true
    }

    Stop() {
        this.stopBtn.classList.add("hidden")
        this.startBtn.classList.remove("hidden")
        this.running = false
    }

    Step(stop) {
        if (stop)
            this.Stop()

        this.visualizer.TrainStep()
    }

    Run() {
        if (this.running)
            this.Step(false)

        window.requestAnimationFrame(() => this.Run())
    }

    Reset() {
        this.Stop()
        this.visualizer.Reset()
    }

    OpenMenu() {
        this.menu.classList.remove("menu-closed")
    }

    CloseMenu() {
        this.menu.classList.add("menu-closed")
    }

    ToggleMenu() {
        this.menu.classList.toggle("menu-closed")
    }
}
