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
        this.stepBtn = document.getElementById("step-btn")

        this.InitModelMenu()
        this.InitTrainMenu()
        this.InitViewMenu()
    }

    InitModelMenu() {
        let modelInputsCount = new NumberInput(document.getElementById("model-inputs-count"))
        modelInputsCount.on("change", value => this.SetModelInputsCount(value, modelInputsCount))

        let modelLayersSize = new NumberInput(document.getElementById("model-layers-size"))
        modelLayersSize.on("change", value => this.SetModelLayersSize(value))

        let activation = document.getElementById("activation")
        activation.addEventListener("change", () => this.SetModelActivation(activation.value))

        let modelLayersCount = new NumberInput(document.getElementById("model-layers-count"))
        modelLayersCount.on("change", value => this.SetModelLayersCount(value, modelLayersSize.GetValue(), activation.value))

        this.thresholdLow = document.getElementById("threshold-low")
        this.thresholdHigh = document.getElementById("threshold-high")

        let thresholdLow = new NumberInput(this.thresholdLow)
        let thresholdHigh = new NumberInput(this.thresholdHigh)
        thresholdLow.on("input", value => this.visualizer.thresholds.SetLow(value))
        thresholdHigh.on("input", value => this.visualizer.thresholds.SetHigh(value))

        this.resetDisabledNeurons = document.getElementById("reset-disabled-neurons")

        this.visualizer.thresholds.on("change", (low, high) => this.HandleChangeThresholds(low, high))
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
        learningRate.on("input", value => this.SetLearningRate(value))
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
        regularization.on("input", value => this.SetRegularization(value))
        regularization.on("change", value => this.SetRegularization(value))

        this.UpdateTrainIcons()
    }

    InitViewMenu() {
        this.modelOutputBlock = document.getElementById("model-output-block")

        let modelOutputMode = document.getElementById("model-output-mode")
        modelOutputMode.addEventListener("change", () => this.SetModelOutputMode(modelOutputMode.value))

        let modelOutputSize = document.getElementById("model-output-size")
        modelOutputSize.addEventListener("change", () => this.SetModelOutputSize(modelOutputSize.value))

        let plotSurface = document.getElementById("plot-model-surface")
        plotSurface.addEventListener("change", () => this.visualizer.SetModelOutputSurfaceVisibility(plotSurface.checked))

        let modelWeightsMode = document.getElementById("model-weights-mode")
        modelWeightsMode.addEventListener("change", () => this.SetModelWeightsMode(modelWeightsMode.value))

        this.dataBlock = document.getElementById("data-block")

        for (let name of ["train", "test", "background"]) {
            let plotData = document.getElementById(`plot-${name}-data`)
            plotData.addEventListener("change", () => this.visualizer.SetDataVisibility(name, plotData.checked))
        }

        this.axisX = document.getElementById("axis-x")
        this.axisY = document.getElementById("axis-y")

        this.axisX.addEventListener("change", () => this.SetAxes())
        this.axisY.addEventListener("change", () => this.SetAxes())

        this.visualizer.dataset.on("change-dimension", dimension => this.HandleChangeDimension(dimension))
        this.visualizer.dataset.on("change", (name, split) => this.HandleChangeData(name, split))
        this.visualizer.dataset.on("clear", () => this.HandleClearData())
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
        this.visualizer.Reset(this.resetDisabledNeurons.checked)
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
