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

        this.InitTrainMenu()
    }

    InitTrainMenu() {
        this.learningRateValue = document.getElementById("learning-rate-value")
        this.batchSizeValue = document.getElementById("batch-size-value")
        this.backgroundPartValue = document.getElementById("background-part-value")
        this.criterionValue = document.getElementById("criterion-value")
        this.optimizerValue = document.getElementById("optimizer-value")
        this.regularizationL1Value = document.getElementById("regularization-l1-value")
        this.regularizationL2Value = document.getElementById("regularization-l2-value")

        this.regularization = document.getElementById("regularization")

        let learningRate = new NumberInput(document.getElementById("learning-rate"))
        learningRate.on("change", value => this.SetLearningRate(value))

        let batchSize = new RangeInput(document.getElementById("batch-size"), document.getElementById("batch-size-label"))
        batchSize.on("change", value => this.SetBatchSize(value))

        let backgroundPart = new RangeInput(document.getElementById("background-part"), document.getElementById("background-part-label"))
        backgroundPart.on("change", value => this.SetBackgroundPart(value / 100))

        let criterion = document.getElementById("criterion")
        criterion.addEventListener("change", () => this.SetCriterion(criterion.value))

        let optmizer = document.getElementById("optmizer")
        optimizer.addEventListener("change", () => this.SetOptimizer(optimizer.value))

        let regularizationType = document.getElementById("regularization-type")
        regularizationType.addEventListener("change", () => this.SetRegularizationType(regularizationType.value))

        let regularization = new NumberInput(this.regularization)
        regularization.on("change", value => this.SetRegularization(value))

        this.UpdateTrainIcons()
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
