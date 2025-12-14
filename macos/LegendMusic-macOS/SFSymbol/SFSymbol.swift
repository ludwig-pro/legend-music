import Foundation
import AppKit
import React

@objc(RNSFSymbol)
class RNSFSymbol: RCTViewManager {
    override func view() -> NSView! {
        return SFSymbolView()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

class SFSymbolView: NSView {
    private let imageView = NSImageView()
    private let defaultSize: CGFloat = 24

    @objc var name: String = "" {
        didSet {
            updateSymbol()
        }
    }

    @objc var color: NSColor? = nil {
        didSet {
            updateSymbol()
        }
    }

    @objc var scale: String = "medium" {
        didSet {
            updateSymbol()
        }
    }

    @objc var size: NSNumber? = nil {
        didSet {
            updateSymbol()
        }
    }

    @objc var yOffset: NSNumber? = nil {
        didSet {
            updateSymbol()
        }
    }

    override init(frame: NSRect) {
        super.init(frame: frame)
        setupView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        imageView.translatesAutoresizingMaskIntoConstraints = false
        imageView.imageScaling = .scaleProportionallyUpOrDown
        imageView.imageAlignment = .alignCenter

        addSubview(imageView)

        NSLayoutConstraint.activate([
            imageView.topAnchor.constraint(equalTo: topAnchor),
            imageView.leadingAnchor.constraint(equalTo: leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: trailingAnchor),
            imageView.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }

    private func updateSymbol() {
        guard !name.isEmpty else {
            imageView.image = nil
            imageView.contentTintColor = nil
            return
        }

        let symbolScale: NSImage.SymbolScale
        switch scale {
        case "small":
            symbolScale = .small
        case "large":
            symbolScale = .large
        default:
            symbolScale = .medium
        }

        // Prefer the explicit size, otherwise fall back to the current view bounds
        let targetSize = size?.doubleValue ?? Double(min(bounds.width, bounds.height))
        let pointSize = CGFloat(targetSize > 0 ? targetSize : Double(defaultSize))

        guard let symbolImage = NSImage(systemSymbolName: name, accessibilityDescription: nil) else {
            print("SF Symbol not found: \(name)")
            imageView.image = nil
            imageView.contentTintColor = nil
            return
        }

        let scaleConfig = NSImage.SymbolConfiguration(scale: symbolScale)
        let pointSizeConfig = NSImage.SymbolConfiguration(pointSize: pointSize, weight: .regular)

        var configuredImage = symbolImage
        if let scaledImage = configuredImage.withSymbolConfiguration(scaleConfig) {
            configuredImage = scaledImage
        }
        if let sizedImage = configuredImage.withSymbolConfiguration(pointSizeConfig) {
            configuredImage = sizedImage
        }

        // Normalize the symbol into a square canvas and align it by its alignment rect center.
        // This avoids visible cropping while keeping different symbols vertically centered.
        let alignmentRect = configuredImage.alignmentRect
        let boxSize = max(pointSize, 1)
        let sourceSize = configuredImage.size
        let sourceCenterX = sourceSize.width / 2
        let sourceCenterY = sourceSize.height / 2
        let alignmentCenterX = alignmentRect.midX
        let alignmentCenterY = alignmentRect.midY

        let extraX = abs(sourceCenterX - alignmentCenterX) * 2
        let extraY = abs(sourceCenterY - alignmentCenterY) * 2

        let scaleX = boxSize / max(sourceSize.width + extraX, 1)
        let scaleY = boxSize / max(sourceSize.height + extraY, 1)
        let drawScale = min(scaleX, scaleY)

        let alignedImage = NSImage(size: NSSize(width: boxSize, height: boxSize))
        alignedImage.lockFocusFlipped(false)
        NSGraphicsContext.current?.imageInterpolation = .high

        let drawWidth = sourceSize.width * drawScale
        let drawHeight = sourceSize.height * drawScale

        let drawOriginX = (boxSize / 2) - (alignmentCenterX * drawScale)
        let drawOriginY = ((boxSize + CGFloat(yOffset?.doubleValue ?? 0)) / 2) - (alignmentCenterY * drawScale)

        configuredImage.draw(
            in: NSRect(x: drawOriginX, y: drawOriginY, width: drawWidth, height: drawHeight),
            from: .zero,
            operation: .sourceOver,
            fraction: 1.0,
            respectFlipped: true,
            hints: nil
        )

        alignedImage.unlockFocus()
        alignedImage.isTemplate = configuredImage.isTemplate
        imageView.image = alignedImage
        imageView.contentTintColor = color
    }

    override func layout() {
        super.layout()
        updateSymbol()
    }
}
