class TestPerformance {
    GetRow(name, t0, t1, t2, t3, t4, loopsWarmUp, loopsTest) {
        let warmUp = Round((t1 - t0) / loopsWarmUp * 1000, 100)
        let test = Round((t2 - t1) / loopsTest * 1000, 100)
        let total = Round((t2 - t0) / (loopsWarmUp + loopsTest) * 1000, 100)

        let warmUpUnrolled = Round((t3 - t2) / loopsWarmUp * 1000, 100)
        let testUnrolled = Round((t4 - t3) / loopsTest * 1000, 100)
        let totalUnrolled = Round((t4 - t2) / (loopsWarmUp + loopsTest) * 1000, 100)

        let warmUpSpeedUp = Round(warmUp / warmUpUnrolled, 1000)
        let testSpeedUp = Round(test / testUnrolled, 1000)
        let totalSpeedUp = Round(total / totalUnrolled, 1000)

        let cells = [
            `<td><b>${name}</b></td>`,

            `<td class="main-column">${warmUp}</td>`,
            `<td>${warmUpUnrolled}</td>`,
            `<td class="${this.GetSpeedUpClass(warmUpSpeedUp)}">${warmUpSpeedUp}</td>`,

            `<td class="main-column">${test}</td>`,
            `<td>${testUnrolled}</td>`,
            `<td class="${this.GetSpeedUpClass(testSpeedUp)}">${testSpeedUp}</td>`,

            `<td class="main-column">${total}</td>`,
            `<td>${totalUnrolled}</td>`,
            `<td class="${this.GetSpeedUpClass(totalSpeedUp)}">${totalSpeedUp}</td>`
        ]

        return cells.join("")
    }

    GetSpeedUpClass(speedup) {
        if (speedup > 1.7)
            return "high-speedup"

        if (speedup > 1.1)
            return "speedup"

        if (speedup < 0.7)
            return "high-speeddown"

        if (speedup < 0.95)
            return "speeddown"

        return ""
    }
}
