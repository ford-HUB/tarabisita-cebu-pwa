import os from 'os'
import { monitorEventLoopDelay } from 'perf_hooks'

const MAX_LOGS = 500
const MAX_REQUEST_POINTS = 5000
const MAX_RESPONSE_SERIES = 120

const logBuffer = []
const requestPoints = []
const responseTimeSeries = []

const eventLoopHistogram = monitorEventLoopDelay({ resolution: 20 })
eventLoopHistogram.enable()

let consoleCaptureEnabled = false

const nowIso = () => new Date().toISOString()
const ANSI_ESCAPE_REGEX = /\u001b\[[0-9;]*m/g

const toFiniteNumber = (value, fallback = 0) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
}

const toLogMessage = (args) =>
    args
        .map((item) => {
            if (typeof item === 'string') return item
            try {
                return JSON.stringify(item)
            } catch {
                return String(item)
            }
        })
        .join(' ')

const pushBounded = (arr, item, maxLength) => {
    arr.push(item)
    if (arr.length > maxLength) {
        arr.splice(0, arr.length - maxLength)
    }
}

export const appendSystemLog = ({ level = 'info', source = 'app', message = '' }) => {
    pushBounded(
        logBuffer,
        {
            timestamp: nowIso(),
            level: String(level || 'info').toLowerCase(),
            source: String(source || 'app'),
            message: String(message || '').trim(),
            statusCode: null
        },
        MAX_LOGS
    )
}

export const recordHttpTiming = ({ method = '', path = '', statusCode = 0, durationMs = 0 }) => {
    const point = {
        timestamp: Date.now(),
        method: String(method || 'GET').toUpperCase(),
        path: String(path || ''),
        statusCode: toFiniteNumber(statusCode, 0),
        durationMs: toFiniteNumber(durationMs, 0)
    }
    pushBounded(requestPoints, point, MAX_REQUEST_POINTS)
    pushBounded(responseTimeSeries, { timestamp: point.timestamp, value: point.durationMs }, MAX_RESPONSE_SERIES)
}

const computeRequestStats = () => {
    const oneMinuteAgo = Date.now() - 60_000
    const lastMinute = requestPoints.filter((point) => point.timestamp >= oneMinuteAgo)
    const durations = lastMinute.map((point) => point.durationMs).sort((a, b) => a - b)
    const count = durations.length
    const avgResponseMs = count > 0 ? durations.reduce((sum, value) => sum + value, 0) / count : 0
    const p95Index = count > 0 ? Math.min(count - 1, Math.floor(count * 0.95)) : 0
    const p95ResponseMs = count > 0 ? durations[p95Index] : 0
    return {
        requestsLastMinute: count,
        avgResponseMs,
        p95ResponseMs,
        minResponseMs: count > 0 ? durations[0] : 0,
        maxResponseMs: count > 0 ? durations[count - 1] : 0
    }
}

const computeEventLoopStats = () => {
    const nsToMs = (value) => toFiniteNumber(value, 0) / 1_000_000
    const stats = {
        meanMs: nsToMs(eventLoopHistogram.mean),
        maxMs: nsToMs(eventLoopHistogram.max),
        p95Ms: nsToMs(eventLoopHistogram.percentile(95))
    }
    eventLoopHistogram.reset()
    return stats
}

export const getSystemPerformanceSnapshot = () => {
    const mem = process.memoryUsage()
    const requestStats = computeRequestStats()
    const eventLoop = computeEventLoopStats()

    return {
        timestamp: nowIso(),
        uptimeSeconds: Math.floor(process.uptime()),
        memory: {
            rssMb: toFiniteNumber(mem.rss / 1024 / 1024),
            heapUsedMb: toFiniteNumber(mem.heapUsed / 1024 / 1024),
            heapTotalMb: toFiniteNumber(mem.heapTotal / 1024 / 1024)
        },
        cpu: {
            loadAverage1m: toFiniteNumber(os.loadavg()[0]),
            loadAverage5m: toFiniteNumber(os.loadavg()[1]),
            loadAverage15m: toFiniteNumber(os.loadavg()[2])
        },
        eventLoop,
        http: requestStats,
        responseTimeSeries: [...responseTimeSeries],
        logs: [...logBuffer].reverse()
    }
}

export const captureConsoleForSystemPerformance = () => {
    if (consoleCaptureEnabled) return
    consoleCaptureEnabled = true

    const original = {
        log: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    }

    console.log = (...args) => {
        appendSystemLog({ level: 'info', source: 'console', message: toLogMessage(args) })
        original.log(...args)
    }
    console.info = (...args) => {
        appendSystemLog({ level: 'info', source: 'console', message: toLogMessage(args) })
        original.info(...args)
    }
    console.warn = (...args) => {
        appendSystemLog({ level: 'warn', source: 'console', message: toLogMessage(args) })
        original.warn(...args)
    }
    console.error = (...args) => {
        appendSystemLog({ level: 'error', source: 'console', message: toLogMessage(args) })
        original.error(...args)
    }
}

export const writeMorganLineToTelemetry = (line) => {
    const rawMessage = String(line || '').trim()
    if (!rawMessage) return
    const message = rawMessage.replace(ANSI_ESCAPE_REGEX, '')
    const statusMatch = message.match(/\b(\d{3})\b/)
    const statusCode = statusMatch ? Number(statusMatch[1]) : null
    pushBounded(
        logBuffer,
        {
            timestamp: nowIso(),
            level: 'info',
            source: 'http',
            message,
            statusCode: Number.isFinite(statusCode) ? statusCode : null
        },
        MAX_LOGS
    )
}
