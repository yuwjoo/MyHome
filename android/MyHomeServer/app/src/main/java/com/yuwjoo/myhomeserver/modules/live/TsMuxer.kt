package com.yuwjoo.myhomeserver.modules.live

import android.util.Log
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.FFmpegSession
import com.arthenica.ffmpegkit.ReturnCode
import java.io.File

/**
 * MP4 → MPEG-TS 转封装器
 *
 * 使用 ffmpeg 将 CameraX 录制的 MP4 重封装为标准 MPEG-TS，
 * 供 hls.js 直接播放。
 */
object TsMuxer {

    private const val TAG = "TsMuxer"

    /**
     * 将 MP4 文件转封装为 MPEG-TS 文件
     *
     * 仅容器重封装（-c copy），不重新编码，速度极快。
     *
     * @return 成功返回 true，失败返回 false
     */
    fun remuxMp4ToTs(mp4File: File, tsFile: File): Boolean {
        val cmd = "-y -i ${mp4File.absolutePath} -c copy -bsf:v h264_mp4toannexb -f mpegts ${tsFile.absolutePath}"
        Log.d(TAG, "ffmpeg: $cmd")

        val session: FFmpegSession = FFmpegKit.execute(cmd)
        val rc = session.returnCode

        return if (ReturnCode.isSuccess(rc)) {
            val output = session.allLogsAsString
            if (output.isNotBlank()) Log.d(TAG, output.trim())
            Log.d(TAG, "转封装完成: ${mp4File.name}(${mp4File.length()}B) → ${tsFile.name}(${tsFile.length()}B)")
            true
        } else {
            Log.e(TAG, "转封装失败 rc=$rc", null)
            Log.e(TAG, session.allLogsAsString)
            tsFile.delete()
            false
        }
    }
}
