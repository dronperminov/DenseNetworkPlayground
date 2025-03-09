class Playground {
    constructor() {
        this.visualizer = new Visualizer()
        this.running = false

        this.InitMenu()

        this.visualizer.SetDimension(2)
        this.visualizer.SetDataVisibility("test", false)
    }

    InitMenu() {
        this.menu = document.getElementById("menu")

        this.startBtn = document.getElementById("start-btn")
        this.stopBtn = document.getElementById("stop-btn")
        this.stepBtn = document.getElementById("step-btn")

        this.tabTrainInput = document.getElementById("tab-train-input")
        this.tabDataInput = document.getElementById("tab-data-input")
        this.tabExperimentsInput = document.getElementById("tab-experiments-input")

        this.tabExperiments = document.getElementById("tab-experiments")

        this.InitModelMenu()
        this.InitTrainMenu()
        this.InitViewMenu()
        this.InitDataMenu()
        this.InitExperimentsMenu()
    }

    InitModelMenu() {
        this.modelInputsCount = new NumberInput(document.getElementById("model-inputs-count"))
        this.modelInputsCount.on("change", value => this.SetModelInputsCount(value))

        this.modelLayersSize = new NumberInput(document.getElementById("model-layers-size"))
        this.modelLayersSize.on("change", value => this.SetModelLayersSize(value))

        this.modelActivation = document.getElementById("activation")
        this.modelActivation.addEventListener("change", () => this.SetModelActivation(this.modelActivation.value))

        this.modelLayersCount = new NumberInput(document.getElementById("model-layers-count"))
        this.modelLayersCount.on("change", value => this.SetModelLayersCount(value, this.modelLayersSize.GetValue(), this.modelActivation.value))

        this.thresholdLow = document.getElementById("threshold-low")
        this.thresholdHigh = document.getElementById("threshold-high")

        this.thresholdLowValue = document.getElementById("threshold-low-value")
        this.thresholdHighValue = document.getElementById("threshold-high-value")

        let thresholdLow = new NumberInput(this.thresholdLow)
        let thresholdHigh = new NumberInput(this.thresholdHigh)
        thresholdLow.on("change", value => this.visualizer.thresholds.SetLow(value))
        thresholdHigh.on("change", value => this.visualizer.thresholds.SetHigh(value))

        this.resetDisabledNeurons = document.getElementById("reset-disabled-neurons")

        let downloadModelBtn = document.getElementById("download-model-btn")
        downloadModelBtn.addEventListener("click", () => this.DownloadModel())

        this.modelFileInput = document.getElementById("model-file-input")
        this.modelFileInput.addEventListener("change", () => this.UploadModel())

        let uploadModelBtn = document.getElementById("upload-model-btn")
        uploadModelBtn.addEventListener("click", () => this.modelFileInput.click())

        let removeDisabledNeuronsBtn = document.getElementById("remove-disabled-neurons-btn")
        removeDisabledNeuronsBtn.addEventListener("click", () => this.RemoveDisabledNeurons())

        this.visualizer.modelManager.on("change-architecture", () => this.HandleChangeModelArchitecture())
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

        this.compactOffset = document.getElementById("compact-offset")
        let compactOffset = new NumberInput(this.compactOffset)
        compactOffset.on("change", value => this.SetCompactOffset(value))
        this.SetCompactOffset(compactOffset.GetValue())

        this.trainerModelBlock = document.getElementById("trainer-model-block")
        this.trainerModelSVG = document.getElementById("trainer-model")

        this.setTrainerModelBtn = document.getElementById("set-trainer-model-btn")
        this.setTrainerModelBtn.addEventListener("click", () => this.SetTrainerModel())

        this.removeTrainerModelBtn = document.getElementById("remove-trainer-model-btn")
        this.removeTrainerModelBtn.addEventListener("click", () => this.RemoveTrainerModel())

        this.UpdateTrainIcons()
    }

    InitViewMenu() {
        this.modelOutputBlock = document.getElementById("model-output-block")

        this.modelOutputMode = document.getElementById("model-output-mode")
        this.modelOutputMode.addEventListener("change", () => this.SetModelOutputMode(this.modelOutputMode.value))

        this.modelOutputSize = document.getElementById("model-output-size")
        this.modelOutputSize.addEventListener("change", () => this.SetModelOutputSize(this.modelOutputSize.value))

        let plotSurface = document.getElementById("plot-model-surface")
        plotSurface.addEventListener("change", () => this.visualizer.SetModelOutputSurfaceVisibility(plotSurface.checked))

        let modelWeightsMode = document.getElementById("model-weights-mode")
        modelWeightsMode.addEventListener("change", () => this.SetModelWeightsMode(modelWeightsMode.value))

        this.dataBlock = document.getElementById("data-block")

        for (let name of ["train", "test", "background"]) {
            let plotData = document.getElementById(`plot-${name}-data`)
            plotData.addEventListener("change", () => this.visualizer.SetDataVisibility(name, plotData.checked))
        }

        let plotGrid = document.getElementById("plot-grid")
        plotGrid.addEventListener("change", () => this.visualizer.SetDataGridVisibility(plotGrid.checked))

        this.axisX = document.getElementById("axis-x")
        this.axisY = document.getElementById("axis-y")

        this.axisX.addEventListener("change", () => this.SetAxes())
        this.axisY.addEventListener("change", () => this.SetAxes())

        this.visualizer.dataset.on("change-dimension", dimension => this.HandleChangeDimension(dimension))
        this.visualizer.dataset.on("change", (name, split) => this.HandleChangeData(name, split))
        this.visualizer.dataset.on("clear", () => this.HandleClearData())
    }

    InitDataMenu() {
        this.dataCount = new NumberInput(document.getElementById("data-count"))
        this.dataBalance = new RangeInput(document.getElementById("data-balance"), document.getElementById("data-balance-label"))
        this.dataTestPart = new RangeInput(document.getElementById("data-test-part"), document.getElementById("data-test-part-label"))
        this.dataError = new RangeInput(document.getElementById("data-error"), document.getElementById("data-error-label"))

        let dataGenerateBtn = document.getElementById("data-generate-btn")
        dataGenerateBtn.addEventListener("click", () => this.GenerateData(true))
        let dataAddBtn = document.getElementById("data-add-btn")
        dataAddBtn.addEventListener("click", () => this.GenerateData(false))

        this.InitDataGenerators()

        this.trainDatasetValue = document.getElementById("train-dataset-value")
        this.testDatasetValue = document.getElementById("test-dataset-value")

        this.trainFileInput = new FileInput("train-file-input")
        this.trainFileInput.on("change", () => this.ChangeUploadDataFile())

        this.testFileInput = new FileInput("test-file-input")
        this.testFileInput.on("change", () => this.ChangeUploadDataFile())

        this.uploadDataBlock = document.getElementById("upload-data-block")

        let resetUploadDataBtn = document.getElementById("reset-upload-data-btn")
        resetUploadDataBtn.addEventListener("click", () => this.ResetUploadData())

        let uploadDataBtn = document.getElementById("upload-data-btn")
        uploadDataBtn.addEventListener("click", () => this.UploadData())

        this.dataControlBlock = document.getElementById("data-control-block")

        this.dataNormalizationMode = document.getElementById("data-normalization-mode")
        this.normalizeDataBtn = document.getElementById("normalize-data-btn")
        this.normalizeDataBtn.addEventListener("click", () => this.NormalizeData())

        let downloadDataBtn = document.getElementById("download-data-btn")
        downloadDataBtn.addEventListener("click", () => this.DownloadDataset())

        let clearDataBtn = document.getElementById("clear-data-btn")
        clearDataBtn.addEventListener("click", () => this.ClearData())
    }

    InitExperimentsMenu() {
        this.syntheticDataBackgroundCount = new NumberInput(document.getElementById("synthetic-data-background-count"))
        this.treeBackgroundCount = new NumberInput(document.getElementById("tree-background-count"))

        let syntheticDataGenerateBtn = document.getElementById("synthetic-data-generate-btn")
        syntheticDataGenerateBtn.addEventListener("click", () => this.RunSyntheticDataExperiment())

        let treeExperimentBtn = document.getElementById("tree-experiment-btn")
        treeExperimentBtn.addEventListener("click", () => this.RunTreeExperiment())
    }

    InitDataGenerators() {
        this.dataGenerator = new DataGeneratorUI(document.getElementById("data-generators"))
        this.dataGenerator.Add(new Point2DGenerator())
    }

    Start() {
        this.startBtn.classList.add("hidden")
        this.stopBtn.classList.remove("hidden")
        this.tabTrainInput.checked = true
        this.tabExperimentsInput.setAttribute("disabled", "")

        this.running = true
    }

    Stop() {
        this.stopBtn.classList.add("hidden")
        this.startBtn.classList.remove("hidden")
        this.tabExperimentsInput.removeAttribute("disabled")

        this.running = false
    }

    Step() {
        this.running = false
        this.stopBtn.classList.add("hidden")
        this.startBtn.classList.remove("hidden")
        this.tabTrainInput.checked = true
        this.tabExperimentsInput.setAttribute("disabled", "")

        this.visualizer.TrainStep()

        this.tabExperimentsInput.removeAttribute("disabled")
    }

    Run() {
        if (this.running)
            this.visualizer.TrainStep()

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
