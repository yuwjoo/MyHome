package com.yuwjoo.myhome.utils

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.MulticastSocket
import java.nio.charset.StandardCharsets

object UDPBroadcaster {
    private const val BROADCAST_IP = "255.255.255.255" // 广播地址

    /**
     * 发送广播
     * @param targetPort 目标端口
     * @param message 广播消息
     * @param count 发送次数
     * @param interval 发送间隔时间（ms）
     * @param callback 完成回调
     * @return datagramSocket对象
     */
    fun sendBroadcast(
        targetPort: Int,
        message: String,
        count: Int = 1,
        interval: Long = 0,
        callback: (() -> Unit)? = null
    ): DatagramSocket {
        val inetAddress = InetAddress.getByName(BROADCAST_IP)
        val sendData = message.toByteArray(StandardCharsets.UTF_8)
        val datagramSocket = DatagramSocket()
        val datagramPacket = DatagramPacket(
            sendData,
            sendData.size,
            inetAddress,
            targetPort
        )
        datagramSocket.broadcast = true // 发送设置为广播
        Thread {
            var num = 0
            while (!datagramSocket.isClosed && ++num <= count) {
                datagramSocket.send(datagramPacket)
                if (interval > 0) Thread.sleep(interval)
            }
            datagramSocket.close()
            callback?.invoke()
        }.start()

        return datagramSocket
    }

    /**
     * 接收广播
     * @param targetPort 目标端口
     * @param callback 接收回调
     * @return datagramSocket对象
     */
    fun receiveBroadcast(
        targetPort: Int,
        callback: (packet: DatagramPacket, socket: DatagramSocket) -> Unit
    ): DatagramSocket {
        val datagramSocket = DatagramSocket(targetPort)
        val buf = ByteArray(1024)
        val datagramPacket = DatagramPacket(buf, buf.size)
        Thread {
            while (!datagramSocket.isClosed) {
                datagramSocket.receive(datagramPacket)
                callback(datagramPacket, datagramSocket)
            }
        }.start()

        return datagramSocket
    }

    /**
     * 发送单播
     * @param targetHost 目标主机
     * @param targetPort 目标端口
     * @param message 广播消息
     * @param count 发送次数
     * @param interval 发送间隔时间（ms）
     * @param callback 完成回调
     * @return datagramSocket对象
     */
    fun sendUnicast(
        targetHost: String,
        targetPort: Int,
        message: String,
        count: Int = 1,
        interval: Long = 0,
        callback: (() -> Unit)? = null
    ): DatagramSocket {
        val inetAddress = InetAddress.getByName(targetHost)
        val sendData = message.toByteArray(StandardCharsets.UTF_8)
        val datagramSocket = DatagramSocket()
        val datagramPacket = DatagramPacket(
            sendData,
            sendData.size,
            inetAddress,
            targetPort
        )
        Thread {
            var num = 0
            while (!datagramSocket.isClosed && ++num <= count) {
                datagramSocket.send(datagramPacket)
                if (interval > 0) Thread.sleep(interval)
            }
            datagramSocket.close()
            callback?.invoke()
        }.start()

        return datagramSocket
    }

    /**
     * 接收单播
     * @param targetPort 目标端口
     * @param callback 接收回调
     * @return datagramSocket对象
     */
    fun receiveUnicast(
        targetPort: Int,
        callback: (packet: DatagramPacket, socket: DatagramSocket) -> Unit
    ): DatagramSocket {
        val datagramSocket = DatagramSocket(targetPort)
        val buf = ByteArray(1024)
        val datagramPacket = DatagramPacket(buf, buf.size)
        Thread {
            while (!datagramSocket.isClosed) {
                datagramSocket.receive(datagramPacket)
                callback(datagramPacket, datagramSocket)
            }
        }.start()

        return datagramSocket
    }

    /**
     * 发送组播
     * @param targetHost 目标主机
     * @param targetPort 目标端口
     * @param message 广播消息
     * @param count 发送次数
     * @param interval 发送间隔时间（ms）
     * @param callback 完成回调
     * @return multicastSocket对象
     */
    fun sendMulticast(
        targetHost: String,
        targetPort: Int,
        message: String,
        count: Int = 1,
        interval: Long = 0,
        callback: (() -> Unit)? = null
    ): MulticastSocket {
        val inetAddress = InetAddress.getByName(targetHost)
        val sendData = message.toByteArray(StandardCharsets.UTF_8)
        val multicastSocket = MulticastSocket(targetPort)
        val datagramPacket = DatagramPacket(
            sendData,
            sendData.size,
            inetAddress,
            targetPort
        )
        multicastSocket.timeToLive = 1
        multicastSocket.joinGroup(inetAddress) // 加入该组
        Thread {
            var num = 0
            while (!multicastSocket.isClosed && ++num <= count) {
                multicastSocket.send(datagramPacket)
                if (interval > 0) Thread.sleep(interval)
            }
            multicastSocket.close()
            callback?.invoke()
        }.start()

        return multicastSocket
    }

    /**
     * 接收组播
     * @param targetHost 目标主机
     * @param targetPort 目标端口
     * @param callback 接收回调
     * @return multicastSocket对象
     */
    fun receiveMulticast(
        targetHost: String,
        targetPort: Int,
        callback: (packet: DatagramPacket, socket: MulticastSocket) -> Unit
    ): MulticastSocket {
        val inetAddress = InetAddress.getByName(targetHost)
        val multicastSocket = MulticastSocket(targetPort)
        val buf = ByteArray(1024)
        val datagramPacket = DatagramPacket(
            buf,
            buf.size,
            inetAddress,
            targetPort
        )
        multicastSocket.joinGroup(inetAddress)
        Thread {
            while (!multicastSocket.isClosed) {
                multicastSocket.receive(datagramPacket)
                callback(datagramPacket, multicastSocket)
            }
        }.start()

        return multicastSocket
    }
}