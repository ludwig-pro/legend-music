import Foundation
import ID3TagEditor

@objc(LMID3TagsResult)
final class LMID3TagsResult: NSObject {
    @objc let title: String?
    @objc let artist: String?
    @objc let album: String?
    @objc let durationSeconds: NSNumber?
    @objc let artworkData: NSData?

    init(title: String?, artist: String?, album: String?, durationSeconds: NSNumber?, artworkData: NSData?) {
        self.title = title
        self.artist = artist
        self.album = album
        self.durationSeconds = durationSeconds
        self.artworkData = artworkData
    }
}

@objc(LMID3TagEditorBridge)
final class LMID3TagEditorBridge: NSObject {
    @objc(readTagsForURL:error:)
    static func readTags(for url: NSURL, error: NSErrorPointer) -> LMID3TagsResult? {
        guard url.isFileURL, let path = url.path else {
            return nil
        }

        let normalizedPath = path.lowercased()
        guard normalizedPath.hasSuffix(".mp3") else {
            return nil
        }

        do {
            let editor = ID3TagEditor()
            guard let tag = try editor.read(from: path) else {
                return nil
            }

            let title = (tag.frames[.title] as? ID3FrameWithStringContent)?.content
            let artist = (tag.frames[.artist] as? ID3FrameWithStringContent)?.content
            let album = (tag.frames[.album] as? ID3FrameWithStringContent)?.content

            let durationMs = (tag.frames[.lengthInMilliseconds] as? ID3FrameWithIntegerContent)?.value
            let durationNumber = durationMs.map { NSNumber(value: Double($0) / 1000.0) }

            let artworkData = preferredArtwork(from: tag)?.picture as NSData?

            return LMID3TagsResult(
                title: title,
                artist: artist,
                album: album,
                durationSeconds: durationNumber,
                artworkData: artworkData
            )
        } catch let readError as NSError {
            error?.pointee = readError
            return nil
        }
    }

    private static func preferredArtwork(from tag: ID3Tag) -> ID3FrameAttachedPicture? {
        let pictures = tag.frames.compactMap { (name, frame) -> ID3FrameAttachedPicture? in
            guard case .attachedPicture = name else {
                return nil
            }
            return frame as? ID3FrameAttachedPicture
        }

        if let frontCover = pictures.first(where: { $0.type == .frontCover }) {
            return frontCover
        }

        if let other = pictures.first(where: { $0.type == .other }) {
            return other
        }

        return pictures.first
    }
}
