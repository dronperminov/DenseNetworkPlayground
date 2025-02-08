class ViewBox extends EventEmitter {
    constructor(svg, x = 0, y = 0, width = 1, height = 1) {
        super()

        this.svg = svg
        this.point = null

        this.svg.addEventListener("mousedown", e => this.MouseDown(e))
        this.svg.addEventListener("mousemove", e => this.MouseMove(e))
        this.svg.addEventListener("mouseup", e => this.MouseUp(e))
        this.svg.addEventListener("mouseleave", e => this.MouseUp(e))
        this.svg.addEventListener("wheel", e => this.Wheel(e))

        this.SetLimits(x, y, width, height)
    }

    SetLimits(x, y, width, height, eps = 0) {
        let dw = width / this.svg.clientWidth
        let dh = height / this.svg.clientHeight
        let scale = Math.max(dw, dh)

        let newWidth = scale * this.svg.clientWidth
        let newHeight = scale * this.svg.clientHeight

        eps *= scale

        this.bbox = {
            x: x - (newWidth - width) / 2 - newWidth * eps / 2,
            y: y - (newHeight - height) / 2 - newHeight * eps / 2,
            width: newWidth * (1 + eps),
            height: newHeight * (1 + eps)
        }

        this.ResetView()
    }

    ResetView() {
        this.x = 0
        this.y = 0
        this.scale = 1
        this.width = this.svg.clientWidth
        this.height = this.svg.clientHeight

        this.emit("scale")
        this.Update()
    }

    XtoScreen(x) {
        return (x - this.bbox.x) / this.bbox.width * this.width
    }

    YtoScreen(y) {
        return (this.bbox.y + this.bbox.height - y) / this.bbox.height * this.height
    }

    ScreenToX(screenX) {
        return this.bbox.x + (this.x + screenX * this.scale) / this.width * this.bbox.width
    }

    ScreenToY(screenY) {
        return this.bbox.y + this.bbox.height - (this.y + screenY * this.scale) / this.height * this.bbox.height
    }

    GetLimits() {
        return {
            xmin: this.ScreenToX(0),
            xmax: this.ScreenToX(this.width),
            ymin: this.ScreenToY(this.height),
            ymax: this.ScreenToY(0)
        }
    }

    GetScale() {
        return Math.min(this.scale, 1)
    }

    Update() {
        this.svg.setAttribute("viewBox", `${this.x} ${this.y} ${this.width * this.scale} ${this.height * this.scale}`)
        this.emit("change", this.bbox.x, this.bbox.y, this.bbox.width, this.bbox.height)
    }

    Move(dx, dy) {
        this.x += dx
        this.y += dy
        this.Update()
    }

    ScaleAt(x, y, scale) {
        this.scale *= scale
        this.x = x - (x - this.x) * scale
        this.y = y - (y - this.y) * scale

        this.emit("scale")
        this.Update()
    }

    GetPoint(e) {
        return {x: e.offsetX, y: e.offsetY}
    }

    Wheel(e) {
        e.preventDefault()

        if (e.shiftKey) {
            this.Move(this.width * this.scale / 10 * Math.sign(e.deltaY), 0)
            return
        }

        if (e.ctrlKey) {
            this.Move(0, this.height * this.scale / 10 * Math.sign(e.deltaY))
            return
        }

        let point = this.GetPoint(e)
        let x = this.x + point.x * this.scale
        let y = this.y + point.y * this.scale
        let scale = e.deltaY > 0 ? 2 : 0.5

        this.ScaleAt(x, y, scale)
    }

    MouseDown(e) {
        this.point = this.GetPoint(e)
    }

    MouseMove(e) {
        if (!this.point)
            return

        let point = this.GetPoint(e)
        let dx = (this.point.x - point.x) * this.scale
        let dy = (this.point.y - point.y) * this.scale

        this.Move(dx, dy)
        this.point = point
    }

    MouseUp(e) {
        this.point = null
    }
}
