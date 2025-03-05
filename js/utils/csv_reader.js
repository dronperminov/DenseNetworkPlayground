class CSVReader {
    Read(text, delimeter = ";") {
        if (text.match(/^\s*$/) !== null)
            throw new Error("пустой файл")

        let lines = text.split("\n")

        if (lines.length < 2)
            throw new Error("в файле должно быть хотя бы 2 строки")

        let header = lines[0].split(delimeter)
        this.ValidateHeader(header)

        let rows = []

        for (let i = 1; i < lines.length; i++) {
            let row = lines[i].split(delimeter)
            this.ValidateRow(row, i + 1, header.length - 1)

            for (let j = 0; j < row.length; j++)
                row[j] = +row[j]

            rows.push(row)
        }

        return {header, rows}
    }

    ValidateRow(row, lineNumber, dimension) {
        if (row.length != dimension + 1)
            throw new Error(`некорректное количество входных значений (${row.length}) в строке ${lineNumber} (ожидалось ${dimension + 1})`)

        for (let i = 0; i < dimension; i++)
            if (isNaN(row[i]) || row[i].match(/^\s*$/) !== null)
                throw new Error(`некорректное значение "${row[i]}" в строке ${lineNumber} (ожидалось вещественное число)`)

        if (!row[dimension].match(/^(-1|1)$/))
            throw new Error(`некорректная метка "${row[dimension]}" в строке ${lineNumber} (ожидалось -1 или 1)`)
    }

    ValidateHeader(header) {
        if (header.length < 2)
            throw new Error("в заголовке должно быть хотя бы два столбца")

        let names = new Set()

        for (let name of header) {
            name = name.toLowerCase()

            if (names.has(name))
                throw new Error("все названия столбцов заголовка должны быть различны")

            names.add(name)
        }
    }
}
