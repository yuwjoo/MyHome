# UDP 模块重构问题清单

## 严重

### 3. AckManager key 碰撞风险
- **文件**: `AckManager.kt`、`UdpManager.kt`
- **描述**: 当 `ordered=false, needAck=true` 时 `seqNum` 恒为 0，`AckManager` 的 key 为 `"ip:0"`，连续两条消息后一条会覆盖前一条，前一条重传丢失。需要为非有序消息也生成唯一序列号。
- **方案**: 为所有 needAck 消息分配唯一序列号，不依赖 ordered。在 `publishUnicast` 中，将 `seqNum` 的生成逻辑改为 `val seqNum = if (needAck || ordered) seqTracker.nextSeq(targetIp) else 0`。同时 `AckManager` key 加上 `seqNum` 避免覆盖。
