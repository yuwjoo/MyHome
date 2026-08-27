import android.util.Log
import com.yuwjoo.myhome.module.peerudp.config.DeviceConfig
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
 * 消息发送状态
 */
enum class SendStatus { SUCCESS, FAILED, ABORT }

/**
 * 等待确认结果
 */
private enum class WaitResult {
    SUCCESS, // 已确认送达
    RETRY, // 序号失配已修正，立即重发
}

/**
 * 任务状态
 */
enum class TaskState {
    WAITING, // 等待中（已入队，尚未开始发送）
    FLYING, // 飞行中（已发送，等待确认）
    SUCCESS, // 成功（已确认送达）
    FAILED, // 失败（重试达到上限或设备不存在）
    ABORTED, // 中止（被停止/中止）
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
    private val onDone: (status: SendStatus) -> Unit = {}, // 完成回调
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
    
    private var waitAck: CompletableDeferred<WaitResult>? = null // 等待确认信号

    /**
     * 运行：状态不为等待中则不允许运行；置为飞行中后启动 IO 调度器协程发送消息并等待确认，
     * 超时未确认则循环重试，重试次数用完仍未确认时回调失败；收到确认时回调成功
     *
     * @param sendSeq   发送消息序号
     * @param maxRetry 最大重试次数，-1 表示不限制（默认）
     */
    fun run(sendSeq: Int, maxRetry: Int = -1) {
        if (state != TaskState.WAITING) return // 状态不为等待中，不允许运行
        state = TaskState.FLYING // 运行时将状态改为飞行中
        seq = sendSeq
        waitAck = CompletableDeferred<WaitResult>()
        job = sendScope.launch {
            var sendCount = 0 // 已发送次数
            while (isActive) {
                sendCount++
                sendFrame(data, seq) // 发送消息
                val result = try {
                    withTimeout(
                        DeviceConfig.MessageQueue.SEND_TIMEOUT_MS + DeviceConfig.MessageQueue.backoffDelay(sendCount)
                    ) {
                        waitAck.await() // 等待 waitAck 状态改变（收到确认）
                    }
                } catch (e: TimeoutCancellationException) {
                    null // 等待确认超时
                }
                when (result) {
                    WaitResult.SUCCESS -> {
                        state = TaskState.SUCCESS // 收到确认，状态改为成功
                        onDone(SendStatus.SUCCESS)
                        return@launch
                    }
                    WaitResult.RETRY -> Unit // 序号已被 ack 修正，立即重发
                    null -> {
                        sendCount++
                        if (maxRetry >= 0 && sendCount > maxRetry) {
                            Log.d(TAG, "run: reach maxRetry=$maxRetry, abort seq=$seq")
                            state = TaskState.FAILED // 重试次数用完仍未确认，状态改为失败
                            onDone(SendStatus.FAILED)
                            return@launch
                        }
                        Log.d(TAG, "run: timeout retry seq=$seq, sendCount=$sendCount")
                    }
                }
            }
        }
    }

    /**
     * 停止发送：取消当前发送协程（协程取消后状态置为中止并回调 ABORT）
     */
    fun stop() {
        job?.cancel()
    }

    /**
     * 以指定结果结束任务（外部用于设备不存在等异常场景直接回调完成）
     *
     * @param status 发送结果
     */
    fun finish(status: SendStatus) {
        onDone(status)
    }

    /**
     * 确认消息送达（收到对应序号的应答时调用，唤醒发送协程）
     *
     * @param recvSeq 对端当前允许接收的有序消息序号（收到的 Ack 负载 RecvSeq）
     */
    internal fun ack(recvSeq: Int) {
        if (recvSeq != this.seq) {
            this.seq = recvSeq and 0xFFFF // 两端序号失配，修正后立即重发
            waitAck?.complete(WaitResult.RETRY)
        } else {
            waitAck?.complete(WaitResult.SUCCESS)
        }
    }

    /**
     * 中止：立即将状态置为中止并停止发送（协程取消后回调 ABORT）
     */
    fun abort() {
        state = TaskState.ABORTED
        stop()
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
    fun enqueue(ip: String, data: ByteArray, onDone: (status: SendStatus) -> Unit = {}) {
        val queue = queues.getOrPut(ip) { ArrayDeque() }
        lateinit var task: DeviceMessageTask
        task = DeviceMessageTask(
            data = data,
            onDone = { status ->
                if (status == SendStatus.SUCCESS) deviceMap[ip]?.lastSendSeq = task.seq // 送达后更新设备已确认序号
                if (queue.peekFirst() === task) queue.removeFirst() // 任务结束移出队列
                if (queue.isNotEmpty()) startNext(ip, queue) else queues.remove(ip) // 驱动下一条或清理空队列
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
        queue.forEach { task ->
            if (task.state == TaskState.WAITING || task.state == TaskState.FLYING) task.abort() // 在跑任务由协程取消后回调 ABORT
            else {
                task.abort() // 未运行任务直接置为中止
                task.finish(SendStatus.ABORT) // 回调 ABORT
            }
        }
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
     * 停止指定设备的消息发送（取消正在发送的任务，回调 ABORT 后自动发送下一条）
     *
     * @param ip 设备 IP
     */
    fun stopJob(ip: String) {
        queues[ip]?.peekFirst()?.stop() // 停止正在发送的任务（协程取消后回调 ABORT）
    }

    /**
     * 确认设备消息已送达（收到对应序号的应答时调用，标记消息已送达）
     *
     * @param ip     设备 IP
     * @param seq    已送达的消息序号（收到的 Ack 负载 AckSeq）
     * @param recvSeq 对端当前允许接收的有序消息序号（收到的 Ack 负载 RecvSeq）
     */
    fun ack(ip: String, seq: Int, recvSeq: Int) {
        queues[ip]?.peekFirst()?.ack(recvSeq) // 队列头部即当前正在发送的任务
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
            task.finish(SendStatus.FAILED)
            return
        }
        task.run(device.nextSendSeq) // 启动任务发送协程
    }
}
