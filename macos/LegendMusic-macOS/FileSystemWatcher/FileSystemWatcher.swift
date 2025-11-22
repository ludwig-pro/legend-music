import Foundation
import CoreServices
import React

@objc(FileSystemWatcher)
class FileSystemWatcher: RCTEventEmitter {
    private var hasListeners = false
    private var watchedDirectories: [String] = []
    private var eventStream: FSEventStreamRef?
    private var processingEvents = false
    private var eventsQueue = [(path: String, type: String, filePath: String?)]()

    // Use a single FSEventStream to avoid opening a file descriptor for every subdirectory.
    private static let eventCallback: FSEventStreamCallback = { _, clientCallBackInfo, numEvents, eventPathsPointer, eventFlagsPointer, _ in
        guard let clientCallBackInfo else {
            return
        }

        let watcher = Unmanaged<FileSystemWatcher>.fromOpaque(clientCallBackInfo).takeUnretainedValue()
        watcher.handleEvents(numEvents: Int(numEvents), eventPathsPointer: eventPathsPointer, eventFlagsPointer: eventFlagsPointer)
    }

    override init() {
        super.init()
    }

    @objc override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc override func supportedEvents() -> [String]? {
        return ["onDirectoryChanged"]
    }

    @objc override func startObserving() {
        hasListeners = true
        if !watchedDirectories.isEmpty {
            startWatching(directories: watchedDirectories)
        }
    }

    @objc override func stopObserving() {
        hasListeners = false
        stopWatching()
    }

    @objc func setWatchedDirectories(_ directories: [String]) {
        watchedDirectories = directories.map { ($0 as NSString).standardizingPath }

        if hasListeners {
            startWatching(directories: watchedDirectories)
        }
    }

    private func startWatching(directories: [String]) {
        stopWatching()

        let normalized = directories.filter { !$0.isEmpty }
        guard !normalized.isEmpty else {
            return
        }

        var context = FSEventStreamContext(
            version: 0,
            info: UnsafeMutableRawPointer(Unmanaged.passUnretained(self).toOpaque()),
            retain: nil,
            release: nil,
            copyDescription: nil
        )

        let flags = FSEventStreamCreateFlags(
            kFSEventStreamCreateFlagFileEvents |
                kFSEventStreamCreateFlagUseCFTypes |
                kFSEventStreamCreateFlagWatchRoot |
                kFSEventStreamCreateFlagNoDefer |
                kFSEventStreamCreateFlagIgnoreSelf
        )

        guard let stream = FSEventStreamCreate(
            nil,
            FileSystemWatcher.eventCallback,
            &context,
            normalized as CFArray,
            FSEventStreamEventId(kFSEventStreamEventIdSinceNow),
            0.5,
            flags
        ) else {
            NSLog("FileSystemWatcher: Failed to create FSEventStream")
            return
        }

        eventStream = stream
        FSEventStreamScheduleWithRunLoop(stream, CFRunLoopGetMain(), CFRunLoopMode.defaultMode.rawValue)
        if !FSEventStreamStart(stream) {
            NSLog("FileSystemWatcher: Failed to start FSEventStream")
            stopWatching()
        }
    }

    private func stopWatching() {
        if let stream = eventStream {
            FSEventStreamStop(stream)
            FSEventStreamInvalidate(stream)
            FSEventStreamRelease(stream)
            eventStream = nil
        }

        eventsQueue.removeAll()
        processingEvents = false
    }

    private func handleEvents(
        numEvents: Int,
        eventPathsPointer: UnsafeMutableRawPointer,
        eventFlagsPointer: UnsafePointer<FSEventStreamEventFlags>
    ) {
        guard hasListeners else {
            return
        }

        let paths = unsafeBitCast(eventPathsPointer, to: NSArray.self) as? [String] ?? []
        if paths.isEmpty || paths.count < numEvents {
            return
        }

        for index in 0..<numEvents {
            let path = paths[index]
            let flags = eventFlagsPointer[index]
            handleEvent(path: path, flags: flags)
        }
    }

    private func handleEvent(path: String, flags: FSEventStreamEventFlags) {
        let normalizedPath = (path as NSString).standardizingPath
        let eventType = determineEventType(flags: flags)
        let directoryPath = (normalizedPath as NSString).deletingLastPathComponent

        queueEvent(path: directoryPath, type: eventType, filePath: normalizedPath)
        processQueuedEvents()
    }

    private func determineEventType(flags: FSEventStreamEventFlags) -> String {
        if flags & FSEventStreamEventFlags(kFSEventStreamEventFlagItemRemoved) != 0 {
            return "delete"
        }

        if flags & FSEventStreamEventFlags(kFSEventStreamEventFlagItemCreated) != 0 {
            return "add"
        }

        if flags & FSEventStreamEventFlags(kFSEventStreamEventFlagItemRenamed) != 0 ||
            flags & FSEventStreamEventFlags(kFSEventStreamEventFlagItemModified) != 0 {
            return "change"
        }

        return "change"
    }

    private func queueEvent(path: String, type: String, filePath: String?) {
        eventsQueue.append((path: path, type: type, filePath: filePath))
    }

    private func processQueuedEvents() {
        if processingEvents {
            return
        }

        processingEvents = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            guard let self else {
                return
            }

            var uniqueEvents = [String: (type: String, dirPath: String)]()

            for event in self.eventsQueue {
                let eventKey = event.filePath ?? event.path
                uniqueEvents[eventKey] = (type: event.type, dirPath: event.path)
            }

            self.eventsQueue.removeAll()
            self.processingEvents = false

            for (filePath, details) in uniqueEvents {
                self.emitChange(path: details.dirPath, filePath: filePath, type: details.type)
            }
        }
    }

    private func emitChange(path: String, filePath: String, type: String) {
        guard hasListeners else {
            return
        }

        DispatchQueue.main.async {
            self.sendEvent(withName: "onDirectoryChanged", body: [
                "path": path,
                "filePath": filePath,
                "type": type,
            ])
        }
    }

    @objc func isWatchingDirectory(
        _ directory: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter _: @escaping RCTPromiseRejectBlock
    ) {
        let normalized = (directory as NSString).standardizingPath
        let isWatched = watchedDirectories.contains {
            normalized == $0 || normalized.hasPrefix(($0 as NSString).appendingPathComponent(""))
        }
        resolve(isWatched)
    }
}
