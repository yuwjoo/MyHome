import android.util.Log
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout

/**
 * 消息发送结果
 */
enum class SendResult {
    SUCCESS, // 成功（已确认送达）
    FAILED, // 失败（重试达到上限）
    ABORT, // 中止（被停止/中止）
}

/**
 * 任务状态
 */
enum class TaskState {
    WAITING, // 等待中（已入队，尚未开始发送）
    FLYING, // 飞行中（已发送，等待确认）
    SUCCESS, // 成功（已确认送达）
    FAILED, // 失败（重试达到上限）
    ABORTED, // 中止（被停止/中止）
}

/**
 * 消息重试策略：计算等待确认超时时间，判断是否达到重试上限
 */
internal object RetryStrategy {
    private const val BASE_TIMEOUT_MS = 300L // 基础超时时间（毫秒）：等待确认超时
    private const val BACKOFF_BASE_MS = 300L // 指数退避基础间隔（毫秒）
    private const val BACKOFF_MAX_MS = 10_000L // 指数退避最大间隔（毫秒），退避延迟封顶

    /**
     * 计算指定发送次数下的等待确认超时时间（基础超时 + 指数退避延迟，封顶 [BACKOFF_MAX_MS]）
     *
     * @param sendCount 已发送次数（含首次发送）
     * @return 超时时间（毫秒），首次发送时为 [BASE_TIMEOUT_MS]
     */
    fun timeoutMs(sendCount: Int): Long {
        if (sendCount <= 1) return BASE_TIMEOUT_MS
        var delay = BACKOFF_BASE_MS
        repeat(sendCount - 2) { delay = minOf(delay * 2, BACKOFF_MAX_MS) }
        return BASE_TIMEOUT_MS + delay
    }

    /**
     * 判断指定发送次数是否已用尽重试次数
     *
     * @param sendCount 已发送次数（含首次发送）
     * @param maxRetry  最大重试次数，-1 表示不限制
     * @return true 表示达到上限，应判定为发送失败
     */
    fun isExhausted(sendCount: Int, maxRetry: Int): Boolean =
        maxRetry >= 0 && sendCount > maxRetry
}

/**
 * 设备消息任务：自持发送协程的单条消息
 *
 * @param data      待发送数据
 * @param onDone    完成回调（消息处理结束时调用，参数为结果）
 * @param sendFrame 发送消息帧回调（data、seq）
 */
class DeviceMessageTask(
    val data: ByteArray, // 待发送数据
    private val onDone: (result: SendResult) -> Unit = {}, // 完成回调
    private val sendFrame: (data: ByteArray, seq: Int) -> Unit = {}, // 发送帧回调
) {
    companion object {
        private const val TAG = "DeviceMessageTask"

        private val sendScope = CoroutineScope(Dispatchers.IO) // 发送协程作用域
    }

    var state: TaskState = TaskState.WAITING // 任务状态
        private set

    var seq: Int = 0 // 分配的消息序号
        private set
    
    private var job: Job? = null // 发送协程
    
    private var waitAck: CompletableDeferred<Unit>? = null // 等待确认状态

    /**
     * 运行任务
     *
     * @param sendSeq   发送消息序号
     * @param maxRetry 最大重试次数，-1 表示不限制（默认）
     */
    fun run(sendSeq: Int, maxRetry: Int = -1) {
        if (state != TaskState.WAITING) return // 状态不为等待中，不允许运行
        state = TaskState.FLYING // 运行时将状态改为飞行中
        seq = sendSeq
        waitAck = CompletableDeferred()
        job = sendScope.launch {
            var sendCount = 0 // 已发送次数
            while (isActive) {
                sendCount++
                sendFrame(data, seq) // 发送消息
                val acked = try {
                    withTimeout(RetryStrategy.timeoutMs(sendCount)) {
                        waitAck.await() // 等待确认状态由 false 变为 true（收到确认）
                    }
                    true
                } catch (e: TimeoutCancellationException) {
                    false // 等待确认超时
                }
                // 收到确认回复
                if (acked) {
                    state = TaskState.SUCCESS
                    onDone(SendResult.SUCCESS)
                    return@launch
                }
                // 重试次数用尽
                if (RetryStrategy.isExhausted(sendCount, maxRetry)) {
                    state = TaskState.FAILED
                    onDone(SendResult.FAILED)
                    return@launch
                }
            }
        }
    }

    /**
     * 停止任务
     */
    fun stop() {
        if (state != TaskState.FLYING) return // 状态不为飞行中，无需停止
        waitAck?.cancel()
        waitAck = null
        job?.cancel()
        job = null
        state = TaskState.WAITING // 状态改为等待中
    }

    /**
     * 确认消息送达
     */
    fun ack() {
        waitAck?.complete(Unit)
    }

    /**
     * 中止任务
     */
    fun abort() {
        if (state == TaskState.SUCCESS || state == TaskState.FAILED || state == TaskState.ABORTED) return // 已结束则忽略
        waitAck?.cancel()
        waitAck = null
        job?.cancel()
        job = null
        state = TaskState.ABORTED
        onDone(SendResult.ABORT)
    }
}

