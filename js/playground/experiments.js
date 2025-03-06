Playground.prototype.RunSyntheticDataExperiment = function() {
    let count = this.syntheticDataBackgroundCount.GetValue()
    let data = this.visualizer.GenerateSyntheticData(count)
    let split = {data: data, stats: data.GetStatistic()}
    let low = this.visualizer.thresholds.low
    let high = this.visualizer.thresholds.high

    this.tabExperiments.innerHTML = ""
    MakeElement(this.tabExperiments, {innerText: "Генерация синтетических данных"}, "h2")
    let stepsList = MakeElement(this.tabExperiments, null, "ul")
    MakeElement(stepsList, {class: "text", innerText: `Сгенерированы ${count} случайных точек на компакте`}, "li")
    MakeElement(stepsList, {class: "text", innerHTML: "Для каждой сгенерированной точки x<sub>i</sub> была получено предсказание модели y<sub>i</sub>"}, "li")
    MakeElement(stepsList, {class: "text", innerHTML: `Точки ${low} &le; y<sub>i</sub> &lt; ${high} были удалены (пороги доверия)`}, "li")
    MakeElement(stepsList, {class: "text", innerHTML: "Точка x<sub>i</sub> с вероятностью |y<sub>i</sub>| была отобрана в качестве синтетической"}, "li")

    if (data.length == 0) {
        MakeElement(stepsList, {class: "text", innerText: "В результате все сгенерированные точки были отвергнуты"}, "li")
        return
    }

    MakeElement(stepsList, {class: "text", innerHTML: `В результате были отобраны <b>${data.length}</b> точек (${Round(data.length * 100 / count, 10)}%):`}, "li")

    let dataPlotDiv = MakeElement(this.tabExperiments, {class: "data-plot", style: "width: 300px; height: 300px;"})
    let dataPlotSVG = MakeElement(dataPlotDiv, null, "svg")
    let dataTableDiv = MakeElement(this.tabExperiments, {class: "data-table"})

    let viewBox = new ViewBox(dataPlotSVG)
    let compact = new Compact()

    let dataPlot = new DataPlot(dataPlotDiv, viewBox, this.visualizer.compact)
    dataPlot.AddPlot("synthetic", {border: "#ffffff", colors: ["#2191fb", "#89dd73", "#dd7373"], visible: true})
    dataPlot.SetAxes(+this.axisX.value, +this.axisY.value)

    let dataTable = new DataTable(dataTableDiv)
    dataTable.Add("synthetic", {title: "Синтетические данные", colors: {"-1": "#2191fb", "1": "#dd7373"}})

    dataTable.ChangeData("synthetic", split)
    dataPlot.ChangeData("synthetic", split)
    dataPlot.ResetLimits()
}
