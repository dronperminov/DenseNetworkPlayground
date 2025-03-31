class TreeExperiment {
    constructor(parent, visualizer) {
        this.parent = parent
        this.visualizer = visualizer
        this.controls = {}

        this.model = new NeuralNetwork(2)
        this.model.FromJSON(this.visualizer.modelManager.model.ToJSON())

        this.cellExtractor = new CellsExtractor(this.model)
    }

    Run(backgroundCount, build3DHistogram, axisX, axisY, modelOutputMode, modelOutputSize) {
        this.datas = this.InitDatas(backgroundCount)
        this.tree = this.InitTree()
        this.leafs = this.tree.GetLeafs()

        this.ShowSteps()
        this.InitControls(axisX, axisY, modelOutputMode, modelOutputSize)

        this.InitDataModelPlot()
        this.ShowLeafsInfo()
        this.InitTreeCellsTable()
        this.InitCellsHistograms()

        if (build3DHistogram)
            this.Init3dPlots()

        this.InitDataTable()

        for (let [name, data] of Object.entries(this.datas)) {
            let split = ["train", "test"].indexOf(name) > -1 ? this.visualizer.dataset.splits[name] : {data: data, stats: data.GetStatistic()}

            this.dataPlot.ChangeData(name, split)
            this.dataTable.ChangeData(name, split)
        }

        this.dataPlot.ResetLimits()

        if (axisX.value != "0" || axisY.value != "1")
            this.SetAxes()
    }

    InitDatas(backgroundCount) {
        let datas = {
            background: this.visualizer.compact.GetData(backgroundCount)
        }

        for (let name of ["train", "test"])
            if (this.visualizer.dataset.splits[name] && this.visualizer.dataset.splits[name].data.length > 0)
                datas[name] = this.visualizer.dataset.splits[name].data

        return datas
    }

    InitTree() {
        let tree = new ExTree()

        for (let [name, data] of Object.entries(this.datas)) {
            let prediction = this.model.PredictWithSignsUnrolled(data.inputs, data.length)
            tree.Fill(name, data, prediction.result, prediction.signs)
        }

        return tree
    }

    ShowSteps() {
        MakeElement(this.parent, {innerText: "Построение объясняющего дерева (eXTree)"}, "h2")
        let stepsList = MakeElement(this.parent, null, "ul")

        if (this.datas.train) {
            let forms = ["точка обучающей выборки добавлена", "точки обучающей выборки добавлены", "точек обучающей выборки добавлены"]
            MakeElement(stepsList, {class: "text", innerText: `${GetWordForm(this.datas.train.length, forms)} в дерево`}, "li")
        }

        if (this.datas.test) {
            let forms = ["точка тестовой выборки добавлена", "точки тестовой выборки добавлены", "точек тестовой выборки добавлены"]
            MakeElement(stepsList, {class: "text", innerText: `${GetWordForm(this.datas.test.length, forms)} в дерево`}, "li")
        }

        if (this.datas.background.length > 0) {
            let forms = ["случайная точка сгенерирована на компакте и добавлена", "случайные точки сгенерированы на компакте и добавлены", "случайных точек сгенерированы на компакте и добавлены"]
            MakeElement(stepsList, {class: "text", innerText: `${GetWordForm(this.datas.background.length, forms)} в дерево (с меткой 0)`}, "li")
        }
    }

    InitControls(axisX, axisY, modelOutputMode, modelOutputSize) {
        MakeElement(this.parent, {innerText: "Управление"}, "h3")
        let controls = MakeElement(this.parent, null, "ul")

        let size = MakeElement(controls, {innerHTML: "Количество точек выхода модели: "}, "li")
        this.controls["model-size"] = CloneSelect(modelOutputSize, size)
        this.controls["model-size"].addEventListener("change", () => this.modelPlot.SetSize(this.controls["model-size"].value))

        let mode = MakeElement(controls, {innerHTML: "Режим отображения выхода модели: "}, "li")
        this.controls["model-mode"] = CloneSelect(modelOutputMode, mode)
        this.controls["model-mode"].addEventListener("change", () => this.modelPlot.SetMode(this.controls["model-mode"].value))

        let x = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось X</b>: "}, "li")
        this.controls["axis-x"] = CloneSelect(axisX, x)
        this.controls["axis-x"].addEventListener("change", () => this.SetAxes())

        let y = MakeElement(controls, {innerHTML: "Проекционная координата на <b>ось Y</b>: "}, "li")
        this.controls["axis-y"] = CloneSelect(axisY, y)
        this.controls["axis-y"].addEventListener("change", () => this.SetAxes())

        if (this.datas.train) {
            let train = MakeElement(controls, {innerHTML: ""}, "li")
            this.controls["plot-train"] = MakeCheckbox(train, "Отображать обучающие точки", true)
            this.controls["plot-train"].addEventListener("change", () => this.dataPlot.SetVisibility("train", this.controls["plot-train"].checked))
        }

        if (this.datas.test) {
            let test = MakeElement(controls, {innerHTML: ""}, "li")
            this.controls["plot-test"] = MakeCheckbox(test, "Отображать тестовые точки", false)
            this.controls["plot-test"].addEventListener("change", () => this.dataPlot.SetVisibility("test", this.controls["plot-test"].checked))
        }

        let background = MakeElement(controls, {innerHTML: ""}, "li")
        this.controls["plot-background"] = MakeCheckbox(background, "Отображать фоновые точки", false)
        this.controls["plot-background"].addEventListener("change", () => this.dataPlot.SetVisibility("background", this.controls["plot-background"].checked))

        let grid = MakeElement(controls, {innerHTML: ""}, "li")
        this.controls["plot-grid"] = MakeCheckbox(grid, "Отображать сетку", false)
        this.controls["plot-grid"].addEventListener("change", () => this.dataPlot.SetGridVisibility(this.controls["plot-grid"].checked))

        let cellsMode = MakeElement(controls, {innerHTML: "Режим отображения ячеек: "}, "li")
        this.controls["cells-mode"] = MakeElement(cellsMode, {class: "basic-input inline-input"}, "select")
        MakeElement(this.controls["cells-mode"], {value: "transparent", innerText: "только контуры"}, "option")
        MakeElement(this.controls["cells-mode"], {value: "colors", innerText: "цвет по hₙ(x)"}, "option")
        this.controls["cells-mode"].value = "transparent"
        this.controls["cells-mode"].addEventListener("change", () => this.cellsPlot.SetColorMode(this.controls["cells-mode"].value))

        let cellsLayer = MakeElement(controls, {innerHTML: "Слой отображения ячеек: "}, "li")
        this.controls["cells-layer"] = MakeElement(cellsLayer, {class: "basic-input inline-input"}, "select")
        MakeElement(this.controls["cells-layer"], {value: "no", innerText: "не показывать"}, "option")
        MakeElement(this.controls["cells-layer"], {value: "-1", innerText: "все"}, "option")
        for (let i = 0; i < this.model.layers.length; i++)
            MakeElement(this.controls["cells-layer"], {value: `${i}`, innerText: `${i + 1}`}, "option")
        this.controls["cells-layer"].value = `${this.model.layers.length - 1}`
        this.controls["cells-layer"].addEventListener("change", () => this.SetCellsLayer(this.controls["cells-layer"].value))
    }

    InitDataModelPlot() {
        let dataPlotDiv = MakeElement(this.parent, {class: "data-plot"})
        let modelPlotCanvas = MakeElement(dataPlotDiv, null, "canvas")
        let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")

        let viewBox = new ViewBox(dataPlotSVG)

        this.dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
        this.dataPlot.AddPlot("train", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
        this.dataPlot.AddPlot("test", {border: "#000000", colors: ["#2191fb", "#89dd73", "#ba274a"], visible: false})
        this.dataPlot.AddPlot("background", {border: "#ffffff", colors: "#89dd73", visible: false})
        this.dataPlot.SetGridVisibility(false)

        this.modelPlot = new ModelCellsPlot(viewBox, modelPlotCanvas, this.model, this.visualizer.thresholds, this.controls["model-mode"].value, this.controls["model-size"].value)

        this.cellsPlot = new CellsPlot(viewBox, this.visualizer.thresholds, this.visualizer.compact, this.model)
        this.cellsPlot.UpdateCells()
        this.cellsPlot.SetLeafs(this.leafs)
    }

    ShowLeafsInfo() {
        let cells = Object.keys(this.cellsPlot.cells[this.model.layers.length - 1]).length
        let cellsText = this.model.inputs == 2 ? ` из ${GetWordForm(cells, ["ячейки", "ячеек", "ячеек"])} (на компакте)` : ""

        MakeElement(this.parent, {innerText: "Ячейки дерева"}, "h3")
        let info = MakeElement(this.parent, null, "ul")
        MakeElement(info, {class: "text", innerText: `Точки в дереве заполнили ${GetWordForm(this.leafs.length, ["ячейку", "ячейки", "ячеек"])}${cellsText}`}, "li")

        let trainOneLeafs = this.leafs.filter(leaf => leaf.splits.train.total == 1 && leaf.splits.background.total == 0).length
        if (trainOneLeafs > 0)
            MakeElement(info, {class: "text", innerText: `Среди них ${GetWordForm(trainOneLeafs, ["одноэлементная ячейка", "одноэлементных ячейки", "одноэлементных ячеек"])} из обучающих данных (${Round(trainOneLeafs * 100 / this.leafs.length, 100)}%)`}, "li")

        let testOneLeafs = this.leafs.filter(leaf => leaf.splits.test.total == 1 && leaf.splits.background.total == 0).length
        if (testOneLeafs > 0)
            MakeElement(info, {class: "text", innerText: `Среди них ${GetWordForm(testOneLeafs, ["одноэлементная ячейка", "одноэлементных ячейки", "одноэлементных ячеек"])} из тестовых данных (${Round(testOneLeafs * 100 / this.leafs.length, 100)}%)`}, "li")

        MakeElement(info, {class: "text", innerHTML: "<b>c<sub>n</sub>(x)</b> — нейросетевая оценка апостериорной вероятности (среднее значение ± стд. отклонение выхода модели на точках, находящихся внутри ячейки)"}, "li")
        MakeElement(info, {class: "text", innerHTML: "<b>h<sub>n</sub>(x)</b> — гистограммная оценка апостериорной вероятности ячейки"}, "li")
        MakeElement(info, {class: "text", innerHTML: "<b>|c<sub>n</sub>(x) - h<sub>n</sub>(x)|</b> — модуль разности среднего значения нейросетевой оценки и гистограммной оценки"}, "li")
    }

    InitTreeCellsTable() {
        MakeElement(this.parent, {class: "text", innerText: "Нажмите на строку таблицы, чтобы отобразить выбранную ячейку. Нажмите на заголовочный столбец, чтобы отсортировать ячейки по возрастанию значения (нажмите ещё раз для сортировки по убыванию)."}, "p")
        let treeTableDiv = MakeElement(this.parent, {class: "extree-table"})

        this.treeTable = new ExTreeTable(treeTableDiv, this.datas, this.leafs)
        this.treeTable.Plot()

        let masks = {}

        for (let [name, data] of Object.entries(this.datas))
            masks[name] = new Array(data.length).fill(false)

        this.treeTable.on("click-leaf", (leaf, value, noCells) => {
            for (let [name, data] of Object.entries(this.datas)) {
                for (let index of leaf.splits[name].indices)
                    masks[name][index] = value

                this.dataPlot.SetMask(name, noCells ? null : masks[name])
            }

            this.modelPlot.SetCell(leaf, value)
            this.cellsPlot.SetCell(leaf.key, value)
        })

        this.treeTable.on("update-filters", leafs => {
            this.cellsPlot.SetLeafs(leafs)
            this.UpdateHistograms(leafs)
        })
    }

    InitCellsHistograms() {
        let name2text = {
            "train": "Обучающие данные",
            "test": "Тестовые данные"
        }

        this.histograms = {}

        MakeElement(this.parent, {innerHTML: "Гистограмма разностей оценок |c<sub>n</sub>(x) - h<sub>n</sub>(x)|"}, "h3")

        for (let name of ["train", "test"]) {
            if (!this.datas[name])
                continue

            MakeElement(this.parent, {class: "text", innerText: `${name2text[name]}:`}, "p")

            let div = MakeElement(this.parent, {class: "histogram-plot"})
            this.histograms[name] = new HistogramPlot(div, {min: 0.05, max: 1, n: 19, color: "#ffc107", border: "#ffffff"})
        }

        this.UpdateHistograms(this.leafs)
    }

    Init3dPlots() {
        MakeElement(this.parent, {innerHTML: "Гистограммная оценка h<sub>n</sub> в 3D"}, "h3")

        let histogram3D = MakeElement(this.parent)

        let data = this.GetPolygonsMeshData()
        let layout = {margin: {l: 0, r: 0, b: 0, t: 0}, autosize: true, height: 450}
        Plotly.newPlot(histogram3D, data, layout, {displayModeBar: false, responsive: true})
    }

    GetPolygonsMeshData() {
        let data = []

        for (let leaf of this.leafs) {
            let [r, g, b] = this.visualizer.thresholds.GetOutputColor(leaf.stats.train.h)
            let polygon = this.cellsPlot.cells[this.model.layers.length - 1][leaf.key]

            if (!polygon)
                continue

            let x = []
            let y = []
            let z = []

            for (let [px, py] of polygon) {
                x.push(px)
                y.push(py)
                z.push(0)
            }

            for (let [px, py] of polygon) {
                x.push(px)
                y.push(py)
                z.push(leaf.stats.train.h)
            }

            let i = []
            let j = []
            let k = []

            for (let index = 0; index < polygon.length; index++) {
                let currDown = index
                let nextDown = (index + 1) % polygon.length

                let currUp = polygon.length + index
                let nextUp = polygon.length + (index + 1) % polygon.length

                i.push(currDown, nextUp)
                j.push(nextDown, currUp)
                k.push(currUp, nextDown)
            }

            for (let index = 2; index < polygon.length; index++) {
                i.push(0, polygon.length)
                j.push(index - 1, polygon.length + index - 1)
                k.push(index, polygon.length + index)
            }

            data.push({
                opacity: 1,
                type: "mesh3d",
                color: `rgb(${r}, ${g}, ${b})`,
                x: x, y: y, z: z,
                i: i, j: j, k: k
            })
        }

        return data
    }

    InitDataTable() {
        MakeElement(this.parent, {innerText: "Данные, которыми заполнено дерево"}, "h3")
        let dataTableDiv = MakeElement(this.parent, {class: "data-table"})

        this.dataTable = new DataTable(dataTableDiv)
        this.dataTable.Add("train", {title: "Обучающие данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})
        this.dataTable.Add("test", {title: "Тестовые данные", colors: {"-1": "#2191fb", "1": "#ba274a"}})
        this.dataTable.Add("background", {title: "Фон", colors: {"0": "#89dd73"}})
    }

    SetAxes() {
        let axisX = +this.controls["axis-x"].value
        let axisY = +this.controls["axis-y"].value

        this.dataPlot.SetAxes(axisX, axisY)
        this.modelPlot.SetAxes(axisX, axisY)
        this.cellsPlot.SetAxes(axisX, axisY)
    }

    SetCellsLayer(layer) {
        let visibility = layer != "no"
        this.cellsPlot.SetVisibility(visibility)

        if (visibility)
            this.cellsPlot.SetLayer(+layer)
    }

    UpdateHistograms(leafs) {
        let steps = [2, 2, 2.5]

        for (let [name, histogram] of Object.entries(this.histograms)) {
            let values = leafs.filter(leaf => leaf.splits[name].total > 0).map(leaf => leaf.stats[name].diff)

            let max = Math.max(...values)
            let step = 0.1

            for (let i = 0; Math.floor(max / step) < 8 && values.length > 5; i = (i + 1) % 3)
                step /= steps[i]

            let n = Math.max(2, Math.floor(max / step))

            this.histograms[name].ChangeConfig({min: step, max: n * step, n: n - 1})
            this.histograms[name].ChangeData(values)
        }
    }
}
