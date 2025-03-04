class ViewBox extends EventEmitter {
    constructor(svg, x = 0, y = 0, width = 1, height = 1) {
        super()

        this.svg = svg
        this.point = null

        this.svg.addEventListener("mousedown", e => this.MouseDown(e))
        this.svg.addEventListener("mousemove", e => this.MouseMove(e))
        this.svg.addEventListener("mouseup", e => this.MouseUp())
        this.svg.addEventListener("mouseleave", e => this.MouseUp())

        this.svg.addEventListener("touchstart", e => this.TouchStart(e))
        this.svg.addEventListener("touchmove", e => this.TouchMove(e))
        this.svg.addEventListener("touchup", e => this.MouseUp())
        this.svg.addEventListener("touchleave", e => this.MouseUp())

        this.svg.addEventListener("wheel", e => this.Wheel(e))
        new ResizeObserver(() => this.Resize()).observe(this.svg)

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

        this.emit("change-view")
        this.Update()
    }

    Resize() {
        let dw = (this.svg.clientWidth / this.width - 1) * this.bbox.width
        let dh = (this.svg.clientHeight / this.height - 1) * this.bbox.height

        this.bbox.y -= dh
        this.bbox.width += dw
        this.bbox.height += dh

        this.width = this.svg.clientWidth
        this.height = this.svg.clientHeight

        this.emit("change-view")
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
        this.emit("change-limits", this.GetLimits())
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

        this.emit("scale", this.GetScale())
        this.Update()
    }

    GetPoint(e) {
        if (e.touches)
            return this.GetTouchPoint(e.touches[0])

        return {x: e.offsetX, y: e.offsetY}
    }

    GetTouchPoint(touch) {
        let bbox = this.svg.getBoundingClientRect()
        return {x: touch.clientX - bbox.left, y: touch.clientY - bbox.top}
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
        let point = this.GetPoint(e)

        if (e.ctrlKey || e.shiftKey) {
            let x = this.ScreenToX(point.x)
            let y = this.ScreenToY(point.y)
            this.emit("click", e, x, y)
            return
        }

        this.point = point
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

    MouseUp() {
        this.point = null
    }

    TouchStart(e) {
        if (e.touches.length == 1) {
            e.preventDefault()
            this.MouseDown(e)
            return
        }

        if (e.touches.length == 2) {
            e.preventDefault()
            this.point1 = this.GetTouchPoint(e.touches[0])
            this.point2 = this.GetTouchPoint(e.touches[1])
        }
    }

    TouchMove(e) {
        if (e.touches.length == 1) {
            e.preventDefault()
            this.MouseMove(e)
            return
        }

        if (e.touches.length == 2) {
            e.preventDefault()
            let point1 = this.GetTouchPoint(e.touches[0])
            let point2 = this.GetTouchPoint(e.touches[1])

            let c1 = this.GetCenter(this.point1, this.point2)
            let c2 = this.GetCenter(point1, point2)
            let dx = c1.x - c2.x
            let dy = c1.y - c2.y

            let dst1 = this.GetDistance(this.point1, this.point2)
            let dst2 = this.GetDistance(point1, point2)
            let scale = dst1 / dst2

            this.x += dx * this.scale
            this.y +=  dy * this.scale
            this.ScaleAt(this.x + c2.x * this.scale, this.y + c2.y * this.scale, scale)

            this.point1 = point1
            this.point2 = point2
            this.point = null
        }
    }

    GetDistance(p1, p2) {
        let dx = p1.x - p2.x
        let dy = p1.y - p2.y
        return Math.sqrt(dx*dx + dy*dy)
    }

    GetCenter(p1, p2) {
        return {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2}
    }
}
