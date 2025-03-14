class SyntheticDataExperiment {
    constructor(parent, visualizer) {
        this.parent = parent
        this.visualizer = visualizer
        this.controls = {}
    }

    Run(backgroundCount, axisX, axisY) {
        let {background, data} = this.GenerateSyntheticData(backgroundCount)
        let split = {data: data, stats: data.GetStatistic()}

        this.ShowSteps(backgroundCount, data)

        if (data.length == 0)
            return

        this.InitControls(axisX, axisY)
        this.InitDataPlot()

        this.dataTable.ChangeData("synthetic", split)
        this.dataPlot.ChangeData("synthetic", split)

        this.dataTable.ChangeData("train", this.visualizer.dataset.splits.train)
        this.dataPlot.ChangeData("train", this.visualizer.dataset.splits.train)

        this.histogram.ChangeData(background.outputs.filter(v => !this.visualizer.thresholds.IsInside(v)))

        this.SetAxes()
    }

    GenerateSyntheticData(count) {
        let background = this.visualizer.compact.GetData(count)
        let dimension = background.dimension
        let indices = []
        let labels = []

        this.visualizer.modelManager.model.PredictUnrolled(background.inputs, count, background.outputs)

        for (let i = 0; i < count; i++) {
            let label = this.visualizer.thresholds.GetLabel(background.outputs[i])

            if (label != 0 && Math.random() < Math.abs(background.outputs[i])) {
                indices.push(i)
                labels.push(label)
            }
        }

        let inputs = new Float64Array(dimension * indices.length)
        let outputs = new Float64Array(indices.length)
        let data = new Data(inputs, outputs, dimension)

        for (let i = 0; i < indices.length; i++) {
            for (let j = 0; j < dimension; j++)
                data.inputs[i * dimension + j] = background.inputs[indices[i] * dimension + j]

            data.outputs[i] = labels[i]
        }

        return {background, data}
    }

    ShowSteps(count, data) {
        MakeElement(this.parent, {innerText: "Генерация синтетических данных"}, "h2")
        let stepsList = MakeElement(this.parent, null, "ul")

        MakeElement(stepsList, {class: "text", innerText: `${GetWordForm(count, ["случайная точка сгенерирована", "случайные точки сгенерированы", "случайных точек сгенерированы"])} на компакте`}, "li")
        MakeElement(stepsList, {class: "text", innerHTML: "Для каждой сгенерированной точки x<sub>i</sub> получено предсказание модели y<sub>i</sub>"}, "li")

        let thresholds = this.visualizer.thresholds
        if (thresholds.low < thresholds.high)
            MakeElement(stepsList, {class: "text", innerHTML: `Точки с ${thresholds.low} &le; y<sub>i</sub> &lt; ${thresholds.high} были удалены (пороги доверия)`}, "li")

        MakeElement(stepsList, {class: "text", innerHTML: "В качестве синтетической выборки были выбраны точки x<sub>i</sub> с вероятностью |y<sub>i</sub>|"}, "li")

        if (data.length == 0)
            MakeElement(stepsList, {class: "text", innerText: "В результате все сгенерированные точки были отвергнуты"}, "li")
        else
            MakeElement(stepsList, {class: "text", innerHTML: `В результате ${GetWordForm(data.length, ["точка была отобрана", "точки были отобраны", "точек были отобраны"])} (${Round(data.length * 100 / count, 10)}%)`}, "li")
    }

    InitControls(axisX, axisY) {
        MakeElement(this.parent, {innerText: "Управление"}, "h3")
        let controls = MakeElement(this.parent, null, "ul")

        let x = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
        this.controls["axis-x"] = CloneSelect(axisX, x)
        this.controls["axis-x"].addEventListener("change", () => this.SetAxes())

        let y = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")
        this.controls["axis-y"] = CloneSelect(axisY, y)
        this.controls["axis-y"].addEventListener("change", () => this.SetAxes())

        let trainData = MakeElement(controls, {innerHTML: ""}, "li")
        this.controls["plot-train-data"] = MakeCheckbox(trainData, "Отображать обучающие данные", false)
        this.controls["plot-train-data"].addEventListener("change", () => this.dataPlot.SetVisibility("train", this.controls["plot-train-data"].checked))

        let grid = MakeElement(controls, {innerHTML: ""}, "li")
        this.controls["plot-grid"] = MakeCheckbox(grid, "Отображать сетку", true)
        this.controls["plot-grid"].addEventListener("change", () => this.dataPlot.SetGridVisibility(this.controls["plot-grid"].checked))
    }

    InitDataPlot() {
        let dataPlotDiv = MakeElement(this.parent, {class: "data-plot"})
        let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")
        let viewBox = new ViewBox(dataPlotSVG)

        MakeElement(this.parent, {innerHTML: "Гистограмма предсказаний модели на фоне"}, "h3")
        MakeElement(this.parent, {class: "text", innerText: "Учитываются только точки со значением предсказания выше порогов доверия (до вероятностного прореживания)"}, "p")
        let histogramDiv = MakeElement(this.parent, {class: "histogram-plot"})

        let dataTableDiv = MakeElement(this.parent, {class: "data-table"})

        this.dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
        this.dataPlot.AddPlot("synthetic", {border: "#000000", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        this.dataPlot.AddPlot("train", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: false})

        this.histogram = new HistogramPlot(histogramDiv, {min: -1, max: 1, n: 20, color: "#89dd73", border: "#ffffff"})

        this.dataTable = new DataTable(dataTableDiv)
        this.dataTable.Add("synthetic", {title: "Синтетические данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
    }

    SetAxes() {
        let axisX = +this.controls["axis-x"].value
        let axisY = +this.controls["axis-y"].value

        this.dataPlot.SetAxes(axisX, axisY)
    }
}