/**
 * 设备消息中心：每台设备一条 FIFO 队列，消息由 DeviceMessageTask 自持协程发送
 *
 * - 同设备同一时刻仅一条消息在发送（消息结束后自动发送下一条）
 * - 发送时永远取最早入队的那条数据，队首即当前正在发送的任务
 * - 超时按指数退避无限重发，可通过 maxRetry 限制重试次数
 */
internal class DeviceMessageCenter(
    private val onSendFrame: (data: ByteArray, seq: Int, ip: String) -> Unit, // 发送消息帧回调
    private val deviceMap: HashMap<String, LanDevice>, // 设备映射表
) {
    companion object {
        private const val TAG = "DeviceMessageCenter"
    }

    private val queues = HashMap<String, ArrayDeque<DeviceMessageTask>>() // 设备消息队列集合（FIFO，先进先出，队首即当前正在发送的任务）

    /**
     * 向指定设备加入一条待发送消息（先进先出，排在队尾），并启动发送（若当前无消息在发送）
     *
     * @param ip     设备 IP
     * @param data   待发送数据
     * @param onDone 完成回调（消息处理结束时调用，参数为结果，可省略）
     */
    fun enqueue(ip: String, data: ByteArray, onDone: (status: SendResult) -> Unit = {}) {
        val queue = queues.getOrPut(ip) { ArrayDeque() }
        lateinit var task: DeviceMessageTask
        task = DeviceMessageTask(
            data = data,
            onDone = { status ->
                if (queues[ip] === queue) { // 队列仍在管理中才驱动下一条（clearTask 移除队列后不再驱动）
                    if (status == SendResult.SUCCESS) deviceMap[ip]?.lastSendSeq = task.seq // 送达后更新设备已确认序号
                    if (queue.peekFirst() === task) queue.removeFirst() // 任务结束移出队列
                    if (queue.isNotEmpty()) startNext(ip, queue) else queues.remove(ip) // 驱动下一条或清理空队列
                }
                onDone(status) // 通知调用方
            },
            sendFrame = { d, seq -> onSendFrame(d, seq, ip) },
        )
        queue.addLast(task)
        startNext(ip, queue)
    }

    /**
     * 清空指定设备的待发送任务（回调以 ABORT 结果结束；同时停止发送）
     *
     * @param ip 设备 IP
     */
    fun clearTask(ip: String) {
        val queue = queues.remove(ip) ?: return
        queue.forEach { task -> task.abort() } // 统一中止并完成任务（已结束任务自动忽略）
    }

    /**
     * 启动指定设备的消息发送（队首任务未在运行则启动；设备无任务时无操作）
     *
     * @param ip 设备 IP
     */
    fun startJob(ip: String) {
        val queue = queues[ip] ?: return
        startNext(ip, queue)
    }

    /**
     * 停止指定设备的消息发送（取消正在发送的任务，任务复位为等待中）
     *
     * @param ip 设备 IP
     */
    fun stopJob(ip: String) {
        queues[ip]?.peekFirst()?.stop() // 停止正在发送的任务（取消协程并复位为等待中）
    }

    /**
     * 确认设备消息已送达（收到应答时调用）
     *
     * 序号匹配则标记消息已送达；序号不匹配则停止当前发送（复位为等待中），是否重新发送由调用方决定
     *
     * @param ip      设备 IP
     * @param seq     已送达的消息序号（收到的 Ack 负载 AckSeq，暂未使用）
     * @param recvSeq 对端当前允许接收的有序消息序号（收到的 Ack 负载 RecvSeq）
     * @return true 已确认送达；false 序号失配已停止发送，需由调用方重新启动
     */
    fun ack(ip: String, seq: Int, recvSeq: Int): Boolean {
        val task = queues[ip]?.peekFirst() ?: return false
        if (recvSeq == task.seq) {
            task.ack() // 序号匹配，确认送达
            return true
        }
        task.stop() // 序号失配，停止当前发送，重新运行交给外界处理
        return false
    }

    /**
     * 启动队首任务发送（队首已在运行或无任务时无操作）
     *
     * @param ip    设备 IP
     * @param queue 设备队列
     */
    private fun startNext(ip: String, queue: ArrayDeque<DeviceMessageTask>) {
        val task = queue.peekFirst() ?: return
        if (task.state == TaskState.WAITING || task.state == TaskState.FLYING) return // 已在运行
        val device = deviceMap[ip]
        if (device == null) {
            Log.w(TAG, "startNext: device $ip not found, drop message")
            queue.removeFirst()
            task.abort() // 设备不存在，中止任务并回调 ABORT
            return
        }
        task.run(device.nextSendSeq) // 启动任务发送协程
    }
}
